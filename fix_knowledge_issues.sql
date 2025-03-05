-- fix_knowledge_issues.sql
-- This script fixes both the timestamp issue and the function ambiguity issue

-- 1. First, drop all versions of the search_knowledge function to resolve ambiguity
DO $$
BEGIN
    -- Drop all versions of the function (regardless of parameter order)
    DROP FUNCTION IF EXISTS public.search_knowledge(uuid, vector, float, integer, text);
    DROP FUNCTION IF EXISTS public.search_knowledge(integer, float, uuid, vector, text);
    DROP FUNCTION IF EXISTS public.search_knowledge(match_count integer, match_threshold float, query_agent_id uuid, query_embedding vector, search_text text);
    DROP FUNCTION IF EXISTS public.search_knowledge(query_agent_id uuid, query_embedding vector, match_threshold float, match_count integer, search_text text);
    
    RAISE NOTICE 'Dropped all versions of search_knowledge function';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error dropping functions: %', SQLERRM;
END $$;

-- 2. Create a trigger to handle timestamp conversion for new inserts
CREATE OR REPLACE FUNCTION convert_timestamp_for_knowledge()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if createdAt is a string that looks like a timestamp in milliseconds
    IF NEW."createdAt" IS NOT NULL AND pg_typeof(NEW."createdAt") = 'text'::regtype 
       AND NEW."createdAt" ~ '^[0-9]+$' THEN
        -- Convert text milliseconds to timestamp
        NEW."createdAt" := to_timestamp((NEW."createdAt")::bigint / 1000.0);
    -- Check if createdAt is a bigint (milliseconds)
    ELSIF NEW."createdAt" IS NOT NULL AND pg_typeof(NEW."createdAt") = 'bigint'::regtype THEN
        -- Convert bigint milliseconds to timestamp
        NEW."createdAt" := to_timestamp(NEW."createdAt" / 1000.0);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS convert_timestamp_knowledge ON public.knowledge;

-- Create the trigger
CREATE TRIGGER convert_timestamp_knowledge
BEFORE INSERT ON public.knowledge
FOR EACH ROW
EXECUTE FUNCTION convert_timestamp_for_knowledge();

-- 3. Create a single, clean version of the search_knowledge function
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
        CASE 
            WHEN k.embedding IS NULL OR query_embedding IS NULL THEN 0
            ELSE 1 - (k.embedding <=> query_embedding)
        END AS similarity
    FROM knowledge k
    WHERE 
        -- Filter by agent ID or shared knowledge
        (
            (query_agent_id IS NULL OR k."agentId" = query_agent_id)
            OR 
            (k."isShared" = true AND k."agentId" IS NULL)
        )
        -- Apply similarity threshold if both embeddings exist
        AND (
            (k.embedding IS NULL OR query_embedding IS NULL) 
            OR 
            (1 - (k.embedding <=> query_embedding)) >= match_threshold
        )
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

-- 4. Add a function to handle direct knowledge insertion with timestamp conversion
CREATE OR REPLACE FUNCTION createKnowledge(
    p_agent_id UUID,
    p_content JSONB,
    p_embedding vector(1536),
    p_is_main BOOLEAN DEFAULT false,
    p_original_id UUID DEFAULT NULL,
    p_chunk_index INTEGER DEFAULT NULL,
    p_is_shared BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
    new_id UUID;
BEGIN
    -- Generate a new UUID
    new_id := gen_random_uuid();
    
    -- Insert the knowledge with current timestamp
    INSERT INTO knowledge (
        id, 
        "agentId", 
        content, 
        embedding, 
        "createdAt", 
        "isMain", 
        "originalId", 
        "chunkIndex", 
        "isShared"
    ) VALUES (
        new_id,
        p_agent_id,
        p_content,
        p_embedding,
        CURRENT_TIMESTAMP, -- Use current timestamp instead of client-provided one
        p_is_main,
        p_original_id,
        p_chunk_index,
        p_is_shared
    );
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql; 