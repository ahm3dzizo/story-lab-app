-- Check if the messages table exists in public schema
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'messages'
) AS messages_table_exists;

-- Check if the users table exists in auth schema
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'auth' 
    AND table_name = 'users'
) AS auth_users_table_exists;

-- Check if the messages table has the expected columns
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'messages'
ORDER BY ordinal_position;

-- Check if the foreign key relationship exists
SELECT 
    tc.constraint_name,
    tc.table_name AS table_name,
    kcu.column_name AS column_name,
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND tc.table_name = 'messages';

-- Check Row Level Security (RLS) settings for messages table
SELECT 
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'messages';

-- Check existing RLS policies for messages table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'messages';

-- Check if messages table is included in realtime publication
-- Previous approach that caused an error
-- SELECT 
--     pg_get_publication_tables('supabase_realtime') 
-- INTERSECT 
-- SELECT 
--     '"public"."messages"'::regclass;

-- Fixed approach to check if messages table is in realtime publication
SELECT
    EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'messages'
    ) AS is_table_in_realtime_publication;

-- Check if user_id is properly indexed (important for performance)
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename = 'messages';

-- Get count of messages in the messages table
SELECT 
    COUNT(*) as message_count
FROM public.messages; 