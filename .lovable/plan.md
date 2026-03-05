
## Problema Identificado

Dois pontos causam a classificação incorreta das Beyblades da linha BX:

**1. Prompt ambíguo no `fetch-beyblade-details`:**
- Linha 216: o exemplo no JSON template diz `"Linha específica (Xtreme Gear, QuadStrike..."` — usa "Xtreme Gear" como exemplo padrão, induzindo a IA a escolhê-lo mesmo para beys BX.
- Falta instrução explícita sobre como determinar BX vs UX vs CX a partir das categorias da wiki.

**2. Fallback hardcodado (linha 304):**
```typescript
// Atual — classifica TUDO de Beyblade X como "Xtreme Gear"
generation = "Xtreme Gear";
```

**3. Prompt do `identify-beyblade`:**
- As gerações do Beyblade X são listadas de forma correta, mas o exemplo no campo `generation` não reforça que BX deve retornar exatamente "Basic Line".

---

## Plano de Correção

### 1. Atualizar `fetch-beyblade-details/index.ts`

**Prompt** (linha 216): substituir o exemplo vago por instruções explícitas:
```
"generation": "Para Beyblade X: use EXATAMENTE 'Basic Line' (BX), 'UX System' (UX) ou 'Xtreme Gear Sports' (CX/XGS). Identifique pelo prefixo do código: BX = Basic Line, UX = UX System, CX = Xtreme Gear Sports"
```

**Fallback** (linhas 302-304): adicionar lógica para detectar a geração pelo nome da bey:
```typescript
if (categories.some((c) => c.toLowerCase().includes("beyblade x"))) {
  series = "Beyblade X";
  // Detect by page title prefix
  const titleUpper = pageTitle.toUpperCase();
  if (titleUpper.includes(' UX') || titleUpper.startsWith('UX')) {
    generation = "UX System";
  } else if (titleUpper.includes(' CX') || titleUpper.startsWith('CX')) {
    generation = "Xtreme Gear Sports";
  } else {
    generation = "Basic Line"; // BX default
  }
}
```

### 2. Atualizar `identify-beyblade/index.ts`

Adicionar instrução clara na seção de gerações (linha ~132):
```
Beyblade X - REGRA DE CLASSIFICAÇÃO:
  - O código da bey SEMPRE começa com BX, UX ou CX
  - BX-XX → geração: "Basic Line"
  - UX-XX → geração: "UX System"  
  - CX-XX → geração: "Xtreme Gear Sports"
  - Se não tiver código visível, use "Basic Line" como padrão para Beyblade X
```

### 3. Corrigir dados existentes no banco

SQL para corrigir as beys que já entraram com classificação errada:
```sql
-- Corrigir geração genérica "Beyblade X" → "Basic Line"
UPDATE beyblade_catalog 
SET generation = 'Basic Line' 
WHERE series = 'Beyblade X' AND generation = 'Beyblade X';

-- Corrigir "Xtreme Gear" (sem "Sports") → "Xtreme Gear Sports"
UPDATE beyblade_catalog 
SET generation = 'Xtreme Gear Sports' 
WHERE series = 'Beyblade X' AND generation = 'Xtreme Gear';
```

---

## Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/fetch-beyblade-details/index.ts` | Corrigir prompt e fallback de geração BX/UX/CX |
| `supabase/functions/identify-beyblade/index.ts` | Adicionar regra explícita de prefixo BX/UX/CX |
| Banco de dados (migration) | Corrigir registros já salvos incorretamente |
