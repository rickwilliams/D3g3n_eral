# Railway Deployment Guide for ElizaOS

This guide provides step-by-step instructions for deploying ElizaOS on Railway.

## Prerequisites

Before deploying, ensure you have:

1. A [Railway](https://railway.app/) account
2. A [Clerk](https://clerk.dev/) account for authentication
3. A [Supabase](https://supabase.com/) project for the database
4. An [AWS](https://aws.amazon.com/) account with S3 bucket for file storage

## Environment Variables

The following environment variables need to be set in your Railway project:

```
# Server Configuration
PORT=3000
NODE_ENV=production

# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key
CLERK_JWT_TEMPLATE_NAME=supabase

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# AWS S3 Configuration (for file uploads)
VITE_AWS_REGION=us-east-1
VITE_AWS_ACCESS_KEY_ID=your_aws_access_key_id
VITE_AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
VITE_AWS_BUCKET_NAME=your_s3_bucket_name
```

## Deployment Steps

1. **Fork or Clone the Repository**
   ```bash
   git clone https://github.com/yourusername/elizaOS.git
   cd elizaOS
   ```

2. **Create a New Project on Railway**
   - Go to [Railway Dashboard](https://railway.app/dashboard)
   - Click "New Project" > "Deploy from GitHub repo"
   - Select your ElizaOS repository

3. **Configure Environment Variables**
   - In your Railway project, go to the "Variables" tab
   - Add all the required environment variables listed above

4. **Deploy the Application**
   - Railway will automatically detect the `railway.toml` file and use the optimized Dockerfile
   - The deployment will start automatically

5. **Verify Deployment**
   - Once deployed, Railway will provide a URL to access your application
   - Visit the URL to ensure the application is running correctly

## Supabase Database Setup

Before your application will work correctly, you need to set up the Supabase database schema:

1. **Create Tables**
   - In your Supabase dashboard, go to the SQL Editor
   - Run the following SQL to create the necessary tables:

```sql
-- Create agents table
CREATE TABLE public.agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Row Level Security (RLS) policies
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to select their own agents
CREATE POLICY "Users can view their own agents" ON public.agents
    FOR SELECT USING (auth.uid()::text = user_id);

-- Create policy to allow users to insert their own agents
CREATE POLICY "Users can insert their own agents" ON public.agents
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Create policy to allow users to update their own agents
CREATE POLICY "Users can update their own agents" ON public.agents
    FOR UPDATE USING (auth.uid()::text = user_id);

-- Create policy to allow users to delete their own agents
CREATE POLICY "Users can delete their own agents" ON public.agents
    FOR DELETE USING (auth.uid()::text = user_id);
```

2. **Configure Clerk JWT Template**
   - In your Clerk dashboard, go to JWT Templates
   - Create a new template named "supabase"
   - Use the following claims:
   ```json
   {
     "sub": "{{user.id}}",
     "aud": "authenticated",
     "role": "authenticated",
     "user_id": "{{user.id}}"
   }
   ```

## Troubleshooting

If you encounter issues during deployment:

1. **Check Logs**
   - In your Railway project, go to the "Deployments" tab
   - Click on the latest deployment to view logs

2. **Verify Environment Variables**
   - Ensure all required environment variables are set correctly

3. **Check Supabase Connection**
   - Verify that your application can connect to Supabase
   - Check that the JWT template in Clerk is configured correctly

4. **Memory Issues**
   - If you encounter memory issues, consider upgrading your Railway plan or optimizing the application

## Local Development

For local development:

1. **Clone the Repository**
   ```bash
   git clone https://github.com/yourusername/elizaOS.git
   cd elizaOS
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   ```

3. **Set Up Environment Variables**
   - Copy `.env.example` to `.env`
   - Fill in all required environment variables

4. **Start the Development Server**
   ```bash
   pnpm run dev
   ```

5. **Access the Application**
   - Open your browser and navigate to `http://localhost:5173` 