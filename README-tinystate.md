# tinylib.state.esm

A tiny, vanilla JS reactive state management library for frontend applications.
No dependencies and ~800 bytes minified+gzipped. Designed to work standalone or alongside tinylib.esm.

## Features

- **Reactive State**: Proxy-based reactivity for automatic updates
- **Computed Properties**: Derived state that auto-updates when dependencies change
- **Actions with Hooks**: State mutations with before/do/after lifecycle hooks
- **Watchers**: Subscribe to specific state changes
- **Auto-binding**: Automatic event binding to elements with `data-action` attribute
- **Persistence**: Optional localStorage/sessionStorage sync
- **Zero Dependencies**: Pure vanilla JavaScript

## Usage

```
npm install @samcharles93/tinylib.esm/tinylib.state.esm
```

### Basic

```javascript
import state from '@samcharles93/tinylib.esm/tinylib.state.esm';

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

### Advanced

```javascript
// Computed properties
const store = state.new({
  initialState: { count: 0 },
  computed: {
    doubled: (state) => state.count * 2,
    isEven: (state) => state.count % 2 === 0
  }
});

store.watch('doubled', (val) => {
  console.log('doubled:', val); // Auto-updates when count changes
});

// Actions with hooks
store.action('login', {
  before: (state, credentials) => {
    if (!credentials.email) {
      console.error('Email required');
      return false; // Cancel action
    }
  },
  do: (state, credentials) => {
    state.user = { email: credentials.email };
  },
  after: (state, credentials) => {
    console.log('User logged in:', state.user.email);
  }
});

await store.dispatch('login', { email: 'user@example.com' });

// Persistence
const persistentStore = state.new({
  initialState: { settings: {} },
  storageKey: 'my-app-settings', // Auto-saves to localStorage
  storageType: 'localStorage' // or 'sessionStorage'
});
```

See the [demo source](https://github.com/samcharles93/tinylib.esm/blob/master/tinylib.state.esm-demo.html) for a full working example.

### Integration with tinylib.esm

```javascript
import router from '@samcharles93/tinylib.esm';
import state from '@samcharles93/tinylib.esm/tinylib.state.esm';

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
  on: (ctx) => {
    console.log('Admin panel');
  }
});
```

## API

| Method | Description |
|--------|-------------|
| `state.New(options{})` | Creates a new store instance. Options: `initialState`, `computed`, `storageKey`, `storageType` |
| `store.watch(key, callback)` | Subscribe to changes on a state key. Returns unsubscribe function |
| `store.action(name, handler)` | Register an action (function or object with before/do/after hooks) |
| `store.dispatch(name, payload)` | Execute an action by name |
| `store.bind(parent)` | Binds action dispatch to all elements with `data-action` attribute |
| `store.getState()` | Get the reactive state proxy |
| `store.setState(newState)` | Replace entire state |
| `store.clearStorage()` | Clear persisted state from storage |

## Data Action Attributes

When using `store.bind()`, elements with `data-action` can include additional data attributes:

```html
<!-- Simple action -->
<button data-action="logout">Logout</button>

<!-- Action with payload -->
<button data-action="setPage" data-page="2" data-filter="active">
  Page 2
</button>

<!-- JSON payload -->
<button data-action='{"complex": {"nested": "data"}}'>
  Complex Data
</button>
```

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires Proxy support (no IE11)

## License

MIT License - See [LICENSE](https://github.com/samcharles93/tinylib.esm/blob/master/LICENSE)
