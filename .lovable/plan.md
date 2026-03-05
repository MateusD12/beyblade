
# Plano: Corrigir Classificações e Adicionar Gerenciamento de Séries/Gerações

## Resumo do Problema

Foram identificados vários problemas de classificação das Beyblades:

1. **Séries duplicadas:** "Beyblade Burst Clássico" aparece separada de "Beyblade Burst"
2. **Gerações duplicadas:** "Basic_Line" vs "Basic Line" (com underscore)
3. **Gerações incorretas para Beyblade X:** PerseusDark e WizardArc estão em "Xtreme Gear Sports" mas segundo o usuário deveriam estar em outra geração

---

## Parte 1: Correção Imediata dos Dados

### 1.1 Migração SQL para Corrigir Dados Existentes

Executar SQL para normalizar os dados inconsistentes:

```sql
-- Corrigir série "Beyblade Burst Clássico" → "Beyblade Burst"
UPDATE beyblade_catalog 
SET series = 'Beyblade Burst' 
WHERE series = 'Beyblade Burst Clássico';

-- Corrigir geração "Basic_Line" → "Basic Line"
UPDATE beyblade_catalog 
SET generation = 'Basic Line' 
WHERE generation = 'Basic_Line';

-- Adicionar geração UX System se não existir no mapeamento
-- (CX não parece ser uma geração oficial, verificar se é UX)
```

### 1.2 Atualizar Edge Functions

Remover referências a "Beyblade Burst Clássico" dos prompts:

| Arquivo | Alteração |
|---------|-----------|
| `fetch-beyblade-details/index.ts` | Substituir "Beyblade Burst Clássico" por "Beyblade Burst" |
| `identify-beyblade/index.ts` | Mesma correção |

---

## Parte 2: Atualizar Gerações do Beyblade X

### 2.1 Gerações Oficiais do Beyblade X

Segundo informações oficiais, as gerações são:

| Código | Nome Completo | Descrição |
|--------|---------------|-----------|
| BX | Basic Line | Linha básica inicial (2023) |
| UX | UX System | Sistema UX (novo formato) |
| CX | Xtreme Gear Sports | Linha "Collab/Crossover" ou edições especiais |

### 2.2 Atualizar Normalização

Adicionar ao `beybladeNormalization.ts`:

```typescript
// Beyblade X - novas gerações
'CX': 'Xtreme Gear Sports',  // CX são edições crossover/especiais
'CX System': 'Xtreme Gear Sports',
'XGS': 'Xtreme Gear Sports',
'Xtreme Gear Sports': 'Xtreme Gear Sports',
```

### 2.3 Atualizar Ordem

Adicionar ao `beybladeOrder.ts`:

```typescript
// Beyblade X (mais novo primeiro)
'Xtreme Gear Sports': 1,  // XGS/CX - mais recente
'UX System': 2,           // UX
'Basic Line': 3,          // BX - primeiro
```

---

## Parte 3: Interface de Gerenciamento de Séries/Gerações

### 3.1 Nova Página de Administração

Criar `/admin/catalog` com funcionalidades:

1. **Visualizar Séries/Gerações:**
   - Lista de todas as séries únicas
   - Lista de gerações por série
   - Contagem de Beyblades em cada

2. **Editar Série/Geração:**
   - Renomear série (atualiza todas as Beyblades)
   - Renomear geração (atualiza todas da série)
   - Mesclar séries/gerações duplicadas

3. **Remanejar Beyblade:**
   - Selecionar Beyblade individual
   - Alterar série e/ou geração
   - Confirmação antes de salvar

### 3.2 Componentes a Criar

| Componente | Descrição |
|------------|-----------|
| `CatalogAdmin.tsx` | Página principal de administração |
| `SeriesManager.tsx` | Gerenciamento de séries |
| `GenerationManager.tsx` | Gerenciamento de gerações por série |
| `BeybladeReassign.tsx` | Modal para remanejar Beyblade |

### 3.3 Fluxo da Interface

```text
┌─────────────────────────────────────────────────────────┐
│                 Gerenciar Catálogo                      │
├─────────────────────────────────────────────────────────┤
│  [Séries] [Gerações] [Beyblades]                        │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Beyblade X                           [Editar]   │    │
│  │   • Xtreme Gear Sports (5)           [Editar]   │    │
│  │   • Basic Line (5)                   [Editar]   │    │
│  │   • UX System (0)                    [Editar]   │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Beyblade Burst                       [Editar]   │    │
│  │   • SpeedStorm (4)                   [Editar]   │    │
│  │   • QuadStrike (2)                   [Editar]   │    │
│  │   • GT (2)                           [Editar]   │    │
│  │   • Superking (1)                    [Editar]   │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  [+ Criar Nova Série] [+ Criar Nova Geração]            │
└─────────────────────────────────────────────────────────┘
```

---

## Parte 4: Funcionalidade de Remanejar Beyblade

### 4.1 Na Página de Catálogo

Adicionar botão "Editar Classificação" no modal de detalhes:

- Dropdown para selecionar nova série
- Dropdown para selecionar nova geração (filtrado pela série)
- Botão salvar com confirmação

### 4.2 Bulk Actions

Na página de administração, permitir:

- Selecionar múltiplas Beyblades
- Mover todas para nova série/geração
- Útil para correções em lote

---

## Arquivos a Modificar/Criar

| Arquivo | Ação |
|---------|------|
| `supabase/migrations/xxx.sql` | Corrigir dados existentes |
| `supabase/functions/identify-beyblade/index.ts` | Remover "Burst Clássico" |
| `supabase/functions/fetch-beyblade-details/index.ts` | Remover "Burst Clássico" |
| `src/lib/beybladeNormalization.ts` | Adicionar aliases CX/XGS |
| `src/lib/beybladeOrder.ts` | Confirmar ordem correta |
| `src/pages/CatalogAdmin.tsx` | Nova página de administração |
| `src/pages/Catalog.tsx` | Adicionar botão de edição |
| `src/components/EditBeybladeClassification.tsx` | Modal de edição |
| `src/App.tsx` | Adicionar rota /admin/catalog |

---

## Ordem de Implementação

1. **Imediato:** Migração SQL para corrigir dados existentes
2. **Depois:** Atualizar edge functions (remover "Burst Clássico")
3. **Em seguida:** Criar interface de gerenciamento
4. **Por último:** Adicionar funcionalidade de remanejar

---

## Perguntas para o Usuário

Antes de implementar, preciso confirmar:

1. **PerseusDark B6-80W e WizardArc R4-55LO:** Qual é a geração correta? 
   - São "UX System"? 
   - São "Xtreme Gear Sports" mesmo?
   - São de outra geração específica?

2. **O que é "CX"?** Você mencionou CX - é uma geração oficial ou você quis dizer "UX"?

3. **Permissões:** A página de administração deve ser acessível a todos os usuários logados ou apenas administradores?
