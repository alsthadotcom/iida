-- Add password column to user_info table
-- NOT NULL constraint with default empty string to handle existing rows
ALTER TABLE public.user_info 
ADD COLUMN IF NOT EXISTS password TEXT NOT NULL DEFAULT '';

-- Comment to explain the purpose
COMMENT ON COLUMN public.user_info.password IS 'Stores user password as requested. ensure security implications are managed.';
