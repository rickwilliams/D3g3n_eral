# ElizaOS Project Overview v0.25.8
## Brief overview of the project
- A subscription service enabling you to log-in using Clerk and create new ElizaOS characters based on the ElizaOS character file. These characters are stored in Spuabase. You can create, edit and delete characters when logged in. You can select a character you have created and chat with that character via the web client interface.

PNPM MUST BE USED AT ALL TIMES FOR INSTALLING ADDITONAL CODE

## Backend/Server-side
- **Core Runtime**: Node.js v23.3.0 with TypeScript 5.6.3
- **API Framework**: Express.js v4.21.1
- **Database Support**:
  - PostgreSQL (with vector search capabilities)
  - SQLite (via better-sqlite3 v11.8.1)
  - SQL.js (in-memory for testing)
  - Supabase (cloud-hosted PostgreSQL)
- **Database Features**:
  - Vector embeddings for semantic search
  - Connection pooling
  - JSONB support
  - Row-level security
  - Audit logging
- **AI Model Integration**:
  - OpenAI v4.82.0 for embedding
  - Anthropic (@ai-sdk/anthropic v1.1.6) for general LLM use
  - Heuristic for images
  - LMStudio (not currently used in this project)
  - Ollama (not currently used in this project)
  - GaiaNet (not currently used in this project)
  - Venice (not currently used in this project)
  - NVIDIA (not currently used in this project)
  - Akash Chat API (not currently used in this project)
  - Deepseek (not currently used in this project)
  - Atoma (not currently used in this project)

## Frontend/CSS
- **Framework**: React v19.0.0 with TypeScript 5.6.3
- **Build Tool**: Vite v6.0.5
- **CSS Framework**: Tailwind CSS v3.4.4
- **UI Components**:
  - Shadcn UI components
  - Radix UI primitives (various v1.x components)
- **Styling Features**:
  - CSS variables for theming
  - Dark mode support
  - Responsive design
  - Custom component variants
  - CSS-in-JS capabilities
- **Component Library**:
  - Card components
  - Button variants
  - Input fields
  - Labels
  - Sheets
  - Sidebars
  - Chat bubbles
  - Skeletons for loading states
- **Routing**:
  - **Library**: TanStack Router v0.x
  - **Architecture**:
    - Routes defined in `client/src/routes/index.tsx`
    - Main router configuration and mounting in `client/src/main.tsx`
    - Route components in `client/src/routes/` directory
  - **Key Components**:
    - `rootRoute`: Wraps the entire application with providers
    - `layoutRoute`: Uses `Outlet` component for nested routes
    - Individual routes (`indexRoute`, `chatRoute`, etc.) for different pages
  - **Navigation Pattern**:
    - Use TanStack Router's `useNavigate` hook:
      ```typescript
      import { useNavigate } from "@tanstack/react-router";
      const navigate = useNavigate();
      // Navigate to a route
      navigate({ to: "/" });
      // With parameters
      navigate({ to: "/chat/$agentId", params: { agentId: "123" } });
      ```
    - Link components for declarative navigation:
      ```typescript
      import { Link } from "@tanstack/react-router";
      <Link to="/" search={{}} params={{}}>Home</Link>
      <Link to="/chat/$agentId" params={{ agentId: "123" }}>Chat</Link>
      ```
  - **Route Parameters**:
    - Access via the `useParams` hook:
      ```typescript
      import { useParams } from "@tanstack/react-router";
      const { agentId } = useParams({ from: "/chat/$agentId" });
      ```
  - **Common Pitfalls**:
    - **DO NOT** use React Router hooks (`useNavigate`, `useLocation` from `react-router`)
    - **DO NOT** use React Router components (`BrowserRouter`, `Routes`, `Route` from `react-router-dom`)
    - If navigation doesn't work, verify you're using TanStack Router imports, not React Router imports
    - Avoid nesting of multiple Router providers (e.g., only one `ClerkProvider` should exist)
    - Some components (like buttons) can't be nested inside other button components
  - **Integration with Clerk Auth**:
    - Clerk authentication is provided once at the root route level
    - Auth state is accessible in all route components
    - Protected routes should check auth status within the component

