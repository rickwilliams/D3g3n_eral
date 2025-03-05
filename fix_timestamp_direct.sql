-- fix_timestamp_direct.sql
-- This script directly modifies the knowledge table to handle JavaScript timestamps

-- First, let's check the current column definition
DO $$
DECLARE
    column_default TEXT;
BEGIN
    SELECT column_default 
    INTO column_default
    FROM information_schema.columns
    WHERE table_name = 'knowledge' AND column_name = 'createdAt';
    
    RAISE NOTICE 'Current createdAt default: %', column_default;
END $$;

-- Temporarily disable the trigger if it exists
DROP TRIGGER IF EXISTS convert_timestamp_knowledge ON public.knowledge;

-- Create a temporary table to store the knowledge data
CREATE TEMP TABLE temp_knowledge AS 
SELECT * FROM knowledge;

-- Alter the knowledge table to use text for createdAt
ALTER TABLE knowledge 
ALTER COLUMN "createdAt" TYPE TEXT USING "createdAt"::TEXT;

-- Create a function to handle timestamp conversion
CREATE OR REPLACE FUNCTION handle_knowledge_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    -- If createdAt is a numeric string (milliseconds since epoch)
    IF NEW."createdAt" ~ '^[0-9]+$' THEN
        -- Convert milliseconds to timestamp
        NEW."createdAt" := to_timestamp(NEW."createdAt"::BIGINT / 1000.0);
    -- If createdAt is already a timestamp string
    ELSIF NEW."createdAt" ~ '^\d{4}-\d{2}-\d{2}' THEN
        -- Parse as timestamp
        NEW."createdAt" := NEW."createdAt"::TIMESTAMP WITH TIME ZONE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to convert timestamps on insert
CREATE TRIGGER handle_knowledge_timestamp
BEFORE INSERT ON knowledge
FOR EACH ROW
EXECUTE FUNCTION handle_knowledge_timestamp();

-- Now let's create a function to fix the knowledge table schema
CREATE OR REPLACE FUNCTION fix_knowledge_table()
RETURNS VOID AS $$
BEGIN
    -- Drop the temporary table
    DROP TABLE IF EXISTS temp_knowledge;
    
    -- Alter the knowledge table back to timestamp with time zone
    ALTER TABLE knowledge 
    ALTER COLUMN "createdAt" TYPE TIMESTAMP WITH TIME ZONE 
    USING 
        CASE 
            WHEN "createdAt" ~ '^[0-9]+$' THEN 
                to_timestamp("createdAt"::BIGINT / 1000.0)
            ELSE 
                "createdAt"::TIMESTAMP WITH TIME ZONE
        END;
    
    -- Set the default back to CURRENT_TIMESTAMP
    ALTER TABLE knowledge 
    ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;
    
    RAISE NOTICE 'Knowledge table fixed successfully';
END;
$$ LANGUAGE plpgsql;

-- Execute the function to fix the knowledge table
SELECT fix_knowledge_table();

-- Create a function to handle direct knowledge insertion
CREATE OR REPLACE FUNCTION public.createKnowledge(
    p_id UUID,
    p_agent_id UUID,
    p_content JSONB,
    p_embedding vector(1536),
    p_created_at TEXT DEFAULT NULL,
    p_is_main BOOLEAN DEFAULT false,
    p_original_id UUID DEFAULT NULL,
    p_chunk_index INTEGER DEFAULT NULL,
    p_is_shared BOOLEAN DEFAULT false
)
RETURNS VOID AS $$
DECLARE
    v_created_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Handle the timestamp conversion
    IF p_created_at IS NULL THEN
        v_created_at := CURRENT_TIMESTAMP;
    ELSIF p_created_at ~ '^[0-9]+$' THEN
        -- Convert milliseconds to timestamp
        v_created_at := to_timestamp(p_created_at::BIGINT / 1000.0);
    ELSE
        -- Try to parse as timestamp
        BEGIN
            v_created_at := p_created_at::TIMESTAMP WITH TIME ZONE;
        EXCEPTION WHEN OTHERS THEN
            v_created_at := CURRENT_TIMESTAMP;
        END;
    END IF;
    
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
        v_created_at,
        p_is_main,
        p_original_id,
        p_chunk_index,
        p_is_shared
    );
END;
$$ LANGUAGE plpgsql; 