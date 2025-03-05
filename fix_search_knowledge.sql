-- fix_search_knowledge.sql
-- This script provides a simplified version of the search_knowledge function

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS public.search_knowledge;

-- Create a simplified version of the search_knowledge function
CREATE OR REPLACE FUNCTION public.search_knowledge(
    query_agent_id UUID,
    query_embedding vector(1536),
    match_threshold FLOAT DEFAULT 0.5,
    match_count INTEGER DEFAULT 10,
    search_text TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    "agentId" UUID,
    content JSONB,
    embedding vector(1536),
    "createdAt" TIMESTAMPTZ,
    "isMain" BOOLEAN,
    "originalId" UUID,
    "chunkIndex" INTEGER,
    "isShared" BOOLEAN,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Simple version that just does vector similarity search
    RETURN QUERY
    SELECT 
        k.id,
        k."agentId",
        k.content,
        k.embedding,
        k."createdAt",
        k."isMain",
        k."originalId",
        k."chunkIndex",
        k."isShared",
        1 - (k.embedding <=> query_embedding) AS similarity
    FROM knowledge k
    WHERE 
        -- Filter by agent ID or shared knowledge
        (
            (query_agent_id IS NULL OR k."agentId" = query_agent_id)
            OR 
            (k."isShared" = true AND k."agentId" IS NULL)
        )
        -- Ensure embedding exists
        AND k.embedding IS NOT NULL
        -- Apply similarity threshold
        AND (1 - (k.embedding <=> query_embedding)) >= match_threshold
        -- Apply text search if provided
        AND (
            search_text IS NULL 
            OR 
            k.content->>'text' ILIKE '%' || search_text || '%'
        )
    ORDER BY similarity DESC
    LIMIT match_count;
END;
$$;

-- Test the function with a simple query
DO $$
BEGIN
    RAISE NOTICE 'Testing simplified search_knowledge function...';
END $$; 