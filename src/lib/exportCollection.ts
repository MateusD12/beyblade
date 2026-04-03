import * as XLSX from 'xlsx';
import { CollectionItem } from '@/types/beyblade';
import { getGenerationLabel } from '@/lib/beybladeNormalization';
import { getSeriesOrder, getGenerationOrder } from '@/lib/beybladeOrder';

export function exportCollectionToExcel(collection: CollectionItem[]) {
  const sorted = [...collection].sort((a, b) => {
    const seriesDiff = getSeriesOrder(a.beyblade?.series || '') - getSeriesOrder(b.beyblade?.series || '');
    if (seriesDiff !== 0) return seriesDiff;
    return getGenerationOrder(a.beyblade?.generation || '') - getGenerationOrder(b.beyblade?.generation || '');
  });

  const rows = sorted.map(item => ({
    'Série': item.beyblade?.series || '—',
    'Geração': item.beyblade?.generation ? getGenerationLabel(item.beyblade.generation) : '—',
    'Nome': item.beyblade?.name || item.custom_name || '—',
    'Tipo': item.beyblade?.type || '—',
    'Condição': item.condition || '—',
    'Direção de Giro': item.spin_direction || '—',
    'Data de Aquisição': item.acquired_at ? new Date(item.acquired_at).toLocaleDateString('pt-BR') : '—',
    'Notas': item.notes || '—',
  }));

  const ws = XLSX.utils.json_to_sheet(rows);

  // Auto column widths
  const colWidths = Object.keys(rows[0] || {}).map(key => ({
    wch: Math.max(key.length, ...rows.map(r => String((r as any)[key]).length)) + 2,
  }));
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Coleção');
  XLSX.writeFile(wb, `minha-colecao-beyblade-${new Date().toISOString().slice(0, 10)}.xlsx`);
}
