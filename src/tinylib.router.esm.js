/**
 * @typedef {Object} RouterOptions
 * @property {string} [selectorAttrib='data-route'] - Attribute used to identify elements for automatic navigation binding. Set to empty string to disable automatic binding.
 * @property {RouteHandler} [defaultHandler=null] - Function called when no route matches the current path (404 handler).
 */

/**
 * @typedef {Object} RouteContext
 * @property {string} path - The matched route path pattern.
 * @property {Object.<string, string>} params - Key-value pairs of matched route parameters. For wildcard routes, params['*'] contains the matched wildcard path.
 * @property {URLSearchParams} query - The parsed query parameters.
 * @property {string} hash - The URL hash (without the #).
 * @property {any} state - The history state object associated with the navigation.
 * @property {Location} location - The window.location object.
 */

/**
 * @typedef {Object} RouteHandlers
 * @property {RouteHandler|RouteHandler[]} [before] - Function(s) called before the main route handler. Return `false` to cancel navigation.
 * @property {RouteHandler} [on] - The main route handler function.
 * @property {RouteHandler|RouteHandler[]} [after] - Function(s) called after the main route handler.
 */

/**
 * @callback RouteHandler
 * @param {RouteContext} ctx
 */

export default {
    /**
     * Create a new Router instance.
     * @param {RouterOptions} [options={}] - Router configuration options.
     * @returns {Router}
     */
    new: function (options = {}) {
        return new Router(options);
    }
};

/** @type {RouterOptions} */
const _default_options = {
    // An onClick->navigate() is attached to all elements with this attribute.
    // If this attrib has a value, that's used as the path. Otherwise, if the
    // element has a href, that's used as the path.
    selectorAttrib: 'data-route',

    // If a route is not matched, this handler is called.
    defaultHandler: null,
};

/**
 * Router class for handling client-side navigation.
 * Provides declarative routing with support for parameters, wildcards, hooks, and route groups.
 * @example
 * const router = TinyRouter.new({
 *   selectorAttrib: 'data-route',
 *   defaultHandler: (ctx) => console.log('404')
 * });
 * 
 * router
 *   .beforeEach((ctx) => console.log('Navigating to', ctx.path))
 *   .on('/', () => console.log('Home'))
 *   .on('/users/{id}', (ctx) => console.log('User:', ctx.params.id))
 *   .on('/blog/*', (ctx) => console.log('Blog section:', ctx.params['*']))
 *   .ready();
 */
class Router {
    /**
     * Create a new Router instance.
     * @param {RouterOptions} options - Router configuration options.
     */
    constructor(options) {
        /** 
         * Array of registered routes.
         * @type {Array<{path: string, regex: RegExp, params: string[], hasWildcard: boolean, handlers: RouteHandlers}>}
         */
        this.routes = [];
        /** 
         * Router configuration options.
         * @type {RouterOptions}
         */
        this.options = { ..._default_options, ...options };
        /** 
         * Array of global beforeEach handlers.
         * @type {RouteHandler[]}
         */
        this.beforeEachHandlers = [];
        /** 
         * Array of global afterEach handlers.
         * @type {RouteHandler[]}
         */
        this.afterEachHandlers = [];
    }

    /**
     * Register a global beforeEach handler that runs before every navigation.
     * Handlers can return `false` to cancel navigation (useful for auth checks).
     * @param {RouteHandler} handler - Function that receives the route context.
     * @returns {this}
     * @example
     * // Authentication check
     * router.beforeEach((ctx) => {
     *   if (!isLoggedIn() && !ctx.path.startsWith('/login')) {
     *     router.navigate('/login');
     *     return false;
     *   }
     * });
     * 
     * // Loading indicator
     * router.beforeEach((ctx) => {
     *   document.body.classList.add('loading');
     * });
     */
    beforeEach(handler) {
        this.beforeEachHandlers.push(handler);
        return this;
    }

    /**
     * Register a global afterEach handler that runs after every navigation.
     * @param {RouteHandler} handler - Function that receives the route context.
     * @returns {this}
     * @example
     * // Remove loading indicator
     * router.afterEach((ctx) => {
     *   document.body.classList.remove('loading');
     * });
     * 
     * // Analytics tracking
     * router.afterEach((ctx) => {
     *   analytics.page(ctx.path);
     * });
     */
    afterEach(handler) {
        this.afterEachHandlers.push(handler);
        return this;
    }

