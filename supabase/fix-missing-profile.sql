-- Fix for specific user_id that's causing the foreign key constraint error
-- This script creates a profile for the specific user_id mentioned in the error

-- First, check if the user already exists in profiles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = '59be8eba-c233-4da9-a5b3-0ce66ccc7928'
    ) THEN
        -- Create a profile for this specific user
        INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
        VALUES (
            '59be8eba-c233-4da9-a5b3-0ce66ccc7928',
            'user-59be8eba@example.com',
            'User 59be8eba',
            now(),
            now()
        );
        
        RAISE NOTICE 'Created profile for user 59be8eba-c233-4da9-a5b3-0ce66ccc7928';
    ELSE
        RAISE NOTICE 'Profile for user 59be8eba-c233-4da9-a5b3-0ce66ccc7928 already exists';
    END IF;
END
$$;

-- Check if there are any other messages with user_ids that don't have profiles
DO $$
DECLARE
    missing_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO missing_count
    FROM public.messages m
    WHERE NOT EXISTS (
        SELECT 1 FROM public.profiles p WHERE p.id = m.user_id
    );
    
    IF missing_count > 0 THEN
        RAISE NOTICE 'There are still % messages with user_ids that don''t have profiles', missing_count;
        
        -- Create profiles for these missing users
        INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
        SELECT DISTINCT 
            m.user_id,
            'user-' || substring(m.user_id::text, 1, 8) || '@example.com',
            'User ' || substring(m.user_id::text, 1, 8),
            now(),
            now()
        FROM public.messages m
        WHERE NOT EXISTS (
            SELECT 1 FROM public.profiles p WHERE p.id = m.user_id
        );
        
        RAISE NOTICE 'Created profiles for all missing users';
    ELSE
        RAISE NOTICE 'All message user_ids now have corresponding profiles';
    END IF;
END
$$;

-- Now run the full migration script to set up the foreign key constraint
RAISE NOTICE 'After running this script, you should run the full fix_messages_relationship.sql script'; 