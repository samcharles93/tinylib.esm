# tinylib.esm

A collection of tiny, vanilla JS libraries for building single-page applications with no dependencies.

- **tinylib.router.esm**: A tiny router (~4 KB minified+gzipped) built on the browser's `window.history` API.
- **tinylib.state.esm**: A tiny reactive state management library (~800 bytes minified+gzipped).

---

## tinylib.router.esm (Router)

A tiny, vanilla JS client-side router for single-page apps. Ideal for simple vanilla JS single-page applications, using with AlpineJS etc.

### Features
- Dynamic route parameters using the `{param}` syntax
- Route grouping with shared handlers
- Support for before/after handler hooks
- Automatic optional binding to `<a>` and other tags for navigation

### Usage

```bash
npm install @samcharles93/tinylib.esm
```

#### Basic

```javascript
import router from '@samcharles93/tinylib.esm/router';

// Create router instance.
const r = router.new({
  defaultHandler: (ctx) => console.log('Route not found', ctx.location.pathname)
});

// Register routes.
r.on('/', (ctx) => console.log(ctx));
r.on('/users/{id}', (ctx) => console.log('User profile', ctx.params.id));

// Initialize router.
r.ready();

r.navigate('/users/42', { filter: 'active' }, 'settings');
```

#### Advanced

```javascript
// Route with before/handler hooks.
r.on('/posts/{id}', {
  before: (ctx) => console.log('Before post handler'),
  on: (ctx) => console.log('Post content', ctx.params.id),
  after: (ctx) => console.log('After post handler')
});

// Route group.
const admin = r.group('/admin', {
  before: (ctx) => checkAdminAuth()
});

// These routes are automatically prefixed with /admin and the before()
// callback on the group is triggered for all of them. 
admin.on('/dashboard', (ctx) => renderDashboard());
admin.on('/users/{id}', (ctx) => renderUserEditor(ctx.params.id));
```

#### Global handlers

You can register global handlers that run for every navigation:

```javascript
// Runs before every route's before/on/after handlers
r.beforeEach((ctx) => {
  console.log('global beforeEach', ctx.path, ctx.location.pathname);
});

// Runs after every route's before/on/after handlers
r.afterEach((ctx) => {
  console.log('global afterEach', ctx.path, ctx.location.pathname);
});
```

#### Link binding

Simply add the `data-route` attribute to links for automatic on-click navigation.

```html
<a href="/users/42" data-route>View User</a>
```

---

## tinylib.state.esm (State Management)

A tiny, vanilla JS reactive state management library for frontend applications.

### Features
- **Reactive State**: Proxy-based reactivity for automatic updates
- **Computed Properties**: Derived state that auto-updates when dependencies change
- **Actions with Hooks**: State mutations with before/do/after lifecycle hooks
- **Watchers**: Subscribe to specific state changes
- **Auto-binding**: Automatic event binding to elements with `data-action` attribute
- **Persistence**: Optional localStorage/sessionStorage sync

### Usage

```bash
npm install @samcharles93/tinylib.esm/state
```

#### Basic

```javascript
import state from '@samcharles93/tinylib.esm/state';

// Create store with initial state
const store = state.new({
  initialState: {
    count: 0,
    user: null
  }
});

// Watch for changes
store.watch('count', (newVal, oldVal) => {
  console.log('count changed:', newVal);
});

// Define actions
store.action('increment', (state, payload) => {
  state.count += payload?.amount || 1;
});

// Dispatch actions
await store.dispatch('increment', { amount: 5 });

// Auto-bind to elements
store.bind(document);
```

```html
<button data-action="increment" data-amount="5">+5</button>
```

#### Advanced (Computed, Hooks, Persistence)

```javascript
const store = state.new({
  initialState: { count: 0 },
  computed: {
    doubled: (state) => state.count * 2
  },
  storageKey: 'my-app-settings', // Optional persistence
  storageType: 'localStorage'
});

// Actions with hooks
store.action('login', {
  before: (state, credentials) => {
    if (!credentials.email) return false; // Cancel action
  },
  do: (state, credentials) => {
    state.user = { email: credentials.email };
  }
});
```

#### Data Action Attributes

When using `store.bind()`, elements with `data-action` can include additional data attributes:

```html
<button data-action="setPage" data-page="2" data-filter="active">Page 2</button>
```

---

## Integration

Using both libraries together:

```javascript
import router from '@samcharles93/tinylib.esm/router';
import state from '@samcharles93/tinylib.esm/state';

const r = router.new();
const store = state.new({
  initialState: { currentPage: 'home' }
});

// Update state on route changes
r.beforeEach((ctx) => {
  store.state.currentPage = ctx.path;
});

// Protect routes based on state
r.on('/admin', {
  before: (ctx) => {
    if (!store.state.user?.isAdmin) {
      r.navigate('/login');
      return false;
    }
  },
  on: (ctx) => console.log('Admin panel')
});
```

---

## Demos

- [**Tiny Router Demo**](https://samcharles93.github.io/tinylib.esm/demo-router.html) - Demonstrates routing, parameters, groups, and guards.
- [**Tiny State Demo**](https://samcharles93.github.io/tinylib.esm/demo-state.html) - Demonstrates reactive state, actions, computed properties, and persistence.

To run locally:
```bash
npm run dev
# Open http://localhost:8000/
```

---

## API Reference

### Router API

| Method | Description |
|--------|-------------|
| `router.new(options)` | Creates a new router instance |
| `r.on(path, handler)` | Registers a route handler |
| `r.group(prefix, handlers{})` | Creates a group of routes with a common prefix |
| `r.ready()` | Initializes the router |
| `r.navigate(path, query, hash, pushState)` | Navigates to a new route |
| `r.bind(parent)` | Binds navigate() onclick of elements with `data-route` |
| `r.beforeEach(handler)` | Runs before every navigation |
| `r.afterEach(handler)` | Runs after every navigation |

### State API

| Method | Description |
|--------|-------------|
| `state.new(options{})` | Creates a new store instance |
| `store.watch(key, callback)` | Subscribe to changes on a state key |
| `store.action(name, handler)` | Register an action |
| `store.dispatch(name, payload)` | Execute an action by name |
| `store.bind(parent)` | Binds action dispatch to elements with `data-action` |
| `store.getState()` | Get the reactive state proxy |
| `store.setState(newState)` | Replace entire state |
| `store.clearStorage()` | Clear persisted state from storage |

## License

Licensed under the MIT License.
