-- diagnose_knowledge_issues.sql
-- This script helps diagnose issues with the knowledge table and search function

-- Check for any NULL embeddings in the knowledge table
SELECT COUNT(*) AS null_embeddings_count 
FROM knowledge 
WHERE embedding IS NULL;

-- Check for any records with potential timestamp issues
SELECT COUNT(*) AS potential_timestamp_issues 
FROM knowledge 
WHERE "createdAt" < '1980-01-01'::timestamptz;

-- Check the dimension of the embeddings in the knowledge table
SELECT 
    vector_dims(embedding) AS embedding_dimensions,
    COUNT(*) AS count
FROM knowledge
WHERE embedding IS NOT NULL
GROUP BY vector_dims(embedding)
ORDER BY count DESC;

-- Check if the search_knowledge function exists
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_name = 'search_knowledge'
AND routine_schema = 'public';

-- Check for any records with NULL agentId and isShared = false
-- These might be problematic for the search function
SELECT COUNT(*) AS problematic_records
FROM knowledge
WHERE "agentId" IS NULL AND "isShared" = false;

-- Check for any records with invalid JSON in the content field
SELECT COUNT(*) AS invalid_json_count
FROM knowledge
WHERE content IS NULL OR content = 'null'::jsonb OR content = '{}'::jsonb;

-- Check if the content->>'text' field exists in all records
SELECT 
    CASE 
        WHEN content ? 'text' THEN 'Has text field'
        ELSE 'Missing text field'
    END AS text_field_status,
    COUNT(*) AS count
FROM knowledge
GROUP BY text_field_status;

-- Sample a few records to examine their structure
SELECT 
    id,
    "agentId",
    "isShared",
    "createdAt",
    content,
    vector_dims(embedding) AS embedding_dimensions
FROM knowledge
LIMIT 5; 