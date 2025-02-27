-- Enable Row Level Security on the accounts table
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- Allow users to read all accounts (required for viewing agents)
CREATE POLICY "Anyone can read accounts"
ON public.accounts
FOR SELECT
USING (true);

-- Allow users to update only their own profile
CREATE POLICY "Users can update their own profile"
ON public.accounts
FOR UPDATE
USING (auth.jwt() ->> 'user_id' = user_id)
WITH CHECK (auth.jwt() ->> 'user_id' = user_id);

-- Allow users to delete only their own profile
CREATE POLICY "Users can delete their own profile"
ON public.accounts
FOR DELETE
USING (auth.jwt() ->> 'user_id' = user_id);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile"
ON public.accounts
FOR INSERT
WITH CHECK (auth.jwt() ->> 'user_id' = user_id);

-- Create a table for storing user-created agents/characters
CREATE TABLE IF NOT EXISTS public.user_agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  agent_id UUID NOT NULL REFERENCES public.accounts(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', now()),
  CONSTRAINT fk_agent FOREIGN KEY (agent_id) REFERENCES public.accounts(id) ON DELETE CASCADE
);

-- Enable RLS on user_agents table
ALTER TABLE public.user_agents ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own user_agents
CREATE POLICY "Users can read their own user_agents"
ON public.user_agents
FOR SELECT
USING (auth.jwt() ->> 'user_id' = user_id);

-- Allow users to update their own user_agents
CREATE POLICY "Users can update their own user_agents"
ON public.user_agents
FOR UPDATE
USING (auth.jwt() ->> 'user_id' = user_id)
WITH CHECK (auth.jwt() ->> 'user_id' = user_id);

-- Allow users to delete their own user_agents
CREATE POLICY "Users can delete their own user_agents"
ON public.user_agents
FOR DELETE
USING (auth.jwt() ->> 'user_id' = user_id);

-- Allow users to insert their own user_agents
CREATE POLICY "Users can insert their own user_agents"
ON public.user_agents
FOR INSERT
WITH CHECK (auth.jwt() ->> 'user_id' = user_id);

-- Add user_id column to the rooms table to track room ownership
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS user_id TEXT;

-- Enable RLS on rooms table
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- Allow users to read all rooms (for now - could be restricted later)
CREATE POLICY "Anyone can read rooms"
ON public.rooms
FOR SELECT
USING (true);

-- Allow users to insert their own rooms
CREATE POLICY "Users can insert their own rooms"
ON public.rooms
FOR INSERT
WITH CHECK (auth.jwt() ->> 'user_id' = user_id);

-- Allow users to update their own rooms
CREATE POLICY "Users can update their own rooms"
ON public.rooms
FOR UPDATE
USING (auth.jwt() ->> 'user_id' = user_id)
WITH CHECK (auth.jwt() ->> 'user_id' = user_id);

-- Allow users to delete their own rooms
CREATE POLICY "Users can delete their own rooms"
ON public.rooms
FOR DELETE
USING (auth.jwt() ->> 'user_id' = user_id); 