    /**
     * Register a new route with optional handlers.
     * @param {string} path - The route path pattern. Supports parameters (e.g., `/users/{id}`) and wildcards (e.g., `/blog/*`).
     * @param {RouteHandler|RouteHandlers} handlers - Route handler function or object with `before`, `on`, and `after` hooks.
     * @returns {this}
     * @example
     * // Simple handler
     * router.on('/about', (ctx) => console.log('About page'));
     * 
     * // With parameters
     * router.on('/users/{id}', (ctx) => console.log(ctx.params.id));
     * 
     * // With wildcard
     * router.on('/blog/*', (ctx) => console.log(ctx.params['*']));
     * 
     * // With hooks
     * router.on('/admin', {
     *   before: (ctx) => { if (!isLoggedIn()) return false; },
     *   on: (ctx) => console.log('Admin panel'),
     *   after: (ctx) => console.log('Left admin')
     * });
     */
    on(path, handlers) {
        if (typeof handlers === 'function') {
            handlers = { on: handlers };
        }

        const { regex, params } = this._parsePath(path);
        this.routes.push({ path, regex, params, handlers });
    }

    /**
     * Create a route group with a common prefix and optional shared handlers.
     * @param {string} prefix - The path prefix for the group (e.g., `/api` or `/admin`).
     * @param {RouteHandlers} [groupHandlers={}] - Shared handlers for all routes in the group.
     * @returns {{on: (subPath: string, handlers: RouteHandler|RouteHandlers) => void}}
     * @example
     * // Group with authentication check
     * router.group('/admin', {
     *   before: (ctx) => {
     *     if (!isAdmin()) return false;
     *   }
     * }).on('/dashboard', (ctx) => {
     *   console.log('Admin dashboard');
     * }).on('/settings', (ctx) => {
     *   console.log('Admin settings');
     * });
     */
    group(prefix, groupHandlers = {}) {
        const parent = this;
        return {
            on: (subPath, handlers) => {
                if (typeof handlers === 'function') {
                    handlers = { on: handlers };
                }

                const path = prefix + subPath;
                const mergedHandlers = this._mergeHandlers(groupHandlers, handlers);
                parent.on(path, mergedHandlers);
            }
        };
    }

    /**
     * Initialize the router and bind events.
     * Sets up popstate listener for browser back/forward navigation, binds click handlers, and handles initial page load.
     * @returns {this}
     * @example
     * router
     *   .on('/', homeHandler)
     *   .on('/about', aboutHandler)
     *   .ready();
     */
    ready() {
        window.addEventListener('popstate', () => this._handleNavigation());
        this.bind(document);
        this._handleNavigation();
        return this;
    }

    /**
     * Bind navigation to elements with the configured attribute within a parent element.
     * Uses event delegation for better performance and automatic handling of dynamically added elements.
     * @param {HTMLElement|Document} parent - The parent element to search for routable elements.
     * @example
     * // Bind to entire document (called automatically by ready())
     * router.bind(document);
     * 
     * // Bind to specific container (useful for lazy-loaded content)
     * router.bind(document.querySelector('#app'));
     */
    bind(parent) {
        const attrib = this.options.selectorAttrib;
        if (!attrib) {
            return;
        }

        parent.addEventListener('click', (e) => {
            const target = e.target.closest(`[${attrib}]`);
            if (!target || !parent.contains(target)) return;

            const path = target.getAttribute(attrib) || target.getAttribute('href');
            if (!path) return;

            if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;

            e.preventDefault();
            this.navigate(path);
        });
    }

    /**
     * Programmatically navigate to a URL.
     * Updates browser history and triggers route matching.
     * @param {string} path - The target path (e.g., `/users` or `/search`).
     * @param {Object|URLSearchParams} [query={}] - Query parameters as object or URLSearchParams.
     * @param {string} [hash=''] - URL hash without the `#` symbol.
     * @param {boolean} [pushState=true] - Use `pushState` (true) for new history entry or `replaceState` (false) to replace current.
     * @returns {void}
     * @example
     * // Simple navigation
     * router.navigate('/about');
     * 
     * // With query parameters
     * router.navigate('/search', { q: 'hello', page: 2 });
     * 
     * // With hash
     * router.navigate('/docs', {}, 'installation');
     * 
     * // Replace history (useful for redirects)
     * router.navigate('/login', {}, '', false);
     */
    navigate(path, query = {}, hash = '', pushState = true) {
        const normalizedPath = this._normalizePath(path);
        const url = this._makeURL(normalizedPath, query, hash);

        // If the current page is the same as the target URL, don't change the history,
        // but execute the handlers.
        if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== url) {
            const method = pushState ? 'pushState' : 'replaceState';
            window.history[method]({}, '', url);
        }

