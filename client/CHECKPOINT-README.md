# ElizaOS Client - Stable Checkpoint v0.25.8

This is a stable checkpoint of the ElizaOS client with working Clerk authentication, Supabase integration, and character management functionality.

## Current State

- **Authentication**: Clerk authentication is integrated and working
- **Database**: Supabase integration is set up
- **Character Management**: Creation, editing, and deletion of character files is implemented
- **UI Components**: Modern UI with Shadcn components

## Known Issues

1. **Date Handling**: The agent thinks today's date is May 3rd, and tomorrow it will think it's June 3rd.
2. **Image Generation**: 
   - Images are saved locally but displayed as broken image paths in the chat
   - Uses Anthropic despite configuration showing the image model provider is Heurist

3. **Twitter Plugin**: Not working correctly
4. **Auto Client**: Not functioning properly
5. **Tweet Processing**: Tweets that were being processed yesterday are not being processed today
6. **Database Errors**: There are timestamp-related errors in the Supabase database:
   ```
   date/time field value out of range: "1741198468542"
   ```

## SQL Fix Files

Several SQL fix files have been created to address database issues:
- `fix_knowledge_issues.sql`
- `fix_knowledge_timestamps.sql`
- `fix_search_knowledge.sql`
- `fix_timestamp_direct.sql`
- `simple_fix.sql`

## How to Use This Checkpoint

To return to this stable state:

```bash
# Switch to the stable checkpoint branch
git checkout stable-checkpoint-v0.25.8

# Or use the tag
git checkout stable-v0.25.8-checkpoint
```

## Important Directories and Files

- **Authentication**: `client/src/providers/ClerkProvider.tsx` and `client/src/lib/auth.ts`
- **Supabase Integration**: `client/src/lib/supabase-auth.ts`
- **Character Management**: 
  - `client/src/components/create-character.tsx`
  - `client/src/components/edit-character.tsx`
  - `client/src/routes/edit-character.tsx`

## Environment Configuration

The client uses the following environment variables (in `.env`):

- Supabase configuration
- Clerk authentication
- AWS S3 configuration

## Next Steps

1. Fix the date handling issue in the agent
2. Resolve image generation display problems
3. Debug and fix the Twitter plugin
4. Address database timestamp errors using the SQL fix files 