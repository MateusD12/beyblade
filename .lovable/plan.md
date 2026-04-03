

# Plano: Exportar Coleção para Excel

## O que será feito

Adicionar um botão "Exportar Excel" na página da coleção que gera um arquivo `.xlsx` com todas as Beyblades do usuário, organizado por série e geração.

## Estrutura do Excel

| Série | Geração | Nome | Tipo | Condição | Direção de Giro | Data de Aquisição | Notas |
|-------|---------|------|------|----------|-----------------|-------------------|-------|
| Beyblade X | BX | DranSword 3-60F | Ataque | Bom | R | 2024-01-15 | — |
| Beyblade X | CX | PerseusDark B6-80W | Equilíbrio | Bom | L | — | — |

- Ordenado por série e geração (usando os rótulos curtos BX/UX/CX para Beyblade X)
- Cabeçalhos em negrito com cor de fundo
- Colunas com largura automática

## Implementação

### 1. Instalar dependência `xlsx`
Pacote `xlsx` (SheetJS) para gerar o arquivo no lado do cliente sem necessidade de backend.

### 2. Criar utilitário `src/lib/exportCollection.ts`
Função que recebe o array de `CollectionItem[]` e:
- Mapeia os dados para linhas com colunas: Série, Geração (com label curto), Nome, Tipo, Condição, Direção de Giro, Data de Aquisição, Notas
- Ordena por série → geração
- Gera o arquivo `.xlsx` e dispara o download

### 3. Adicionar botão na `Collection.tsx`
Botão com ícone de download ao lado dos filtros existentes, visível apenas quando há itens na coleção.

## Arquivos

| Arquivo | Ação |
|---------|------|
| `package.json` | Adicionar `xlsx` |
| `src/lib/exportCollection.ts` | Criar função de exportação |
| `src/pages/Collection.tsx` | Adicionar botão de exportar |