## Installing Plugins
1. **Using Plugin Registry**:
   - List available plugins:
     ```bash
     npx elizaos plugins list
     ```
   - Install plugin:
     ```bash
     npx elizaos plugins add @elizaos-plugins/plugin-NAME
     ```
   - Browse plugins at: https://elizaos.github.io/registry/

2. **Manual Installation**:
   - Add to agent/package.json dependencies:
     ```json
     {
       "dependencies": {
         "@elizaos/plugin-[name]": "workspace:*"
       }
     }
     ```
   - cd into agent/ directory
   - Run pnpm install
   - Run pnpm build

3. **Additional Requirements**:
   - Some plugins may require Sharp for image processing:
     ```bash
     pnpm install --include=optional sharp
     ```

## Building Plugins
1. **Plugin Structure**:
   ```typescript
   interface Plugin {
     name: string;
     description: string;
     actions?: Action[];
     providers?: Provider[];
     evaluators?: Evaluator[];
     services?: Service[];
     clients?: Client[];
     adapters?: Adapter[];
   }
   ```

2. **Development Steps**:
   - Create new plugin in packages directory
   - Implement Plugin interface
   - Add necessary actions/evaluators/providers
   - Include comprehensive documentation
   - Add tests for functionality
   - Submit pull request

3. **Best Practices**:
   - Keep plugins focused on specific functionality
   - Document dependencies clearly
   - Implement robust error handling
   - Provide clear documentation
   - Include usage examples

## Questions/Uncertainties
1. What is the recommended deployment strategy for production environments?
2. Are there specific security considerations for plugin development?
3. What is the process for contributing new plugins to the official registry?
4. How should plugins handle version compatibility with the core system?
5. What are the performance implications of using multiple plugins simultaneously?

## Project Structure
```
eliza/
├── agent/                           # Agent configuration and runtime
├── client/                          # Web client interface
├── docs/                            # Documentation and guides
├── packages/                        # Core packages and extensions
│   ├── core/                        # Core Eliza functionality
│   ├── cli/                         # Command line interface
│   ├── user-management-api/         # Authentication and user management service
│   │   ├── src/                     # Source code for the API
│   │   │   ├── webhooks/            # Webhook handlers for Clerk events
│   │   │   ├── utils/               # Utility functions for Supabase, etc.
│   │   │   ├── index.ts             # Main Express server setup
│   │   │   └── test-webhook-*.ts    # Test scripts for webhook verification
│   │   ├── dist/                    # Compiled JavaScript output
│   │   └── package.json             # Package configuration
│   ├── client-*/                    # Client implementations
│   │   ├── client-auto/             # Automated client
│   │   ├── client-direct/           # Direct interaction client
│   │   └── client-twitter/          # Twitter integration
│   ├── plugin-*/                    # Official plugins
│   │   ├── plugin-bootstrap/        # Bootstrap functionality
│   │   ├── plugin-image-generation/ # Image generation
│   │   ├── plugin-twitter/          # Twitter integration
│   │   └── plugin-web-search/       # Web search capability
│   └── adapter-*/                   # Database adapters
│       ├── adapter-sqlite/          # SQLite implementation
│       └── adapter-supabase/        # Supabase integration
├── tests/                           # Test suites and fixtures
├── scripts/                         # Utility and automation scripts
│   └── MyApp.sh                     # Multi-service startup script with logging
├── characters/                      # Character definitions and configs
├── i18n/                            # Internationalization files
├── rules/                           # Project documentation and best practices
│   ├── clerk-supabase-integration.mdc # Auth integration patterns
│   ├── multi-service-startup.mdc    # Service management guidelines
│   └── ngrok-webhook-testing.mdc    # Webhook testing best practices
├── logs/                            # Application logs directory
└── patches/                         # Custom patches and fixes
```

## Authentication & Database Integration
### Clerk and Supabase Integration
- **Architecture**:
  - Three-tier architecture combining Clerk for authentication and Supabase for data storage
  - Client Application (React) - handles UI and user interaction
  - User Management API (Express.js) - manages authentication flow and webhook handling
  - Supabase Database - stores user data with Row-Level Security (RLS) policies

