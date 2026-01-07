ALTER TABLE user_collection 
ADD COLUMN spin_direction text DEFAULT NULL 
CHECK (spin_direction IN ('L', 'R', 'R/L'));