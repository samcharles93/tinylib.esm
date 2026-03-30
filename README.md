# tinylib.esm

A tiny, vanilla JS client-side router for single-page apps on top of the browser's `window.history` API.
No dependencies and ~4 KB minified+gzipped. Ideal for simple vanilla JS single-page applications, using with AlpineJS etc.

## Companion Library: tinylib.state.esm

Looking for state management? Check out [tinylib.state.esm](./README-tinylib.state.esm.md) - a tiny reactive state management library designed to work standalone or alongside tinylib.esm. Same design philosophy, same tiny footprint (~3.5 KB).

## Features

- Dynamic route parameters using the `{param}` syntax
- Route grouping with shared handlers
- Support for before/after handler hooks
- Automatic optional binding to `<a>` and other tags for navigation

[**View demo**](https://knadh.github.io/tinylib.esm/demo)

## Usage

```
npm install @samcharles93/tinylib.esm
```

### Basic

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

### Advanced

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

// Programmatic navigation.
r.navigate('/users/42', { filter: 'active' }, 'settings');
```

See the [demo source](https://github.com/samcharles93/tinylib.esm/blob/master/404.html) for a full working example.

## Demos

See [DEMOS.md](./DEMOS.md) for detailed instructions on running the demos.

- **Quick Test**: [test.html](https://knadh.github.io/tinylib.esm/test.html) - Verify libraries load correctly
- **tinylib.esm Demo**: [404.html](https://knadh.github.io/tinylib.esm/404.html) - Original router demo
- **tinylib.state.esm Demo**: [tinylib.state.esm-demo.html](https://knadh.github.io/tinylib.esm/tinylib.state.esm-demo.html) - State management features
- **Integration Demo**: [integration-demo.html](https://knadh.github.io/tinylib.esm/integration-demo.html) - Both libraries together

### Running Locally

```bash
npm run dev
# Open http://localhost:8000/test.html
```

### Global handlers

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
// Order: global beforeEach -> group before -> route before -> on -> route after -> group after -> global afterEach

```

Multiple `beforeEach` and `afterEach` handlers may be registered; they run in the order they were added.

### Link binding

Simply add the `data-route` attribute to links for automatic on-click navigation.

```html
<a href="/users/42" data-route>View User</a>
```


## API

| Method | Description |
|--------|-------------|
| `router.New(options)` | Creates a new router instance. See `_default_options{}` in the source code for options. |
| `r.on(path, handler)` | Registers a route handler |
| `r.group(prefix, handlers{})` | Creates a group of routes with a common prefix |
| `r.ready()` | Initializes the router |
| `r.navigate(path, query, hash, pushState)` | Navigates to a new route |
| `r.bind(parent)` | Binds navigate() onclick of all elements in the parent tagged with `data-route` |
| `r.beforeEach(handler)` | Registers a global handler that runs before every navigation |
| `r.afterEach(handler)` | Registers a global handler that runs after every navigation |

Licensed under the MIT License.
