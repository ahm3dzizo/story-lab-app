-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert employees" ON public.employees;
DROP POLICY IF EXISTS "Users can view all employees" ON public.employees;
DROP POLICY IF EXISTS "Users can update employees" ON public.employees;
DROP POLICY IF EXISTS "Users can delete employees" ON public.employees;

-- Enable RLS on employees table if not already enabled
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Add INSERT policy for employees table
CREATE POLICY "Users can insert employees"
    ON public.employees
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Add policy for viewing all employees
CREATE POLICY "Users can view all employees"
    ON public.employees
    FOR SELECT
    USING (true);

-- Add policy for updating employees
CREATE POLICY "Users can update employees"
    ON public.employees
    FOR UPDATE
    USING (auth.role() = 'authenticated');

-- Add policy for deleting employees
CREATE POLICY "Users can delete employees"
    ON public.employees
    FOR DELETE
    USING (auth.role() = 'authenticated'); 