-- curation_schema.sql
-- This file contains SQL statements to fix and enhance the ElizaOS database schema
-- It includes the missing search_knowledge function and fixes timestamp handling

-- First, create the timestamp conversion function if it doesn't exist
CREATE OR REPLACE FUNCTION convert_timestamp_for_knowledge()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if createdAt is a BIGINT (milliseconds) and convert it to TIMESTAMPTZ
    IF NEW."createdAt" IS NOT NULL AND pg_typeof(NEW."createdAt") = 'bigint'::regtype THEN
        -- Convert milliseconds to seconds and set the createdAt field
        NEW."createdAt" := to_timestamp(NEW."createdAt" / 1000.0);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'convert_timestamp_knowledge'
    ) THEN
        CREATE TRIGGER convert_timestamp_knowledge
        BEFORE INSERT ON public.knowledge
        FOR EACH ROW
        EXECUTE FUNCTION convert_timestamp_for_knowledge();
    END IF;
END
$$;

-- Create the search_knowledge function
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
    RETURN QUERY
    WITH vector_scores AS (
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
            1 - (k.embedding <=> query_embedding) AS vector_score
        FROM knowledge k
        WHERE (k."agentId" = query_agent_id OR (k."isShared" = true AND k."agentId" IS NULL))
        AND k.embedding IS NOT NULL
    ),
    keyword_matches AS (
        SELECT 
            k.id,
            CASE
                WHEN search_text IS NOT NULL AND 
                     lower(k.content->>'text') LIKE '%' || lower(search_text) || '%' THEN 3.0
                ELSE 1.0
            END *
            CASE
                WHEN (k.content->'metadata'->>'isChunk')::boolean = true THEN 1.5
                WHEN k."isMain" = true THEN 1.2
                ELSE 1.0
            END AS keyword_score
        FROM knowledge k
        WHERE (k."agentId" = query_agent_id OR (k."isShared" = true AND k."agentId" IS NULL))
    )
    SELECT 
        vs.id,
        vs."agentId",
        vs.content,
        vs.embedding,
        vs."createdAt",
        vs."isMain",
        vs."originalId",
        vs."chunkIndex",
        vs."isShared",
        (vs.vector_score * COALESCE(km.keyword_score, 1.0)) AS similarity
    FROM vector_scores vs
    LEFT JOIN keyword_matches km ON vs.id = km.id
    WHERE 
        vs.vector_score >= match_threshold
        OR (COALESCE(km.keyword_score, 1.0) > 1.0 AND vs.vector_score >= 0.3)
    ORDER BY similarity DESC
    LIMIT match_count;
END;
$$;

-- Create an index on the text field in the content JSONB for better text search performance
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_knowledge_content_text' 
        AND tablename = 'knowledge'
    ) THEN
        CREATE INDEX idx_knowledge_content_text ON knowledge ((content->>'text'));
    END IF;
END
$$; 