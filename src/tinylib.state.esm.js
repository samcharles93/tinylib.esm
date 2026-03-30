/**
 * @template T
 * @typedef {Object} StoreOptions
 * @property {T} [initialState={}] - Initial state object.
 * @property {Object.<string, (state: T) => any>} [computed={}] - Computed properties that derive state.
 * @property {string} [storageKey=null] - localStorage key for persistence. Set to null to disable.
 * @property {'localStorage'|'sessionStorage'} [storageType='localStorage'] - Storage type for persistence.
 */

/**
 * @template T
 * @typedef {Object} Watcher
 * @property {(newValue: T, oldValue: T, key: string) => void} callback - Function called when watched key changes.
 * @property {T} oldValue - Previous value.
 */

/**
 * @template T
 * @typedef {Object} ActionHooks
 * @property {(state: T, payload?: any) => Promise<boolean|void>|boolean|void} [before] - Called before the action executes. Can return false to cancel.
 * @property {(state: T, payload?: any) => Promise<void>|void} do - The action implementation that modifies state.
 * @property {(state: T, payload?: any) => Promise<void>|void} [after] - Called after the action executes successfully.
 */

/**
 * @template T
 * @callback WatchCallback
 * @param {T} newValue - The new value.
 * @param {T} oldValue - The old value.
 * @param {string} key - The state key that changed.
 */

/**
 * @template T
 * @callback ActionFunction
 * @param {T} state - The reactive state proxy.
 * @param {any} [payload] - Optional payload passed to the action.
 */

/**
 * @template T
 * @typedef {Object.<string, Watcher<T>>} WatchersMap
 */

/**
 * @template T
 * @typedef {Object.<string, ActionHooks<T>>} ActionsMap
 */

export default {
    /**
     * Create a new reactive store.
     * @template T
     * @param {StoreOptions<T>} [options={}] - Store configuration options.
     * @returns {Store<T>}
     */
    new: function (options = {}) {
        return new Store(options);
    }
};

/** @type {StoreOptions<{}>} */
const _default_options = {
    initialState: {},
    computed: {},
    storageKey: null,
    storageType: 'localStorage'
};

/**
 * Reactive store class for state management.
 * Provides Proxy-based reactivity, computed properties, actions with hooks, and auto-binding.
 * @template T
 * @example
 * const store = TinyState.new({
 *   initialState: { count: 0, user: null },
 *   computed: {
 *     doubled: (state) => state.count * 2
 *   }
 * });
 * 
 * store.watch('count', (newVal, oldVal) => {
 *   console.log('count changed:', newVal);
 * });
 * 
 * store.action('increment', {
 *   do: (state, payload) => { state.count += payload.amount || 1; }
 * });
 * 
 * store.bind(document); // <button data-action="increment" data-amount="5">
 */
class Store {
    /**
     * Create a new Store instance.
     * @param {StoreOptions<T>} options - Store configuration options.
     */
    constructor(options) {
        /** @type {StoreOptions<T>} */
        this.options = { ..._default_options, ...options };
        
        /** @type {T} */
        this._state = { ...this.options.initialState };
        
        /** @type {WatchersMap<T>} */
        this._watchers = {};
        
        /** @type {ActionsMap<T>} */
        this._actions = {};
        
        /** @type {Object.<string, any>} */
        this._computedCache = {};
        
        // Load from storage if enabled
        if (this.options.storageKey) {
            this._loadFromStorage();
        }
        
        // Create reactive proxy
        this.state = this._createProxy();
        
        // Initialize computed properties
        this._computedKeys = Object.keys(this.options.computed);
        this._updateComputed();
    }

    /**
     * Create a reactive proxy for the state.
     * @private
     * @returns {Proxy<T>}
     */
    _createProxy() {
        const self = this;
        
        return new Proxy(this._state, {
            get(target, key) {
                // Return computed property if it exists
                if (self._computedKeys.includes(/** @type {string} */ (key))) {
                    return self._computedCache[/** @type {string} */ (key)];
                }
                return target[/** @type {keyof T} */ (key)];
            },
            
            set(target, key, value) {
                const keyStr = /** @type {string} */ (key);
                const oldValue = target[/** @type {keyof T} */ (key)];
                
                // Don't trigger if value hasn't changed
                if (oldValue === value) {
                    return true;
                }
                
                target[/** @type {keyof T} */ (key)] = value;
                
                // Notify watchers
                self._notifyWatchers(keyStr, value, oldValue);
                
                // Update computed properties
                self._updateComputed();
                
                // Save to storage if enabled
                if (self.options.storageKey) {
                    self._saveToStorage();
                }
                
                return true;
            }
        });
    }

    /**
     * Update all computed properties.
     * @private
     */
    _updateComputed() {
        for (const key of this._computedKeys) {
            const oldComputed = this._computedCache[key];
            const newComputed = this.options.computed[key](this.state);
            
            if (oldComputed !== newComputed) {
                this._computedCache[key] = newComputed;
                this._notifyWatchers(key, newComputed, oldComputed);
            }
        }
    }

    /**
     * Notify all watchers for a specific key.
     * @private
     * @param {string} key - The state key that changed.
     * @param {any} newValue - The new value.
     * @param {any} oldValue - The old value.
     */
    _notifyWatchers(key, newValue, oldValue) {
        const watchers = this._watchers[key] || [];
        for (const watcher of watchers) {
            watcher.callback(newValue, oldValue, key);
        }
    }

