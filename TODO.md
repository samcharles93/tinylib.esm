# TODO: tinylib.esm Improvements

## Core Functionality
- [x] **Async Handler Support**: Update `_execHandlers` to support `async/await`. This is crucial for `beforeEach` hooks that might need to perform authentication checks or fetch data before allowing a route to load.
- [x] **Navigation Cancellation**: Allow `beforeEach` handlers to cancel navigation by returning `false` (or a specific value/rejection).
- [x] **Improved Context**: 
    - [x] Add parsed query parameters (`ctx.query`) to the context object passed to handlers.
    - [x] Add hash (`ctx.hash`) to the context.
- [x] **Wildcard Routes**: Add support for wildcard matching (e.g., `/blog/*`) to handle sub-paths or catch-all routes.
- [x] **Event Delegation**: Refactor `bind()` to use event delegation on the `parent` element instead of attaching individual click listeners to every element with `selectorAttrib`. This is more efficient for large DOMs and handles dynamically added elements automatically.
- [ ] **Navigation Hooks**: Add `onError` handler for when route matching or handlers fail.

## Developer Experience (DX)
- [x] **Comprehensive JSDoc**: Add JSDoc comments to all classes, methods, and types. This provides excellent IDE autocompletion and type safety for vanilla JS users without requiring a TypeScript build step.
- [ ] **Testing Suite**: Implement a test suite (e.g., using Vitest or Jest) to ensure reliability and prevent regressions.
- [x] **Minification & Build Step**: While currently a single file, adding a build script to generate a minified version would be beneficial for production use.
- [x] **ESM/CJS Compatibility**: Ensure the package can be easily used in both ESM and CommonJS environments.

## Maintenance & Documentation
- [ ] **Example Apps**: Add a few more complex examples (e.g., with nested routes or authenticated routes) in a `/examples` directory.
- [x] **JSDoc Comments**: Add comprehensive JSDoc comments to all methods and properties for better in-editor documentation.
- [ ] **Performance Audit**: Ensure route matching remains fast as the number of routes grows (possibly using a more optimized matching strategy for very large apps).

## Minor Fixes
- [x] **Bug in `bind()`**: The current implementation of `bind()` incorrectly uses `el.dataset[attrib]` when checking for the path. For the default `data-route`, `el.dataset['data-route']` will be `undefined`. It should instead use `el.getAttribute(attrib)` to correctly retrieve the path if the attribute has a value.
- [x] **Path Normalization**: Ensure paths with/without trailing slashes are handled consistently.
- [ ] **Absolute URL support**: Better handling of absolute URLs in `navigate()`.

## tinylib.state.esm - State Management Companion

### Core Features
- [x] **Reactive State**: Auto-update DOM when state changes via Proxy-based reactivity
- [x] **Computed Properties**: Derived state that automatically recalculates
- [x] **Actions with Hooks**: State mutations with before/do/after hooks
- [x] **Watchers**: Subscribe to specific state changes
- [x] **Auto-binding**: Bind data-action elements to store actions (like tinylib.esm's data-route)
- [x] **Persistence**: Optional localStorage/sessionStorage sync with lifecycle hooks

### Developer Experience
- [x] **JSDoc Types**: Full JSDoc coverage with generics for IDE autocomplete
- [x] **ESM/CJS Builds**: Match tinylib.esm build output structure
- [x] **Minification**: Build script for production bundle
- [x] **Examples**: Demo showing tinylib.state.esm features and tinylib.esm integration

### Integration
- [ ] **Router Integration**: State updates on route changes, route guards based on state
- [x] **Shared Design Patterns**: Consistent API with tinylib.esm (new(), hooks, bind())
