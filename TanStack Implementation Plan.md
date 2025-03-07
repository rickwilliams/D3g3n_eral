# TanStack Router Reinstatement Implementation Plan

## Phase 1: Initial Assessment and Backup (~15 minutes) ✓

### Create Backup Branch
- [x] Verify current branch is `update-v0.25.9`
- [x] Create backup branch: `git checkout -b tanstack-migration-backup`
- [x] Verify backup branch creation was successful
- [x] Return to working branch: `git checkout update-v0.25.9`

### Verify Dependencies
- [x] Examine `package.json` in current branch
- [x] Check for TanStack Router dependencies:
  - [x] `@tanstack/react-router`
  - [x] `@tanstack/router-devtools` (for development)
- [x] Compare with `package.json` from stable branch
- [x] Install missing dependencies if needed:
  - [x] Updated `@tanstack/react-router` from v1.112.17 to v1.112.18
  - [x] Added `-D @tanstack/router-devtools`

### Assess Routes Directory
- [x] Check if `routes` directory exists in current branch
- [x] Compare with `routes` directory in stable branch
- [x] Identify missing files and folders
- [x] Document the current state of routing files

## Phase 2: Restore Core Router Files (~30 minutes) ✓

### Restore Routes Configuration
- [x] Create `routes` directory if it doesn't exist
- [x] Check out `routes/index.ts` from stable branch
- [x] Verify file was successfully restored
- [x] Check for any imports that might be outdated or missing
- [x] Update imports if needed to match current project structure

### Restore Main Entry Point
- [x] Save a copy of current `main.tsx` for reference
- [x] Examine `main.tsx` from stable branch
- [x] Check out `main.tsx` from stable branch
- [x] Verify TanStack Router initialization code is present
- [x] Ensure imports are correct:
  - [x] `import { router, queryClient } from './routes/index'`
  - [x] `import { RouterProvider } from "@tanstack/react-router"`

### Update App Component
- [x] Save a copy of current `App.tsx` for reference
- [x] Create a temporary merged version with:
  - [x] TanStack Router structure from stable branch
  - [x] Clerk authentication components from update branch
  - [x] Any new components or features from update branch
- [x] Replace React Router components with TanStack equivalents:
  - [x] `<Routes>` → TanStack Router structure
  - [x] `<Route>` → TanStack route definitions
  - [x] Add `<Outlet />` component for rendering nested routes
- [x] Ensure ClerkProvider wraps the entire application
- [x] Update the file with the merged changes

## Phase 3: Integration and Component Fixes (~45 minutes)

### Update Navigation Components
- [ ] Identify all components using navigation links
- [ ] Update sidebar components to use TanStack Router links:
  - [ ] Import: `import { Link } from "@tanstack/react-router"`
  - [ ] Replace `<NavLink>` with `<Link>`
  - [ ] Update link props to match TanStack Router API
- [ ] Fix any path references to match TanStack Router configuration
- [ ] Update any dynamic route parameters

### Integrate Authentication with Router
- [ ] Examine authentication logic in stable branch
- [ ] Update protected route implementations:
  - [ ] Ensure route guards are compatible with TanStack Router
  - [ ] Implement redirect logic for unauthenticated users
  - [ ] Update authentication state checks
- [ ] Verify Clerk provider initialization works with TanStack Router
- [ ] Test authentication state persistence

### Fix Component References
- [ ] Check for components that directly reference router
- [ ] Update any hooks that use router-specific functionality:
  - [ ] Replace React Router hooks with TanStack equivalents
  - [ ] Update any `useParams` or `useLocation` usage
- [ ] Fix any import paths that might have changed
- [ ] Ensure component props match expected types

## Phase 4: Testing and Verification (~30 minutes)

### Basic Application Startup
- [ ] Start the application: `pnpm dev`
- [ ] Verify application loads without console errors
- [ ] Check that main UI components are visible
- [ ] Verify styling and layout are correct
- [ ] Check that sidebar navigation is displayed

### Navigation Testing
- [ ] Test navigation to all main routes:
  - [ ] Home route
  - [ ] Chat routes
  - [ ] Settings routes
  - [ ] Any new routes in the update branch
- [ ] Verify components render correctly on each route
- [ ] Test navigation history (back/forward)
- [ ] Check URL updates correctly with navigation

### Authentication Testing
- [ ] Test sign-in flow:
  - [ ] Verify redirect to sign-in page works
  - [ ] Test sign-in form functionality
  - [ ] Verify redirect after successful sign-in
- [ ] Test sign-up flow
- [ ] Verify protected routes:
  - [ ] Attempt to access protected route when not logged in
  - [ ] Confirm redirect to sign-in page
  - [ ] Verify access after authentication
- [ ] Test sign-out functionality

## Phase 5: Final Cleanup and Documentation (~15 minutes)

### Code Cleanup
- [ ] Remove any unused imports or code
- [ ] Format code for consistency
- [ ] Add comments explaining router configuration
- [ ] Remove temporary files or backups

### Documentation
- [ ] Update README with any router-specific instructions
- [ ] Document any known issues or limitations
- [ ] Add notes about router configuration for future reference

### Final Testing
- [ ] Perform one final test of all main functionality
- [ ] Verify all components render correctly
- [ ] Check console for any warnings or errors
- [ ] Confirm authentication flows work as expected

## Progress Tracking

**Phase 1 completion: 14 / 14 steps** ✓
**Phase 2 completion: 17 / 17 steps** ✓
**Phase 3 completion: __ / 13 steps**
**Phase 4 completion: __ / 14 steps**
**Phase 5 completion: __ / 9 steps**

**Total progress: 31 / 67 steps** 