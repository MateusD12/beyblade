-- Allow authenticated users to update beyblade_catalog entries
CREATE POLICY "Usuários autenticados podem atualizar o catálogo"
ON public.beyblade_catalog
FOR UPDATE
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);