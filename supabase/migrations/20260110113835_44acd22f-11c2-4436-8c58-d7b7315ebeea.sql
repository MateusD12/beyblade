-- Adicionar coluna wiki_url na tabela beyblade_catalog
ALTER TABLE public.beyblade_catalog ADD COLUMN IF NOT EXISTS wiki_url text;