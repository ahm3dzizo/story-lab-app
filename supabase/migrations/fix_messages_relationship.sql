-- Fix the relationship between messages and users tables using profiles instead

-- First, check if profiles table exists, if not create it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles'
    ) THEN
        CREATE TABLE public.profiles (
            id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            email TEXT,
            full_name TEXT,
            avatar_url TEXT,
            updated_at TIMESTAMPTZ DEFAULT now(),
            created_at TIMESTAMPTZ DEFAULT now()
        );

        RAISE NOTICE 'Created profiles table';
    ELSE
        RAISE NOTICE 'Profiles table already exists';
    END IF;
END
$$;

-- Check for messages with user_ids that don't have corresponding profiles
DO $$
DECLARE
    user_id_var UUID;
    message_count INT := 0;
BEGIN
    -- Create a temporary table of all distinct user_ids in messages
    CREATE TEMP TABLE IF NOT EXISTS distinct_message_users AS
    SELECT DISTINCT user_id FROM public.messages;
    
    -- For each message user_id, ensure a profile exists
    FOR user_id_var IN SELECT user_id FROM distinct_message_users LOOP
        -- Check if the user exists in profiles
        IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id_var) THEN
            -- Create a placeholder profile for this user
            INSERT INTO public.profiles (id, email, full_name)
            VALUES (
                user_id_var,
                'user-' || user_id_var || '@example.com',
                'User ' || substring(user_id_var::text, 1, 8)
            );
            message_count := message_count + 1;
        END IF;
    END LOOP;
    
    DROP TABLE IF EXISTS distinct_message_users;
    
    IF message_count > 0 THEN
        RAISE NOTICE 'Created % placeholder profiles for message users', message_count;
    ELSE
        RAISE NOTICE 'All message user_ids already have corresponding profiles';
    END IF;
END
$$;

-- Also insert any existing auth.users into profiles table that aren't there yet
INSERT INTO public.profiles (id, email, full_name)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'full_name', email) as full_name
FROM auth.users
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.users.id
)
ON CONFLICT (id) DO NOTHING;

-- Ensure profiles has proper RLS policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can read profiles
DROP POLICY IF EXISTS "Anyone can read profiles" ON public.profiles;
CREATE POLICY "Anyone can read profiles" 
ON public.profiles FOR SELECT 
USING (true);

-- Users can update their own profiles only
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- First, check if messages table exists, if not create it
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    message TEXT NOT NULL,
    message_type TEXT DEFAULT 'text',
    is_edited BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'sent',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add the foreign key relationship if it doesn't exist - this time to profiles
DO $$
BEGIN
    -- First drop the constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'messages_user_id_fkey'
        AND table_name = 'messages'
    ) THEN
        ALTER TABLE public.messages DROP CONSTRAINT messages_user_id_fkey;
        RAISE NOTICE 'Dropped existing foreign key constraint';
    END IF;
    
    -- Now add the constraint
    ALTER TABLE public.messages 
    ADD CONSTRAINT messages_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES public.profiles(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Foreign key constraint added successfully';
END
$$;

-- Create RLS (Row Level Security) policies for messages table
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create policy for selecting messages (anyone can read)
DROP POLICY IF EXISTS "Anyone can read messages" ON public.messages;
CREATE POLICY "Anyone can read messages" 
ON public.messages FOR SELECT 
USING (true);

-- Create policy for inserting messages (authenticated users only)
DROP POLICY IF EXISTS "Authenticated users can insert messages" ON public.messages;
CREATE POLICY "Authenticated users can insert messages" 
ON public.messages FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Create policy for updating messages (only message owner)
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
CREATE POLICY "Users can update their own messages" 
ON public.messages FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create policy for deleting messages (only message owner)
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages;
CREATE POLICY "Users can delete their own messages" 
ON public.messages FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- Create real-time subscription for messages
DO $$
BEGIN
    PERFORM pg_get_publication_tables('supabase_realtime');
    
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.messages';
    RAISE NOTICE 'Added messages table to realtime publication';
    
    EXCEPTION WHEN undefined_object THEN
    RAISE NOTICE 'Publication supabase_realtime does not exist';
END
$$;

-- Add function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to update the updated_at timestamp
DROP TRIGGER IF EXISTS update_messages_updated_at ON public.messages;
CREATE TRIGGER update_messages_updated_at
BEFORE UPDATE ON public.messages
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON public.messages TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT SELECT ON public.messages TO anon;

-- Grant permissions on profiles
GRANT ALL ON public.profiles TO postgres;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;

-- Create a trigger to automatically create a profile entry when a user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_new_user(); 