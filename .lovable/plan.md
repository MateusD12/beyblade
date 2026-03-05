
## Problema

3 beys BX estão na geração errada no banco:
- `Venom 3-80N` → "Xtreme Gear Sports" ❌ → deveria ser "Basic Line"
- `CobaltDragoon 2-60C` → "Xtreme Gear Sports" ❌ → deveria ser "Basic Line"
- `DranSword 3-60F` → "Xtreme Gear Sports" ❌ → deveria ser "Basic Line"

As 2 beys CX estão corretas:
- `PerseusDark B6-80W` → "Xtreme Gear Sports" ✅
- `WizardArc R4-55LO` → "Xtreme Gear Sports" ✅

O usuário também quer que os títulos das seções mostrem **BX**, **UX**, **CX** em vez de "Basic Line", "UX System", "Xtreme Gear Sports".

---

## Plano

### 1. Corrigir dados no banco (SQL UPDATE)

```sql
UPDATE beyblade_catalog
SET generation = 'Basic Line'
WHERE name IN ('Venom 3-80N', 'CobaltDragoon 2-60C', 'DranSword 3-60F')
  AND series = 'Beyblade X';
```

### 2. Criar função de mapeamento para rótulo curto das gerações

Em `src/lib/beybladeNormalization.ts`, adicionar:

```typescript
export const GENERATION_LABEL: Record<string, string> = {
  'Basic Line': 'BX',
  'UX System': 'UX',
  'Xtreme Gear Sports': 'CX',
};

export function getGenerationLabel(generation: string): string {
  return GENERATION_LABEL[generation] ?? generation;
}
```

### 3. Usar o rótulo curto nos títulos de seção

Em `src/pages/Collection.tsx` e `src/pages/Catalog.tsx`, onde o nome da geração é exibido nos acordeões/títulos de seção, substituir `{generation}` por `{getGenerationLabel(generation)}`.

Assim:
- "Basic Line" → **BX**
- "UX System" → **UX**  
- "Xtreme Gear Sports" → **CX**
- Outras gerações (QuadStrike, GT, etc.) continuam com o nome completo

### Arquivos

| Arquivo | Ação |
|---------|------|
| Banco de dados | Corrigir as 3 beys para "Basic Line" |
| `src/lib/beybladeNormalization.ts` | Adicionar `GENERATION_LABEL` e `getGenerationLabel` |
| `src/pages/Collection.tsx` | Usar rótulo curto no título da geração |
| `src/pages/Catalog.tsx` | Usar rótulo curto no título da geração (se aplicável) |
