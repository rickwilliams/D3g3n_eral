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
├── characters/                      # Character definitions and configs
├── i18n/                            # Internationalization files
└── patches/                         # Custom patches and fixes
```