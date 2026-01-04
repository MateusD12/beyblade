-- Tabela de catálogo de Beyblades (informações gerais)
CREATE TABLE public.beyblade_catalog (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_hasbro TEXT,
  series TEXT NOT NULL,
  generation TEXT NOT NULL,
  type TEXT NOT NULL,
  components JSONB,
  specs JSONB,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de coleção do usuário
CREATE TABLE public.user_collection (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  beyblade_id UUID REFERENCES public.beyblade_catalog(id) ON DELETE CASCADE,
  custom_name TEXT,
  photo_url TEXT,
  condition TEXT DEFAULT 'good',
  notes TEXT,
  acquired_at DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de perfis de usuário
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.beyblade_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_collection ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas para catálogo (público para leitura, apenas sistema insere)
CREATE POLICY "Catálogo visível para todos" 
ON public.beyblade_catalog 
FOR SELECT 
USING (true);

CREATE POLICY "Usuários autenticados podem inserir no catálogo" 
ON public.beyblade_catalog 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Políticas para coleção do usuário
CREATE POLICY "Usuários veem sua própria coleção" 
ON public.user_collection 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários criam itens na sua coleção" 
ON public.user_collection 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários atualizam sua coleção" 
ON public.user_collection 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários deletam da sua coleção" 
ON public.user_collection 
FOR DELETE 
USING (auth.uid() = user_id);

-- Políticas para perfis
CREATE POLICY "Perfis visíveis para todos" 
ON public.profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Usuários criam seu perfil" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários atualizam seu perfil" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_beyblade_catalog_updated_at
BEFORE UPDATE ON public.beyblade_catalog
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_collection_updated_at
BEFORE UPDATE ON public.user_collection
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket para fotos
INSERT INTO storage.buckets (id, name, public) VALUES ('beyblade-photos', 'beyblade-photos', true);

-- Políticas de storage
CREATE POLICY "Fotos públicas para visualização" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'beyblade-photos');

CREATE POLICY "Usuários autenticados podem fazer upload" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'beyblade-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Usuários podem deletar suas fotos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'beyblade-photos' AND auth.uid()::text = (storage.foldername(name))[1]);