        this._handleNavigation();
    }

    /**
     * Normalize a path by ensuring it has a leading slash and no trailing slash (unless it's the root).
     * @private
     * @param {string} path
     * @returns {string}
     */
    _normalizePath(path) {
        if (!path.startsWith('/')) {
            path = '/' + path;
        }
        if (path.length > 1 && path.endsWith('/')) {
            path = path.slice(0, -1);
        }
        return path;
    }

    /**
     * Parse path into regex and parameter names.
     * @private
     * @param {string} path
     * @returns {{regex: RegExp, params: string[], hasWildcard: boolean}}
     */
    _parsePath(path) {
        const normalizedPath = this._normalizePath(path);
        const params = [];
        const hasWildcard = normalizedPath.endsWith('/*');
        
        let regexPath = normalizedPath.replace(/\{\w+\}/g, match => {
            params.push(match.slice(1, -1));
            return '([^/]+)';
        });
        
        if (hasWildcard) {
            regexPath = regexPath.slice(0, -2) + '(?:/(.*))?$';
        } else {
            regexPath = regexPath + '$';
        }
        
        const regex = new RegExp('^' + regexPath);

        return { regex, params, hasWildcard };
    }

    /**
     * Handle URL change and execute matching route.
     * Matches current pathname against registered routes and executes handlers in order.
     * Falls back to defaultHandler if no route matches.
     * @private
     * @returns {void}
     */
    _handleNavigation() {
        const path = this._normalizePath(window.location.pathname);
        const state = window.history.state;

        // Iterate through the routes and stop at the first match.
        for (const route of this.routes) {
            const match = path.match(route.regex);
            if (!match) continue;

            // Extract parameters from the URL.
            const params = route.params.reduce((acc, name, i) => {
                acc[name] = match[i + 1];
                return acc;
            }, {});
            
            // Extract wildcard match if present
            if (route.hasWildcard) {
                params['*'] = match[match.length - 1] || '';
            }

            // Parse query string and hash
            const query = new URLSearchParams(window.location.search);
            const hash = window.location.hash.substring(1);

            // Create the handler callback context.
            const ctx = {
                path: route.path,
                params,
                query,
                hash,
                state,
                location: window.location,
            };

            this._execHandlers(route.handlers, ctx);
            return;
        }

        // If no route matched, execute the default handler if provided.
        this.options.defaultHandler && this.options.defaultHandler({
            path,
            params: {},
            query: new URLSearchParams(window.location.search),
            hash: window.location.hash.substring(1),
            state,
            location: window.location
        })
    }

    /**
     * Execute handlers in sequence: beforeEach -> before -> on -> after -> afterEach.
     * Supports both synchronous and asynchronous handlers. If any handler returns `false`, remaining handlers are skipped.
     * @private
     * @param {RouteHandlers} handlers - Route handlers object with before, on, and after hooks.
     * @param {RouteContext} ctx - Context object containing path, params, query, hash, state, and location.
     * @returns {Promise<void>}
     */
    async _execHandlers(handlers, ctx) {
        const chain = [];
        
        // Add global beforeEach handlers
        chain.push(...this.beforeEachHandlers);
        
        // Add route-specific handlers
        handlers.before && chain.push(...[handlers.before].flat());
        handlers.on && chain.push(handlers.on);
        handlers.after && chain.push(...[handlers.after].flat());
        
        // Add global afterEach handlers
        chain.push(...this.afterEachHandlers);

        for (const fn of chain) {
            if (fn) {
                // If a handler explicitly returns false, cancel the rest of the navigation chain
                if (await fn(ctx) === false) {
                    return;
                }
            }
        }
    }

    /**
     * Merge group handlers with route handlers.
     * Combines before hooks (group before runs first), uses route's `on` handler (falls back to group's), and combines after hooks (route after runs first).
     * @private
     * @param {RouteHandlers} group - Group-level handlers.
     * @param {RouteHandlers} route - Route-level handlers.
     * @returns {RouteHandlers} Merged handlers object.
     */
    _mergeHandlers(group, route) {
        return {
            before: [group.before, route.before].filter(Boolean).flat(),
            on: route.on || group.on,
            after: [route.after, group.after].filter(Boolean).flat()
        };
    }

    /**
     * Build complete URL from components.
     * Constructs URL string from path, query parameters, and hash.
     * @private
     * @param {string} path - Base path (e.g., `/users`).
     * @param {Object|URLSearchParams} query - Query parameters.
     * @param {string} hash - Hash without `#`.
     * @returns {string} Complete URL string (e.g., `/users?id=1#section`).
     */
    _makeURL(path, query, hash) {
        let qs = null;

        if (query) {
            qs = (query instanceof URLSearchParams) ? query.toString() : new URLSearchParams(query).toString();
        }

        return path + (qs ? `?${qs}` : '') + (hash ? `#${hash}` : '');
    }
}
