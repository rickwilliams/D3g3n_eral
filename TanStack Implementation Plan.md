# TanStack Router Reinstatement Implementation Plan

## Phase 1: Initial Assessment and Backup (~15 minutes)

### Create Backup Branch
- [ ] Verify current branch is `update-v0.25.9`
- [ ] Create backup branch: `git checkout -b update-v0.25.9-backup`
- [ ] Verify backup branch creation was successful
- [ ] Return to working branch: `git checkout update-v0.25.9`

### Verify Dependencies
- [ ] Examine `package.json` in current branch
- [ ] Check for TanStack Router dependencies:
  - [ ] `@tanstack/react-router`
  - [ ] `@tanstack/router-devtools` (for development)
- [ ] Compare with `package.json` from stable branch
- [ ] Install missing dependencies if needed:
  - [ ] `pnpm add @tanstack/react-router`
  - [ ] `pnpm add -D @tanstack/router-devtools`

### Assess Routes Directory
- [ ] Check if `routes` directory exists in current branch
- [ ] Compare with `routes` directory in stable branch
- [ ] Identify missing files and folders
- [ ] Document the current state of routing files

## Phase 2: Restore Core Router Files (~30 minutes)

### Restore Routes Configuration
- [ ] Create `routes` directory if it doesn't exist
- [ ] Check out `routes/index.ts` from stable branch
- [ ] Verify file was successfully restored
- [ ] Check for any imports that might be outdated or missing
- [ ] Update imports if needed to match current project structure

### Restore Main Entry Point
- [ ] Save a copy of current `main.tsx` for reference
- [ ] Examine `main.tsx` from stable branch
- [ ] Check out `main.tsx` from stable branch
- [ ] Verify TanStack Router initialization code is present
- [ ] Ensure imports are correct:
  - [ ] `import { router, queryClient } from './routes/index'`
  - [ ] `import { RouterProvider } from "@tanstack/react-router"`

### Update App Component
- [ ] Save a copy of current `App.tsx` for reference
- [ ] Create a temporary merged version with:
  - [ ] TanStack Router structure from stable branch
  - [ ] Clerk authentication components from update branch
  - [ ] Any new components or features from update branch
- [ ] Replace React Router components with TanStack equivalents:
  - [ ] `<Routes>` → TanStack Router structure
  - [ ] `<Route>` → TanStack route definitions
  - [ ] Add `<Outlet />` component for rendering nested routes
- [ ] Ensure ClerkProvider wraps the entire application
- [ ] Update the file with the merged changes

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

**Phase 1 completion: __ / 14 steps**
**Phase 2 completion: __ / 17 steps**
**Phase 3 completion: __ / 13 steps**
**Phase 4 completion: __ / 14 steps**
**Phase 5 completion: __ / 9 steps**

**Total progress: __ / 67 steps** 