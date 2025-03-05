-- simple_fix.sql
-- This script provides a simple, direct fix for the timestamp issue

-- 1. Drop the existing createKnowledge function if it exists
DROP FUNCTION IF EXISTS public.createKnowledge;

-- 2. Create a new createKnowledge function that handles JavaScript timestamps
CREATE OR REPLACE FUNCTION public.createKnowledge(
    p_id UUID,
    p_agent_id UUID,
    p_content JSONB,
    p_embedding vector(1536),
    p_created_at TIMESTAMPTZ DEFAULT NULL,
    p_is_main BOOLEAN DEFAULT false,
    p_original_id UUID DEFAULT NULL,
    p_chunk_index INTEGER DEFAULT NULL,
    p_is_shared BOOLEAN DEFAULT false
)
RETURNS VOID AS $$
BEGIN
    -- Insert the knowledge with the timestamp (or current timestamp if null)
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
        p_id,
        p_agent_id,
        p_content,
        p_embedding,
        COALESCE(p_created_at, CURRENT_TIMESTAMP),
        p_is_main,
        p_original_id,
        p_chunk_index,
        p_is_shared
    );
END;
$$ LANGUAGE plpgsql;

-- 3. Create a function to directly insert knowledge with a JavaScript timestamp
CREATE OR REPLACE FUNCTION public.createKnowledgeWithMillis(
    p_id UUID,
    p_agent_id UUID,
    p_content JSONB,
    p_embedding vector(1536),
    p_created_at_millis BIGINT DEFAULT NULL,
    p_is_main BOOLEAN DEFAULT false,
    p_original_id UUID DEFAULT NULL,
    p_chunk_index INTEGER DEFAULT NULL,
    p_is_shared BOOLEAN DEFAULT false
)
RETURNS VOID AS $$
BEGIN
    -- Insert the knowledge with the converted timestamp
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
        p_id,
        p_agent_id,
        p_content,
        p_embedding,
        CASE 
            WHEN p_created_at_millis IS NOT NULL THEN to_timestamp(p_created_at_millis / 1000.0)
            ELSE CURRENT_TIMESTAMP
        END,
        p_is_main,
        p_original_id,
        p_chunk_index,
        p_is_shared
    );
END;
$$ LANGUAGE plpgsql;

-- 4. Create a function to directly insert knowledge with a string timestamp
CREATE OR REPLACE FUNCTION public.createKnowledgeWithTimestampStr(
    p_id UUID,
    p_agent_id UUID,
    p_content JSONB,
    p_embedding vector(1536),
    p_created_at_str TEXT DEFAULT NULL,
    p_is_main BOOLEAN DEFAULT false,
    p_original_id UUID DEFAULT NULL,
    p_chunk_index INTEGER DEFAULT NULL,
    p_is_shared BOOLEAN DEFAULT false
)
RETURNS VOID AS $$
BEGIN
    -- Insert the knowledge with the converted timestamp
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
        p_id,
        p_agent_id,
        p_content,
        p_embedding,
        CASE 
            WHEN p_created_at_str IS NULL THEN 
                CURRENT_TIMESTAMP
            WHEN p_created_at_str ~ '^[0-9]+$' THEN 
                to_timestamp(p_created_at_str::BIGINT / 1000.0)
            ELSE 
                CURRENT_TIMESTAMP
        END,
        p_is_main,
        p_original_id,
        p_chunk_index,
        p_is_shared
    );
END;
$$ LANGUAGE plpgsql; 