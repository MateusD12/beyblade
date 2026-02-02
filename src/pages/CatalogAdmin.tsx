import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCatalog } from '@/hooks/useCatalog';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  Edit2, 
  FolderTree, 
  Layers, 
  ArrowLeftRight,
  Save,
  X,
  ChevronDown,
  ChevronRight,
  Settings,
  ArrowLeft,
} from 'lucide-react';
import { getSeriesOrder, getGenerationOrder } from '@/lib/beybladeOrder';

export default function CatalogAdmin() {
  const { user, loading: authLoading } = useAuth();
  const { catalog, isLoading, refetch } = useCatalog();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  // State for editing
  const [editSeriesDialog, setEditSeriesDialog] = useState<{ open: boolean; oldName: string; newName: string }>({
    open: false, oldName: '', newName: ''
  });
  const [editGenerationDialog, setEditGenerationDialog] = useState<{ open: boolean; series: string; oldName: string; newName: string }>({
    open: false, series: '', oldName: '', newName: ''
  });
  const [reassignDialog, setReassignDialog] = useState<{ open: boolean; beybladeIds: string[]; newSeries: string; newGeneration: string }>({
    open: false, beybladeIds: [], newSeries: '', newGeneration: ''
  });
  const [selectedBeyblades, setSelectedBeyblades] = useState<Set<string>>(new Set());
  const [expandedSeries, setExpandedSeries] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  // Compute series and generations from catalog
  const seriesData = useMemo(() => {
    const data: Record<string, { generations: Record<string, string[]>; total: number }> = {};
    
    catalog.forEach(b => {
      if (!data[b.series]) {
        data[b.series] = { generations: {}, total: 0 };
      }
      if (!data[b.series].generations[b.generation]) {
        data[b.series].generations[b.generation] = [];
      }
      data[b.series].generations[b.generation].push(b.id);
      data[b.series].total++;
    });
    
    // Sort series by order
    const sortedSeries = Object.keys(data).sort((a, b) => getSeriesOrder(a) - getSeriesOrder(b));
    
    const result: Array<{ 
      series: string; 
      total: number; 
      generations: Array<{ name: string; beybladeIds: string[] }>;
    }> = [];
    
    sortedSeries.forEach(series => {
      const genNames = Object.keys(data[series].generations)
        .sort((a, b) => getGenerationOrder(a) - getGenerationOrder(b));
      
      result.push({
        series,
        total: data[series].total,
        generations: genNames.map(name => ({
          name,
          beybladeIds: data[series].generations[name],
        })),
      });
    });
    
    return result;
  }, [catalog]);

  const allSeries = useMemo(() => [...new Set(catalog.map(b => b.series))].sort(), [catalog]);
  const allGenerations = useMemo(() => [...new Set(catalog.map(b => b.generation))].sort(), [catalog]);

  // Get generations for a specific series
  const getGenerationsForSeries = (series: string) => {
    return [...new Set(catalog.filter(b => b.series === series).map(b => b.generation))].sort();
  };

  // Handlers
  const handleEditSeries = async () => {
    if (!editSeriesDialog.newName.trim() || editSeriesDialog.newName === editSeriesDialog.oldName) {
      setEditSeriesDialog({ open: false, oldName: '', newName: '' });
      return;
    }
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('beyblade_catalog')
        .update({ series: editSeriesDialog.newName.trim() })
        .eq('series', editSeriesDialog.oldName);
      
      if (error) throw error;
      
      toast.success(`Série renomeada para "${editSeriesDialog.newName}"`);
      await refetch();
      queryClient.invalidateQueries({ queryKey: ['catalog'] });
    } catch (error) {
      console.error('Error updating series:', error);
      toast.error('Erro ao renomear série');
    } finally {
      setSaving(false);
      setEditSeriesDialog({ open: false, oldName: '', newName: '' });
    }
  };

  const handleEditGeneration = async () => {
    if (!editGenerationDialog.newName.trim() || editGenerationDialog.newName === editGenerationDialog.oldName) {
      setEditGenerationDialog({ open: false, series: '', oldName: '', newName: '' });
      return;
    }
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('beyblade_catalog')
        .update({ generation: editGenerationDialog.newName.trim() })
        .eq('series', editGenerationDialog.series)
        .eq('generation', editGenerationDialog.oldName);
      
      if (error) throw error;
      
      toast.success(`Geração renomeada para "${editGenerationDialog.newName}"`);
      await refetch();
      queryClient.invalidateQueries({ queryKey: ['catalog'] });
    } catch (error) {
      console.error('Error updating generation:', error);
      toast.error('Erro ao renomear geração');
    } finally {
      setSaving(false);
      setEditGenerationDialog({ open: false, series: '', oldName: '', newName: '' });
    }
  };

  const handleReassign = async () => {
    if (!reassignDialog.newSeries || !reassignDialog.newGeneration || reassignDialog.beybladeIds.length === 0) {
      setReassignDialog({ open: false, beybladeIds: [], newSeries: '', newGeneration: '' });
      return;
    }
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('beyblade_catalog')
        .update({ 
          series: reassignDialog.newSeries, 
          generation: reassignDialog.newGeneration 
        })
        .in('id', reassignDialog.beybladeIds);
      
      if (error) throw error;
      
      toast.success(`${reassignDialog.beybladeIds.length} Beyblade(s) remanejada(s)`);
      await refetch();
      queryClient.invalidateQueries({ queryKey: ['catalog'] });
      setSelectedBeyblades(new Set());
    } catch (error) {
      console.error('Error reassigning:', error);
      toast.error('Erro ao remanejar Beyblades');
    } finally {
      setSaving(false);
      setReassignDialog({ open: false, beybladeIds: [], newSeries: '', newGeneration: '' });
    }
  };

  const toggleSeriesExpand = (series: string) => {
    const newExpanded = new Set(expandedSeries);
    if (newExpanded.has(series)) {
      newExpanded.delete(series);
    } else {
      newExpanded.add(series);
    }
    setExpandedSeries(newExpanded);
  };

  const toggleBeybladeSelection = (id: string) => {
    const newSelected = new Set(selectedBeyblades);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedBeyblades(newSelected);
  };

  const selectAllInGeneration = (beybladeIds: string[]) => {
    const newSelected = new Set(selectedBeyblades);
    beybladeIds.forEach(id => newSelected.add(id));
    setSelectedBeyblades(newSelected);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto py-6 px-4">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/catalog')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Settings className="h-6 w-6" />
              Gerenciar Catálogo
            </h1>
            <p className="text-muted-foreground">
              Editar séries, gerações e remanejar Beyblades
            </p>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview" className="gap-2">
              <FolderTree className="h-4 w-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="beyblades" className="gap-2">
              <Layers className="h-4 w-4" />
              Beyblades
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {seriesData.map(({ series, total, generations }) => (
              <Card key={series}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div 
                      className="flex items-center gap-2 cursor-pointer"
                      onClick={() => toggleSeriesExpand(series)}
                    >
                      {expandedSeries.has(series) ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronRight className="h-5 w-5" />
                      )}
                      <CardTitle className="text-lg">{series}</CardTitle>
                      <Badge variant="secondary">{total}</Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditSeriesDialog({ 
                        open: true, 
                        oldName: series, 
                        newName: series 
                      })}
                    >
                      <Edit2 className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                  </div>
                </CardHeader>
                
                {expandedSeries.has(series) && (
                  <CardContent className="pt-2">
                    <div className="space-y-2">
                      {generations.map(({ name, beybladeIds }) => (
                        <div 
                          key={name} 
                          className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/50"
                        >
                          <div className="flex items-center gap-2">
                            <span>{name}</span>
                            <Badge variant="outline">{beybladeIds.length}</Badge>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                selectAllInGeneration(beybladeIds);
                                toast.info(`${beybladeIds.length} Beyblades selecionadas`);
                              }}
                            >
                              <ArrowLeftRight className="h-4 w-4 mr-1" />
                              Selecionar
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditGenerationDialog({
                                open: true,
                                series,
                                oldName: name,
                                newName: name,
                              })}
                            >
                              <Edit2 className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </TabsContent>

          {/* Beyblades Tab */}
          <TabsContent value="beyblades">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Todas as Beyblades</CardTitle>
                    <CardDescription>
                      Selecione Beyblades para remanejar para outra série/geração
                    </CardDescription>
                  </div>
                  {selectedBeyblades.size > 0 && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setSelectedBeyblades(new Set())}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Limpar ({selectedBeyblades.size})
                      </Button>
                      <Button
                        onClick={() => setReassignDialog({
                          open: true,
                          beybladeIds: Array.from(selectedBeyblades),
                          newSeries: '',
                          newGeneration: '',
                        })}
                      >
                        <ArrowLeftRight className="h-4 w-4 mr-1" />
                        Remanejar Selecionadas
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Série</TableHead>
                      <TableHead>Geração</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="w-24">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {catalog.map((beyblade) => (
                      <TableRow key={beyblade.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedBeyblades.has(beyblade.id)}
                            onCheckedChange={() => toggleBeybladeSelection(beyblade.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{beyblade.name}</TableCell>
                        <TableCell>{beyblade.series}</TableCell>
                        <TableCell>{beyblade.generation}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{beyblade.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setReassignDialog({
                              open: true,
                              beybladeIds: [beyblade.id],
                              newSeries: beyblade.series,
                              newGeneration: beyblade.generation,
                            })}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Edit Series Dialog */}
      <Dialog open={editSeriesDialog.open} onOpenChange={(open) => !open && setEditSeriesDialog({ open: false, oldName: '', newName: '' })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Série</DialogTitle>
            <DialogDescription>
              Renomear a série irá atualizar todas as Beyblades nela.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome Atual</Label>
              <Input value={editSeriesDialog.oldName} disabled />
            </div>
            <div>
              <Label>Novo Nome</Label>
              <Input 
                value={editSeriesDialog.newName}
                onChange={(e) => setEditSeriesDialog(prev => ({ ...prev, newName: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditSeriesDialog({ open: false, oldName: '', newName: '' })}>
              Cancelar
            </Button>
            <Button onClick={handleEditSeries} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Generation Dialog */}
      <Dialog open={editGenerationDialog.open} onOpenChange={(open) => !open && setEditGenerationDialog({ open: false, series: '', oldName: '', newName: '' })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Geração</DialogTitle>
            <DialogDescription>
              Renomear a geração irá atualizar todas as Beyblades nela.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Série</Label>
              <Input value={editGenerationDialog.series} disabled />
            </div>
            <div>
              <Label>Nome Atual</Label>
              <Input value={editGenerationDialog.oldName} disabled />
            </div>
            <div>
              <Label>Novo Nome</Label>
              <Input 
                value={editGenerationDialog.newName}
                onChange={(e) => setEditGenerationDialog(prev => ({ ...prev, newName: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditGenerationDialog({ open: false, series: '', oldName: '', newName: '' })}>
              Cancelar
            </Button>
            <Button onClick={handleEditGeneration} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reassign Dialog */}
      <Dialog open={reassignDialog.open} onOpenChange={(open) => !open && setReassignDialog({ open: false, beybladeIds: [], newSeries: '', newGeneration: '' })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remanejar Beyblades</DialogTitle>
            <DialogDescription>
              {reassignDialog.beybladeIds.length === 1 
                ? 'Mover esta Beyblade para outra série/geração.'
                : `Mover ${reassignDialog.beybladeIds.length} Beyblades para outra série/geração.`
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nova Série</Label>
              <Select 
                value={reassignDialog.newSeries}
                onValueChange={(value) => setReassignDialog(prev => ({ 
                  ...prev, 
                  newSeries: value,
                  newGeneration: '' // Reset generation when series changes
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a série" />
                </SelectTrigger>
                <SelectContent>
                  {allSeries.map(series => (
                    <SelectItem key={series} value={series}>{series}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nova Geração</Label>
              <Select 
                value={reassignDialog.newGeneration}
                onValueChange={(value) => setReassignDialog(prev => ({ ...prev, newGeneration: value }))}
                disabled={!reassignDialog.newSeries}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a geração" />
                </SelectTrigger>
                <SelectContent>
                  {reassignDialog.newSeries && getGenerationsForSeries(reassignDialog.newSeries).map(gen => (
                    <SelectItem key={gen} value={gen}>{gen}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReassignDialog({ open: false, beybladeIds: [], newSeries: '', newGeneration: '' })}>
              Cancelar
            </Button>
            <Button 
              onClick={handleReassign} 
              disabled={saving || !reassignDialog.newSeries || !reassignDialog.newGeneration}
            >
              {saving ? 'Salvando...' : 'Remanejar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
