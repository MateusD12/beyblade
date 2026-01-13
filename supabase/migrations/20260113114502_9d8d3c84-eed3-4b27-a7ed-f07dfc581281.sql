-- Normalizar tipos: Resistência → Stamina
UPDATE beyblade_catalog 
SET type = 'Stamina' 
WHERE type = 'Resistência';

-- Verificar e corrigir outros possíveis tipos em inglês que devem ser português
UPDATE beyblade_catalog SET type = 'Ataque' WHERE type = 'Attack';
UPDATE beyblade_catalog SET type = 'Defesa' WHERE type = 'Defense';
UPDATE beyblade_catalog SET type = 'Equilíbrio' WHERE type = 'Balance';