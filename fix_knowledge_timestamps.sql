-- fix_knowledge_timestamps.sql
-- This script fixes existing timestamp data in the knowledge table

-- First, let's check if there are any records with bigint timestamps
DO $$
DECLARE
    bigint_count INTEGER;
BEGIN
    -- Try to identify any records where createdAt might be a bigint
    -- This is a safe check that won't modify anything
    EXECUTE 'SELECT COUNT(*) FROM knowledge 
             WHERE pg_typeof("createdAt") = ''bigint''::regtype 
             OR ("createdAt" IS NOT NULL AND "createdAt" < ''1980-01-01''::timestamptz)'
    INTO bigint_count;
    
    RAISE NOTICE 'Found % records with potential timestamp issues', bigint_count;
END $$;

-- Function to fix existing timestamps in the knowledge table
CREATE OR REPLACE FUNCTION fix_existing_knowledge_timestamps()
RETURNS void AS $$
DECLARE
    fixed_count INTEGER := 0;
BEGIN
    -- Update any records where createdAt is very old (likely a timestamp stored incorrectly)
    -- This assumes timestamps before 1980 are likely errors
    UPDATE knowledge
    SET "createdAt" = to_timestamp("createdAt"::bigint / 1000.0)
    WHERE "createdAt" IS NOT NULL 
    AND "createdAt" < '1980-01-01'::timestamptz;
    
    GET DIAGNOSTICS fixed_count = ROW_COUNT;
    RAISE NOTICE 'Fixed % records with timestamp issues', fixed_count;
END;
$$ LANGUAGE plpgsql;

-- Execute the function to fix existing timestamps
SELECT fix_existing_knowledge_timestamps();

-- Verify the search_knowledge function exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'search_knowledge' 
        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    ) THEN
        RAISE NOTICE 'search_knowledge function does not exist!';
    ELSE
        RAISE NOTICE 'search_knowledge function exists';
    END IF;
END $$;

-- Test the search_knowledge function with a simple query
-- This will help verify if the function works correctly
DO $$
DECLARE
    result_count INTEGER;
BEGIN
    -- Try to execute a simple search query
    -- This will error out if there are issues with the function
    EXECUTE 'SELECT COUNT(*) FROM search_knowledge(
        NULL::uuid, 
        NULL::vector(1536), 
        0.5, 
        10, 
        NULL
    )'
    INTO result_count;
    
    RAISE NOTICE 'search_knowledge test returned % results', result_count;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error testing search_knowledge: %', SQLERRM;
END $$; 