- **User Management API (packages/user-management-api)**:
  - **Purpose**: Acts as the critical bridge between Clerk authentication and Supabase database
  - **Technology Stack**:
    - Express.js server (v4.18.2)
    - TypeScript with tsup for bundling
    - Svix (v1.16.0) for webhook signature verification
    - Supabase JS client (v2.39.0) for database operations
  - **Key Components**:
    - Webhook handler that processes Clerk user events (creation, updates, deletion)
    - Health check endpoint for monitoring service status
    - Development test endpoint for simulating webhooks locally
    - Utility functions for Supabase client initialization
  - **Database Structure**:
    - Uses an `accounts` table in Supabase with fields:
      - `id`: Unique identifier (using Clerk user ID)
      - `email`: User's email address
      - `name`: User's full name
      - `username`: Generated from email or provided username
      - `avatarUrl`: Profile image URL
      - `user_id`: Clerk user ID (critical for RLS policies)
  - **Startup Process**:
    - Runs on port 4000 by default (configurable via USER_API_PORT)
    - Requires environment variables for Clerk webhook secret and Supabase connection
    - Supports development mode with test endpoints enabled

- **Authentication Flow**:
  - Clerk handles user registration, login, and session management
  - Express.js API receives Clerk webhooks when user events occur:
    1. `user.created`: Creates a corresponding record in Supabase accounts table
    2. `user.updated`: Updates user information in Supabase to maintain synchronization
    3. `user.deleted`: Removes the user record from Supabase
  - Webhook payloads are verified using the Svix library with the CLERK_WEBHOOK_SECRET
  - User data is extracted from the webhook payload and mapped to the Supabase schema

- **JWT Configuration**:
  - Custom JWT template required for Supabase compatibility
  - Critical fields must include:
    ```json
    {
      "aud": "authenticated",
      "role": "authenticated",
      "email": "user@example.com",
      "user_id": "user_abc123",
      "app_metadata": {
        "provider": "clerk"
      }
    }
    ```
  - Important implementation detail: The `sub` claim is protected in Clerk and cannot be used; `user_id` field is used instead for Supabase Row-Level Security policies
  - The JWT is configured in the Clerk dashboard under JWT Templates, not in the code itself

- **Webhook Implementation**:
  - Express.js webhook handler at '/api/webhooks/clerk' endpoint
  - Secure webhook verification using Svix library
  - Detailed validation of webhook signature headers:
    - 'svix-id'
    - 'svix-timestamp'
    - 'svix-signature'
  - Comprehensive error handling with appropriate HTTP status codes
  - Development test endpoint at '/api/test/webhooks/clerk' (only in non-production)
  - Advanced test script (`test-webhook-simple.ts`) for:
    - Automatic ngrok URL detection
    - Diagnostic checks for local server and ngrok tunnel health
    - Comprehensive logging with timestamps
    - Detailed error reporting

- **Row-Level Security**:
  - Supabase RLS policies ensure users can only access their own data
  - Policies use JWT claims to identify the authenticated user
  - Critical pattern: `auth.jwt() ->> 'user_id' = user_id`
  - Enables secure multi-tenant architecture where users can only see and modify their own records

### Development Tools and Practices
- **Logging Infrastructure**:
  - Log directory for persistent logs with timestamps
  - Dual logging to console and file for comprehensive debugging
  - Service-specific log sections for easier troubleshooting

- **Startup Sequence**:
  - Process management with proper cleanup
  - Service health verification
  - Dependency ordering for multi-service startup
  - Environment variables management
  - Connectivity testing between services

- **Webhook Testing**:
  - Includes two test utilities:
    - `test-webhook.ts`: Advanced testing with Svix signature generation
    - `test-webhook-simple.ts`: Simplified testing with automatic ngrok detection
  - Automatic detection of ngrok URLs from both free (`*.ngrok-free.app`) and paid accounts
  - Comprehensive diagnostics for troubleshooting:
    - Local API server health check
    - Ngrok tunnel verification
    - Detailed error logging with request/response information
  - All test results logged to timestamped files in the `logs` directory

- **Best Practices Documentation**:
  - Rules directory with .mdc files for development guidelines:
    - `clerk-supabase-integration.mdc` - Auth integration patterns
    - `multi-service-startup.mdc` - Service management guidelines
    - `ngrok-webhook-testing.mdc` - Webhook testing best practices
  - Comprehensive troubleshooting guides for common issues