    /**
     * Subscribe to changes on a specific state key.
     * @param {keyof T} key - The state key to watch.
     * @param {WatchCallback<T[keyof T]>} callback - Function called when the value changes.
     * @returns {() => void} Unsubscribe function.
     * @example
     * store.watch('count', (newVal, oldVal) => {
     *   console.log('count changed from', oldVal, 'to', newVal);
     * });
     */
    watch(key, callback) {
        const keyStr = /** @type {string} */ (key);
        
        if (!this._watchers[keyStr]) {
            this._watchers[keyStr] = [];
        }
        
        this._watchers[keyStr].push({
            callback,
            oldValue: this.state[key]
        });
        
        // Return unsubscribe function
        return () => {
            this._watchers[keyStr] = this._watchers[keyStr].filter(w => w.callback !== callback);
        };
    }

    /**
     * Register an action with optional hooks.
     * @param {string} name - The action name.
     * @param {ActionHooks<T>|ActionFunction<T>} handlers - Action handler or object with before/do/after hooks.
     * @returns {this}
     * @example
     * // Simple action
     * store.action('setName', (state, name) => {
     *   state.name = name;
     * });
     * 
     * // Action with hooks
     * store.action('login', {
     *   before: (state, credentials) => {
     *     if (!credentials.email) return false; // Cancel
     *   },
     *   do: (state, credentials) => {
     *     state.user = { email: credentials.email };
     *   },
     *   after: (state, credentials) => {
     *     console.log('User logged in');
     *   }
     * });
     */
    action(name, handlers) {
        if (typeof handlers === 'function') {
            handlers = { do: handlers };
        }
        
        this._actions[name] = /** @type {ActionHooks<T>} */ (handlers);
        return this;
    }

    /**
     * Execute an action by name.
     * @param {string} name - The action name to execute.
     * @param {any} [payload] - Optional payload to pass to the action.
     * @returns {Promise<boolean>} True if action succeeded, false if cancelled.
     * @example
     * await store.dispatch('increment', { amount: 5 });
     */
    async dispatch(name, payload) {
        const action = this._actions[name];
        if (!action) {
            console.warn(`Action "${name}" not found`);
            return false;
        }
        
        // Execute before hook
        if (action.before) {
            const result = await action.before(this.state, payload);
            if (result === false) {
                return false;
            }
        }
        
        // Execute main action
        await action.do(this.state, payload);
        
        // Execute after hook
        if (action.after) {
            await action.after(this.state, payload);
        }
        
        return true;
    }

    /**
     * Bind action triggers to elements with data-action attribute.
     * Uses event delegation for efficient handling of dynamic elements.
     * @param {HTMLElement|Document} parent - The parent element to search for action elements.
     * @returns {this}
     * @example
     * // Bind to entire document
     * store.bind(document);
     * 
     * // HTML: <button data-action="increment" data-amount="1">+</button>
     */
    bind(parent) {
        parent.addEventListener('click', async (e) => {
            const target = e.target.closest('[data-action]');
            if (!target || !parent.contains(target)) return;
            
            const actionName = target.getAttribute('data-action');
            if (!actionName) return;
            
            // Extract payload from data-* attributes
            const payload = {};
            for (const attr of target.attributes) {
                if (attr.name.startsWith('data-') && attr.name !== 'data-action') {
                    const key = attr.name.replace('data-', '');
                    let value = attr.value;
                    
                    // Try to parse as JSON
                    try {
                        value = JSON.parse(value);
                    } catch (e) {
                        // Keep as string
                    }
                    
                    payload[key] = value;
                }
            }
            
            e.preventDefault();
            await this.dispatch(actionName, Object.keys(payload).length > 0 ? payload : undefined);
        });
        
        return this;
    }

    /**
     * Get the current state (read-only).
     * @returns {Proxy} The reactive state proxy.
     */
    getState() {
        return this.state;
    }

    /**
     * Replace the entire state.
     * @param {Partial<T>} newState - The new state object.
     * @returns {this}
     */
    setState(newState) {
        for (const key in this._state) {
            if (!(key in newState)) {
                this._state[/** @type {keyof T} */ (key)] = undefined;
                this._notifyWatchers(key, undefined, this._state[/** @type {keyof T} */ (key)]);
            }
        }
        
        for (const key in newState) {
            this._state[/** @type {keyof T} */ (key)] = newState[/** @type {keyof T} */ (key)];
            this._notifyWatchers(key, newState[/** @type {keyof T} */ (key)], this._state[/** @type {keyof T} */ (key)]);
        }
        
        this._updateComputed();
        
        if (this.options.storageKey) {
            this._saveToStorage();
        }
        
        return this;
    }

    /**
     * Load state from storage.
     * @private
     */
    _loadFromStorage() {
        try {
            const stored = window[this.options.storageType].getItem(this.options.storageKey);
            if (stored) {
                const parsed = JSON.parse(stored);
                this._state = { ...this._state, ...parsed };
            }
        } catch (e) {
            console.warn('Failed to load state from storage:', e);
        }
    }

    /**
     * Save state to storage.
     * @private
     */
    _saveToStorage() {
        try {
            const toSave = { ...this._state };
            
            // Don't save computed properties
            for (const key of this._computedKeys) {
                delete toSave[key];
            }
            
            window[this.options.storageType].setItem(this.options.storageKey, JSON.stringify(toSave));
        } catch (e) {
            console.warn('Failed to save state to storage:', e);
        }
    }

    /**
     * Clear state from storage.
     * @returns {this}
     */
    clearStorage() {
        try {
            window[this.options.storageType].removeItem(this.options.storageKey);
        } catch (e) {
            console.warn('Failed to clear storage:', e);
        }
        return this;
    }
}
