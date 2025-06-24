/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ([
/* 0 */,
/* 1 */
/***/ (() => {

const u = up.util;
up.migrate = (function () {
    const config = new up.Config(() => ({
        logLevel: 'warn'
    }));
    function renamedProperty(object, oldKey, newKey, warning) {
        const doWarn = u.memoize(() => warning ? warn(warning) : warn('Property { %s } has been renamed to { %s } (found in %o)', oldKey, newKey, object));
        Object.defineProperty(object, oldKey, {
            configurable: true,
            get() {
                doWarn();
                return this[newKey];
            },
            set(newValue) {
                doWarn();
                this[newKey] = newValue;
            }
        });
    }
    function removedProperty(object, key, warning) {
        const doWarn = u.memoize(() => warning ? warn(warning) : warn('Property { %s } has been removed without replacement (found in %o)', key, object));
        let valueRef = [object[key]];
        Object.defineProperty(object, key, {
            configurable: true,
            get() {
                doWarn();
                return valueRef[0];
            },
            set(newValue) {
                doWarn();
                valueRef[0] = newValue;
            }
        });
        return valueRef;
    }
    function forbiddenPropertyValue(object, key, forbiddenValue, errorMessage) {
        let value = object[key];
        Object.defineProperty(object, key, {
            configurable: true,
            get() {
                return value;
            },
            set(newValue) {
                if (newValue === forbiddenValue) {
                    throw new Error(errorMessage);
                }
                value = newValue;
            }
        });
    }
    function transformAttribute(oldAttr, ...args) {
        let transformer = u.extractCallback(args);
        let { scope } = u.extractOptions(args);
        let selector = scope || `[${oldAttr}]`;
        up.macro(selector, { priority: -1000 }, function (element) {
            if (element.hasAttribute(oldAttr)) {
                let value = element.getAttribute(oldAttr);
                transformer(element, value);
            }
        });
    }
    function renamedAttribute(oldAttr, newAttr, { scope, mapValue } = {}) {
        transformAttribute(oldAttr, { scope }, function (element, value) {
            warn('Attribute [%s] has been renamed to [%s] (found in %o)', oldAttr, newAttr, element);
            if (mapValue) {
                value = u.evalOption(mapValue, value);
            }
            element.setAttribute(newAttr, value);
        });
    }
    function removedAttribute(oldAttr, { scope, replacement } = {}) {
        transformAttribute(oldAttr, { scope }, function (element, _value) {
            if (replacement) {
                warn('Attribute [%s] has been removed (found in %o). Use %s instead.', oldAttr, element, replacement);
            }
            else {
                warn('Attribute [%s] has been removed without replacement (found in %o)', oldAttr, element);
            }
        });
    }
    function fixKey(object, oldKey, newKey) {
        if (u.isDefined(object[oldKey])) {
            warn('Property { %s } has been renamed to { %s } (found in %o)', oldKey, newKey, object);
            u.renameKey(object, oldKey, newKey);
        }
    }
    const renamedEvents = {};
    function renamedEvent(oldType, newType) {
        renamedEvents[oldType] = newType;
    }
    const removedEvents = {};
    function removedEvent(type, replacementExpression = null) {
        removedEvents[type] = replacementExpression;
    }
    function fixEventType(eventType) {
        let newEventType = renamedEvents[eventType];
        if (newEventType) {
            warn(`Event ${eventType} has been renamed to ${newEventType}`);
            return newEventType;
        }
        else if (eventType in removedEvents) {
            let message = `Event ${eventType} has been removed`;
            let replacementExpression = removedEvents[eventType];
            if (replacementExpression) {
                message += `. Use ${replacementExpression} instead.`;
            }
            warn(message);
            return eventType;
        }
        else {
            return eventType;
        }
    }
    function fixEventTypes(eventTypes) {
        return u.uniq(u.map(eventTypes, fixEventType));
    }
    function renamedPackage(oldName, newName) {
        Object.defineProperty(up, oldName, {
            configurable: true,
            get() {
                warn(`up.${oldName} has been renamed to up.${newName}`);
                return up[newName];
            }
        });
    }
    const warnedMessages = {};
    const warn = up.mockable((message, ...args) => {
        const formattedMessage = u.sprintf(message, ...args);
        if (!warnedMessages[formattedMessage]) {
            warnedMessages[formattedMessage] = true;
            up.log[config.logLevel]('unpoly-migrate', message, ...args);
        }
    });
    function deprecated(deprecatedExpression, replacementExpression) {
        warn(`${deprecatedExpression} has been deprecated. Use ${replacementExpression} instead.`);
    }
    function formerlyAsync(label) {
        const promise = Promise.resolve();
        const oldThen = promise.then;
        promise.then = function () {
            warn(`${label} no longer returns a promise`);
            return oldThen.apply(this, arguments);
        };
        return promise;
    }
    const CSS_LENGTH_PROPS = [
        'top', 'right', 'bottom', 'left',
        'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
        'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
        'border-width', 'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width',
        'width', 'height',
        'max-width', 'max-height',
        'min-width', 'min-height',
    ];
    function fixStylePropName(prop) {
        if (/[A-Z]/.test(prop)) {
            warn(`CSS property names must be in kebab-case, but got camelCase "${prop}"`);
            return u.camelToKebabCase(prop);
        }
        else {
            return prop;
        }
    }
    function fixStylePropValue(prop, value, unit) {
        if (!unit && CSS_LENGTH_PROPS.includes(prop) && /^[\d.]+$/.test(value)) {
            warn(`CSS length values must have a unit, but got "${prop}: ${value}". Use "${prop}: ${value}px" instead.`);
            return value + "px";
        }
        else {
            return value;
        }
    }
    function fixStyleProps(arg, unit) {
        let transformed;
        if (u.isString(arg)) {
            transformed = fixStylePropName(arg);
        }
        else if (u.isArray(arg)) {
            transformed = arg.map(fixStylePropName);
        }
        else if (u.isObject(arg)) {
            transformed = {};
            for (let name in arg) {
                let value = arg[name];
                name = fixStylePropName(name);
                value = fixStylePropValue(name, value, unit);
                transformed[name] = value;
            }
        }
        return transformed;
    }
    return {
        deprecated,
        renamedPackage,
        renamedProperty,
        removedProperty,
        forbiddenPropertyValue,
        transformAttribute,
        renamedAttribute,
        removedAttribute,
        formerlyAsync,
        renamedEvent,
        removedEvent,
        fixStyleProps,
        fixEventTypes,
        fixKey,
        warn,
        loaded: true,
        config,
    };
})();


/***/ }),
/* 2 */
/***/ (() => {

up.Config.prototype.patch = function (patch) {
    let doPatch = patch.bind(this, this);
    doPatch();
    document.addEventListener('up:framework:reset', doPatch);
};


/***/ }),
/* 3 */
/***/ (() => {

up.util.only = function (object, ...keys) {
    up.migrate.deprecated('up.util.only(object, ...keys)', 'up.util.pick(object, keys)');
    return up.util.pick(object, keys);
};
up.util.except = function (object, ...keys) {
    up.migrate.deprecated('up.util.except(object, ...keys)', 'up.util.omit(object, keys)');
    return up.util.omit(object, keys);
};
up.util.parseUrl = function (...args) {
    up.migrate.deprecated('up.util.parseUrl()', 'up.util.parseURL()');
    return up.util.parseURL(...args);
};
up.util.any = function (...args) {
    up.migrate.deprecated('up.util.any()', 'up.util.some()');
    return up.util.some(...args);
};
up.util.all = function (...args) {
    up.migrate.deprecated('up.util.all()', 'up.util.every()');
    return up.util.every(...args);
};
up.util.detect = function (...args) {
    up.migrate.deprecated('up.util.detect()', 'up.util.find()');
    return up.util.find(...args);
};
up.util.select = function (...args) {
    up.migrate.deprecated('up.util.select()', 'up.util.filter()');
    return up.util.filter(...args);
};
up.util.setTimer = function (...args) {
    up.migrate.deprecated('up.util.setTimer()', 'up.util.timer()');
    return up.util.timer(...args);
};
up.util.escapeHtml = function (...args) {
    up.migrate.deprecated('up.util.escapeHtml()', 'up.util.escapeHTML()');
    return up.util.escapeHTML(...args);
};
up.util.selectorForElement = function (...args) {
    up.migrate.deprecated('up.util.selectorForElement()', 'up.fragment.toTarget()');
    return up.fragment.toTarget(...args);
};
up.util.nextFrame = function (...args) {
    up.migrate.deprecated('up.util.nextFrame()', 'up.util.task()');
    return up.util.task(...args);
};
up.util.times = function (count, block) {
    up.migrate.deprecated('up.util.times()', 'a `for` loop');
    for (let i = 0; i < count; i++) {
        block();
    }
};
up.util.assign = function (...args) {
    up.migrate.deprecated('up.util.assign()', 'Object.assign()');
    return Object.assign(...args);
};
up.util.values = function (...args) {
    up.migrate.deprecated('up.util.values()', 'Object.values()');
    return Object.values(...args);
};
up.util.microtask = window.queueMicrotask;
up.migrate.splitAtOr = function (value) {
    let parts = value.split(/\s+or\s+/);
    if (parts.length >= 2) {
        up.migrate.warn(`Separating tokens by \`or\` has been deprecated. Use a comma (\`,\`) instead. Found in "${value}".`);
        return parts;
    }
};


/***/ }),
/* 4 */
/***/ (() => {

class DeprecatedCannotCompile extends up.Error {
}
Object.defineProperty(up, 'CannotCompile', { get: function () {
        up.migrate.warn('The error up.CannotCompile is no longer thrown. Compiler errors now emit an "error" event on window, but no longer crash the render pass.');
        return DeprecatedCannotCompile;
    } });


/***/ }),
/* 5 */
/***/ (() => {

up.browser.loadPage = function (...args) {
    up.migrate.deprecated('up.browser.loadPage()', 'up.network.loadPage()');
    return up.network.loadPage(...args);
};
up.browser.isSupported = function (...args) {
    up.migrate.deprecated('up.browser.isSupported()', 'up.framework.isSupported()');
    return up.framework.isSupported(...args);
};


/***/ }),
/* 6 */
/***/ (() => {

up.element.first = function (...args) {
    up.migrate.deprecated('up.element.first()', 'up.element.get()');
    return up.element.get(...args);
};
up.element.createFromHtml = function (...args) {
    up.migrate.deprecated('up.element.createFromHtml()', 'up.element.createFromHTML()');
    return up.element.createFromHTML(...args);
};
up.element.remove = function (element) {
    up.migrate.deprecated('up.element.remove()', 'Element#remove()');
    return element.remove();
};
up.element.matches = function (element, selector) {
    up.migrate.deprecated('up.element.matches()', 'Element#matches()');
    return element.matches(selector);
};
up.element.closest = function (element, selector) {
    up.migrate.deprecated('up.element.closest()', 'Element#closest()');
    return element.closest(selector);
};
up.element.replace = function (oldElement, newElement) {
    up.migrate.deprecated('up.element.replace()', 'Element#replaceWith()');
    return oldElement.replaceWith(newElement);
};
up.element.all = function (...args) {
    up.migrate.deprecated('up.element.all()', 'Document#querySelectorAll() or Element#querySelectorAll()');
    const selector = args.pop();
    const root = args[0] || document;
    return root.querySelectorAll(selector);
};
up.element.toggleClass = function (element, klass, newPresent) {
    up.migrate.deprecated('up.element.toggleClass()', 'element.classList.toggle()');
    const list = element.classList;
    if (newPresent == null) {
        newPresent = !list.contains(klass);
    }
    if (newPresent) {
        return list.add(klass);
    }
    else {
        return list.remove(klass);
    }
};
up.element.toSelector = function (...args) {
    up.migrate.deprecated('up.element.toSelector()', 'up.fragment.toTarget()');
    return up.fragment.toTarget(...args);
};
up.element.isAttached = function (element) {
    up.migrate.deprecated('up.element.isAttached()', 'document.contains(element)');
    return document.contains(element);
};
up.element.isDetached = function (element) {
    up.migrate.deprecated('up.element.isDetached()', '!document.contains(element)');
    return !up.element.isAttached(element);
};


/***/ }),
/* 7 */
/***/ (() => {

up.migrate.renamedPackage('bus', 'event');
up.event.nobodyPrevents = function (...args) {
    up.migrate.deprecated('up.event.nobodyPrevents(type)', '!up.emit(type).defaultPrevented');
    const event = up.emit(...args);
    return !event.defaultPrevented;
};
up.$on = function (...definitionArgs) {
    up.migrate.warn('up.$on() has been deprecated. Instead use up.on() with a callback that wraps the given native element in a jQuery collection.');
    let callback = definitionArgs.pop();
    callback.upNativeCallback = function (event, element, data) {
        let $element = jQuery(element);
        callback.call($element, event, $element, data);
    };
    return up.on(...definitionArgs, callback.upNativeCallback);
};
up.$off = function (...definitionArgs) {
    up.migrate.deprecated('up.$off()', 'up.off()');
    let $callback = definitionArgs.pop();
    let nativeCallback = $callback.upNativeCallback;
    if (!nativeCallback) {
        up.fail('The callback passed to up.$off() was never registered with up.$on()');
    }
    return up.off(...definitionArgs, nativeCallback);
};


/***/ }),
/* 8 */
/***/ (() => {

const u = up.util;
const e = up.element;
up.migrate.renamedPackage('syntax', 'script');
up.migrate.postCompile = function (elements, compiler) {
    let keepValue;
    if (keepValue = compiler.keep) {
        up.migrate.warn('The { keep: true } option for up.compiler() has been removed. Have the compiler set [up-keep] attribute instead.');
        const value = u.isString(keepValue) ? keepValue : '';
        for (let element of elements) {
            element.setAttribute('up-keep', value);
        }
    }
};
up.migrate.targetMacro = function (queryAttr, fixedResultAttrs, callback) {
    up.macro(`[${queryAttr}]`, function (link) {
        let optionalTarget;
        const resultAttrs = u.copy(fixedResultAttrs);
        if ((optionalTarget = link.getAttribute(queryAttr))) {
            resultAttrs['up-target'] = optionalTarget;
        }
        else {
            resultAttrs['up-follow'] = '';
        }
        e.setMissingAttrs(link, resultAttrs);
        link.removeAttribute(queryAttr);
        callback === null || callback === void 0 ? void 0 : callback();
    });
};
up.$compiler = function (...definitionArgs) {
    up.migrate.warn('up.$compiler() has been deprecated. Instead use up.compiler() with a callback that wraps the given native element in a jQuery collection.');
    let $fn = definitionArgs.pop();
    return up.compiler(...definitionArgs, function (element, ...fnArgs) {
        let $element = jQuery(element);
        return $fn($element, ...fnArgs);
    });
};
up.$macro = function (...definitionArgs) {
    up.migrate.warn('up.$macro() has been deprecated. Instead use up.macro() with a callback that wraps the given native element in a jQuery collection.');
    let $fn = definitionArgs.pop();
    return up.macro(...definitionArgs, function (element, ...fnArgs) {
        let $element = jQuery(element);
        return $fn($element, ...fnArgs);
    });
};
up.migrate.processCompilerPassMeta = function (meta, response) {
    Object.defineProperty(meta, 'response', { get() {
            up.migrate.warn('Accessing meta.response from a compiler has been deprecated without replacement. Avoid fragments that compile differently for the initial page load vs. subsequent fragment updates.');
            return response;
        } });
};


/***/ }),
/* 9 */
/***/ (() => {

up.form.config.patch(function (config) {
    up.migrate.renamedProperty(config, 'fields', 'fieldSelectors');
    up.migrate.renamedProperty(config, 'submitButtons', 'submitButtonSelectors');
    up.migrate.renamedProperty(config, 'validateTargets', 'groupSelectors');
    up.migrate.renamedProperty(config, 'observeDelay', 'watchInputDelay');
});
up.migrate.migratedFormGroupSelectors = function () {
    return up.form.config.groupSelectors.map((originalSelector) => {
        let migratedSelector = originalSelector.replace(/:has\((:origin|&)\)$/, '');
        if (originalSelector !== migratedSelector) {
            up.migrate.warn('Selectors in up.form.config.groupSelectors must not contain ":has(:origin)". The suffix is added automatically where required. Found in "%s".', originalSelector);
        }
        return migratedSelector;
    });
};
up.migrate.renamedAttribute('up-observe', 'up-watch');
up.migrate.renamedAttribute('up-fieldset', 'up-form-group');
up.migrate.renamedAttribute('up-delay', 'up-watch-delay', { scope: '[up-autosubmit]' });
up.migrate.renamedAttribute('up-delay', 'up-watch-delay', { scope: '[up-watch]' });
up.observe = function (...args) {
    up.migrate.deprecated('up.observe()', 'up.watch()');
    if (up.util.isList(args[0]) && args[0].length > 1) {
        let list = args.shift();
        up.migrate.warn('Calling up.observe() with a list of multiple elements is no longer supported by up.watch()');
        let unwatchFns = up.util.map(list, (firstArg) => up.watch(firstArg, ...args));
        return up.util.sequence(unwatchFns);
    }
    return up.watch(...args);
};


/***/ }),
/* 10 */
/***/ (() => {

const u = up.util;
up.migrate.renamedPackage('flow', 'fragment');
up.migrate.renamedPackage('dom', 'fragment');
up.fragment.config.patch(function (config) {
    up.migrate.renamedProperty(config, 'fallbacks', 'mainTargets');
});
up.migrate.handleResponseDocOptions = docOptions => up.migrate.fixKey(docOptions, 'html', 'document');
up.fragment.config.patch(function (config) {
    let matchAroundOriginDeprecated = () => up.migrate.deprecated('up.fragment.config.matchAroundOrigin', 'up.fragment.config.match');
    Object.defineProperty(config, 'matchAroundOrigin', {
        configurable: true,
        get: function () {
            matchAroundOriginDeprecated();
            return this.match === 'closest';
        },
        set: function (value) {
            matchAroundOriginDeprecated();
            this.match = value ? 'region' : 'first';
        }
    });
});
up.replace = function (target, url, options) {
    up.migrate.deprecated('up.replace(target, url)', 'up.navigate(target, { url })');
    return up.navigate(Object.assign(Object.assign({}, options), { target, url }));
};
up.extract = function (target, document, options) {
    up.migrate.deprecated('up.extract(target, document)', 'up.navigate(target, { document })');
    return up.navigate(Object.assign(Object.assign({}, options), { target, document }));
};
up.fragment.first = function (...args) {
    up.migrate.deprecated('up.fragment.first()', 'up.fragment.get()');
    return up.fragment.get(...args);
};
up.first = up.fragment.first;
up.migrate.preprocessRenderOptions = function (options) {
    if (u.isString(options.history) && (options.history !== 'auto')) {
        up.migrate.warn("Passing a URL as { history } option is deprecated. Pass it as { location } instead.");
        options.location = options.history;
        options.history = 'auto';
    }
    for (let prop of ['target', 'origin']) {
        if (u.isJQuery(options[prop])) {
            up.migrate.warn('Passing a jQuery collection as { %s } is deprecated. Pass it as a native element instead.', prop);
            options[prop] = up.element.get(options[prop]);
        }
    }
    if (options.fail === 'auto') {
        up.migrate.warn("The option { fail: 'auto' } is deprecated. Omit the option instead.");
        delete options.fail;
    }
    let solo = u.pluckKey(options, 'solo');
    if (u.isString(solo)) {
        up.migrate.warn("The up.render() option { solo } has been replaced with { abort } and { abort } no longer accepts a URL pattern. Check if you can use { abort: 'target'} or use up.network.abort(pattern) instead.");
        options.abort = (options) => up.network.abort(solo, options);
    }
    else if (u.isFunction(solo)) {
        up.migrate.warn("The up.render() option { solo } has been replaced with { abort } and { abort } no longer accepts a Function(up.Request): boolean. Check if you can use { abort: 'target'} or use up.network.abort(fn) instead.");
        options.abort = (options) => { up.network.abort(solo, options); };
    }
    else if (solo === true) {
        up.migrate.deprecated('Option { solo: true }', "{ abort: 'all' }");
        options.abort = 'all';
    }
    else if (solo === false) {
        up.migrate.deprecated('Option { solo: false }', "{ abort: false }");
        up.migrate.warn('Unpoly 3+ only aborts requests targeting the same fragment. Setting { solo: false } may no longer be necessary.');
        options.abort = false;
    }
    up.migrate.fixKey(options, 'failOnFinished', 'onFailFinished');
    up.migrate.fixKey(options, 'badResponseTime', 'lateDelay');
    if (u.isString(options.reveal)) {
        up.migrate.deprecated(`Option { reveal: '${options.reveal}' }`, `{ scroll: '${options.reveal}' }`);
        options.scroll = options.reveal;
    }
    else if (options.reveal === true) {
        up.migrate.deprecated('Option { reveal: true }', "{ scroll: 'target' }");
        options.scroll = 'target';
    }
    else if (options.reveal === false) {
        up.migrate.deprecated('Option { reveal: false }', "{ scroll: false }");
        options.scroll = false;
    }
    if (options.resetScroll === true) {
        up.migrate.deprecated('Option { resetScroll: true }', "{ scroll: 'reset' }");
        options.scroll = 'reset';
    }
    if (options.resetScroll === false) {
        up.migrate.deprecated('Option { resetScroll: false }', "{ scroll: false }");
        options.scroll = false;
    }
    if (options.restoreScroll === true) {
        up.migrate.deprecated('Option { restoreScroll: true }', "{ scroll: 'restore' }");
        options.scroll = 'restore';
    }
    if (options.restoreScroll === false) {
        up.migrate.deprecated('Option { restoreScroll: false }', "{ scroll: false }");
        options.scroll = false;
    }
};
up.migrate.postprocessReloadOptions = function (options) {
    var _a;
    let lastModified = (_a = options.headers) === null || _a === void 0 ? void 0 : _a['If-Modified-Since'];
    let legacyHeader;
    if (lastModified) {
        legacyHeader = Math.floor(new Date(lastModified) * 0.001).toString();
    }
    else {
        legacyHeader = '0';
    }
    options.headers[up.protocol.headerize('reloadFromTime')] = legacyHeader;
};
up.migrate.resolveOrigin = function (target, { origin } = {}) {
    let pattern = /"[^"]*"|'[^']*'|&|:origin\b/g;
    return target.replace(pattern, function (variant) {
        if (variant === ':origin' || variant === '&') {
            if (variant === '&') {
                up.migrate.deprecated("Origin shorthand '&'", ':origin');
            }
            if (origin) {
                return up.fragment.toTarget(origin);
            }
            else {
                up.fail('Missing { origin } element to resolve "%s" reference (found in %s)', variant, target);
            }
        }
        else {
            return variant;
        }
    });
};
up.migrate.removedEvent('up:fragment:kept', 'up:fragment:keep');
up.fragment.config.patch(function () {
    this.runScriptsValue = this.runScripts;
    this.runScriptsSet = false;
    Object.defineProperty(this, 'runScripts', {
        configurable: true,
        get() {
            return this.runScriptsValue;
        },
        set(value) {
            this.runScriptsValue = value;
            this.runScriptsSet = true;
        }
    });
});
up.on('up:framework:boot', function () {
    if (!up.fragment.config.runScriptsSet) {
        up.migrate.warn('Scripts within fragments are now executed. Configure up.fragment.config.runScripts to remove this warning.');
    }
});
up.compiler('[up-keep]', function (element) {
    let selector = up.element.booleanOrStringAttr(element, 'up-keep');
    if (u.isString(selector)) {
        up.migrate.warn('The [up-keep] attribute no longer supports a selector value. Elements will be matched by their derived target. You may prevent keeping with [up-on-keep="if(condition) event.preventDefault()"]. ');
        up.element.setMissingAttr(element, 'up-on-keep', `if (!newFragment.matches(${JSON.stringify(selector)})) event.preventDefault()`);
        element.setAttribute('up-keep', '');
    }
});


/***/ }),
/* 11 */
/***/ (() => {

up.migrate.renamedEvent('up:app:booted', 'up:framework:booted');


/***/ }),
/* 12 */
/***/ (() => {

up.history.config.patch(function (config) {
    up.migrate.renamedProperty(config, 'popTargets', 'restoreTargets');
});
up.history.url = function () {
    up.migrate.deprecated('up.history.url()', 'up.history.location');
    return up.history.location;
};
up.migrate.renamedEvent('up:history:push', 'up:location:changed');
up.migrate.renamedEvent('up:history:pushed', 'up:location:changed');
up.migrate.renamedEvent('up:history:restore', 'up:location:changed');
up.migrate.renamedEvent('up:history:restored', 'up:location:changed');
up.migrate.renamedEvent('up:history:replaced', 'up:location:changed');
up.migrate.removedEvent('up:fragment:kept', 'up:fragment:keep');
up.history.config.patch(function () {
    this.updateMetaTagsValue = this.updateMetaTags;
    this.updateMetaTagsSet = false;
    Object.defineProperty(this, 'updateMetaTags', {
        configurable: true,
        get() {
            return this.updateMetaTagsValue;
        },
        set(value) {
            this.updateMetaTagsValue = value;
            this.updateMetaTagsSet = true;
        }
    });
});
up.on('up:framework:boot', function () {
    if (!up.history.config.updateMetaTagsSet) {
        up.migrate.warn('Meta tags in the <head> are now updated automatically. Configure up.history.config.updateMetaTags to remove this warning.');
    }
});
up.migrate.warnOfHungryMetaTags = function (metaTags) {
    let fullHungrySelector = up.radio.config.selector('hungrySelectors');
    let hungryMetaTags = up.util.filter(metaTags, (meta) => meta.matches(fullHungrySelector));
    if (hungryMetaTags.length) {
        up.migrate.warn('Meta tags in the <head> are now updated automatically. Remove the [up-hungry] attribute from %o.', hungryMetaTags);
    }
};


/***/ }),
/* 13 */
/***/ (() => {

up.migrate.renamedPackage('navigation', 'status');
up.migrate.renamedPackage('feedback', 'status');
up.status.config.patch(function (config) {
    up.migrate.renamedProperty(config, 'navs', 'navSelectors');
});


/***/ }),
/* 14 */
/***/ (() => {

const followSelectorFn = up.link.config.selectorFn('followSelectors');
const preloadSelectorFn = up.link.config.selectorFn('preloadSelectors');
up.migrate.renamedAttribute('up-flavor', 'up-mode', { scope: followSelectorFn });
up.migrate.renamedAttribute('up-closable', 'up-dismissable', { scope: followSelectorFn });
up.migrate.removedAttribute('up-width', { scope: followSelectorFn, replacement: '[up-size] or [up-class]' });
up.migrate.removedAttribute('up-height', { scope: followSelectorFn, replacement: '[up-size] or [up-class]' });
up.migrate.renamedAttribute('up-history-visible', 'up-history', { scope: followSelectorFn });
up.migrate.renamedAttribute('up-clear-cache', 'up-expire-cache', { scope: followSelectorFn });
up.migrate.renamedAttribute('up-bad-response-time', 'up-late-delay');
up.migrate.transformAttribute('up-solo', function (link, solo) {
    switch (solo) {
        case '':
            up.migrate.warn('Attribute [up-solo] has been replaced with [up-abort="all"]');
            link.setAttribute('up-abort', 'all');
            break;
        case 'true':
            up.migrate.warn('Attribute [up-solo="true"] has been replaced with [up-abort="all"]');
            link.setAttribute('up-abort', 'all');
            break;
        case 'false':
            up.migrate.warn('Attribute [up-solo="false"] has been replaced with [up-abort="false"]');
            up.migrate.warn('Unpoly 3+ only aborts requests targeting the same fragment. Setting [up-solo="false"] may no longer be necessary.');
            link.setAttribute('up-abort', 'false');
            break;
        default:
            up.migrate.warn('Attribute [up-solo] has been renamed to [up-abort] and [up-abort] no longer accepts a URL pattern. Check if you can use [up-abort="target"] instead.');
            link.setAttribute('up-abort', 'target');
    }
});
up.migrate.transformAttribute('up-reveal', function (link, reveal) {
    switch (reveal) {
        case '':
            up.migrate.warn('Attribute [up-reveal] has been replaced with [up-scroll="target"]');
            link.setAttribute('up-scroll', 'target');
            break;
        case 'true':
            up.migrate.warn('Attribute [up-reveal="true"] has been replaced with [up-scroll="target"]');
            link.setAttribute('up-scroll', 'target');
            break;
        case 'false':
            up.migrate.warn('Attribute [up-reveal="false"] has been replaced with [up-scroll="false"]');
            link.setAttribute('up-scroll', 'false');
            break;
        default:
            up.migrate.warn('Attribute [up-reveal="%s"] has been replaced with [up-scroll="%s"]', reveal);
    }
});
up.migrate.transformAttribute('up-reset-scroll', function (link, resetScroll) {
    switch (resetScroll) {
        case '':
            up.migrate.warn('Attribute [up-reset-scroll] has been replaced with [up-scroll="reset"]');
            link.setAttribute('up-scroll', 'reset');
            break;
        case 'true':
            up.migrate.warn('Attribute [up-reset-scroll="true"] has been replaced with [up-scroll="reset"]');
            link.setAttribute('up-scroll', 'reset');
            break;
        case 'false':
            up.migrate.warn('Attribute [up-reset-scroll="false"] has been replaced with [up-scroll="false"]');
            link.setAttribute('up-scroll', 'false');
            break;
    }
});
up.migrate.transformAttribute('up-restore-scroll', function (link, restoreScroll) {
    switch (restoreScroll) {
        case '':
            up.migrate.warn('Attribute [up-restore-scroll] has been replaced with [up-scroll="restore"]');
            link.setAttribute('up-scroll', 'restore');
            break;
        case 'true':
            up.migrate.warn('Attribute [up-restore-scroll="true"] has been replaced with [up-scroll="restore"]');
            link.setAttribute('up-scroll', 'restore');
            break;
        case 'false':
            up.migrate.warn('Attribute [up-restore-scroll="false"] has been replaced with [up-scroll="false"]');
            link.setAttribute('up-scroll', 'false');
            break;
    }
});
up.migrate.targetMacro('up-dash', { 'up-preload': '', 'up-instant': '' }, () => up.migrate.deprecated('[up-dash]', 'up.link.config.instantSelectors and up.link.config.preloadSelectors'));
up.migrate.renamedAttribute('up-delay', 'up-preload-delay', { scope: preloadSelectorFn });
let preloadEnabledRef;
up.link.config.patch(function (config) {
    config.preloadEnabled = true;
    preloadEnabledRef = up.migrate.removedProperty(config, 'preloadEnabled', 'The configuration up.link.config.preloadEnabled has been removed. To disable preloading, prevent up:link:preload instead.');
});
up.on('up:link:preload', function (event) {
    if (!preloadEnabledRef[0]) {
        event.preventDefault();
    }
});
const LEGACY_UP_HREF_FOLLOW_SELECTOR = '[up-href]:not([up-follow], [up-poll], [up-defer], [up-expand])';
up.link.config.patch(function (config) {
    config.clickableSelectors.push(LEGACY_UP_HREF_FOLLOW_SELECTOR);
    config.followSelectors.push(LEGACY_UP_HREF_FOLLOW_SELECTOR);
});
up.compiler(LEGACY_UP_HREF_FOLLOW_SELECTOR, function (element) {
    up.migrate.warn('Following links with only [up-href] has been deprecated. You must now also set an [up-follow] on the same link (found in %o).', element);
});
const LEGACY_UP_INSTANT_FOLLOW_INTENT_SELECTOR = `[up-instant]:is(a[href], ${LEGACY_UP_HREF_FOLLOW_SELECTOR})`;
up.link.config.patch(function (config) {
    config.followSelectors.push(LEGACY_UP_INSTANT_FOLLOW_INTENT_SELECTOR);
});
up.compiler(LEGACY_UP_HREF_FOLLOW_SELECTOR, function (element) {
    up.migrate.warn('Following links with only [up-instant] has been deprecated. You must now also set an [up-follow] on the same link (found in %o).', element);
});


/***/ }),
/* 15 */
/***/ (() => {

up.migrate.handleLayerOptions = function (options) {
    up.migrate.fixKey(options, 'flavor', 'mode');
    up.migrate.fixKey(options, 'closable', 'dismissable');
    up.migrate.fixKey(options, 'closeLabel', 'dismissLabel');
    up.migrate.fixKey(options, 'dismissAriaLabel', 'dismissARIALabel');
    for (let dimensionKey of ['width', 'maxWidth', 'height']) {
        if (options[dimensionKey]) {
            up.migrate.warn(`Layer option { ${dimensionKey} } has been removed. Use { size } or { class } instead.`);
        }
    }
    if (options.sticky) {
        up.migrate.warn('Layer option { sticky } has been removed. Give links an [up-peel=false] attribute to prevent layer dismissal on click.');
    }
    if (options.template) {
        up.migrate.warn('Layer option { template } has been removed. Use { class } or modify the layer HTML on up:layer:open.');
    }
    if (options.layer === 'page') {
        up.migrate.warn("Option { layer: 'page' } has been renamed to { layer: 'root' }.");
        options.layer = 'root';
    }
    if ((options.layer === 'modal') || (options.layer === 'popup')) {
        up.migrate.warn(`Option { layer: '${options.layer}' } has been removed. Did you mean { layer: 'overlay' }?`);
        options.layer = 'overlay';
    }
    if (up.util.isMissing(options.layer) && up.util.isGiven(options.mode)) {
        up.migrate.warn('Opening a layer with only a { mode } option is deprecated. Pass { layer: "new", mode } instead.');
        options.layer = 'new';
    }
};
up.migrate.handleTetherOptions = function (options) {
    const [position, align] = options.position.split('-');
    if (align) {
        up.migrate.warn('The position value %o is deprecated. Use %o instead.', options.position, { position, align });
        options.position = position;
        options.align = align;
    }
};
up.migrate.registerLayerCloser = layer => layer.registerClickCloser('up-close', (value, closeOptions) => {
    up.migrate.deprecated('[up-close]', '[up-dismiss]');
    layer.dismiss(value, closeOptions);
});
up.migrate.handleLayerConfig = config => up.migrate.fixKey(config, 'historyVisible', 'history');
Object.defineProperty(up.Layer.prototype, 'historyVisible', { get: function () {
        up.migrate.deprecated('up.Layer#historyVisible', 'up.Layer#history');
        return this.history;
    } });


/***/ }),
/* 16 */
/***/ (() => {

const FLAVORS_ERROR = new Error('up.modal.flavors has been removed without direct replacement. You may give new layers a { class } or modify layer elements on up:layer:open.');
up.modal = {
    visit(url, options = {}) {
        up.migrate.deprecated('up.modal.visit(url)', 'up.layer.open({ url, mode: "modal" })');
        return up.layer.open(Object.assign(Object.assign({}, options), { url, mode: 'modal' }));
    },
    follow(link, options = {}) {
        up.migrate.deprecated('up.modal.follow(link)', 'up.follow(link, { layer: "modal" })');
        return up.follow(link, Object.assign(Object.assign({}, options), { layer: 'modal' }));
    },
    extract(target, html, options = {}) {
        up.migrate.deprecated('up.modal.extract(target, document)', 'up.layer.open({ document, mode: "modal" })');
        return up.layer.open(Object.assign(Object.assign({}, options), { target, html, layer: 'modal' }));
    },
    close(options = {}) {
        up.migrate.deprecated('up.modal.close()', 'up.layer.dismiss()');
        up.layer.dismiss(null, options);
        return up.migrate.formerlyAsync('up.layer.dismiss()');
    },
    url() {
        up.migrate.deprecated('up.modal.url()', 'up.layer.location');
        return up.layer.location;
    },
    coveredUrl() {
        var _a;
        up.migrate.deprecated('up.modal.coveredUrl()', 'up.layer.parent.location');
        return (_a = up.layer.parent) === null || _a === void 0 ? void 0 : _a.location;
    },
    get config() {
        up.migrate.deprecated('up.modal.config', 'up.layer.config.modal');
        return up.layer.config.modal;
    },
    contains(element) {
        up.migrate.deprecated('up.modal.contains()', 'up.layer.contains()');
        return up.layer.contains(element);
    },
    isOpen() {
        up.migrate.deprecated('up.modal.isOpen()', 'up.layer.isOverlay()');
        return up.layer.isOverlay();
    },
    get flavors() {
        throw FLAVORS_ERROR;
    },
    flavor() {
        throw FLAVORS_ERROR;
    }
};
up.migrate.renamedEvent('up:modal:open', 'up:layer:open');
up.migrate.renamedEvent('up:modal:opened', 'up:layer:opened');
up.migrate.renamedEvent('up:modal:close', 'up:layer:dismiss');
up.migrate.renamedEvent('up:modal:closed', 'up:layer:dismissed');
up.migrate.targetMacro('up-modal', { 'up-layer': 'new modal' }, () => up.migrate.deprecated('[up-modal]', '[up-layer="new modal"]'));
up.migrate.targetMacro('up-drawer', { 'up-layer': 'new drawer' }, () => up.migrate.deprecated('[up-drawer]', '[up-layer="new drawer"]'));


/***/ }),
/* 17 */
/***/ (() => {

up.popup = {
    attach(origin, options = {}) {
        origin = up.fragment.get(origin);
        up.migrate.deprecated('up.popup.attach(origin)', "up.layer.open({ origin, layer: 'popup' })");
        return up.layer.open(Object.assign(Object.assign({}, options), { origin, layer: 'popup' }));
    },
    close(options = {}) {
        up.migrate.deprecated('up.popup.close()', 'up.layer.dismiss()');
        up.layer.dismiss(null, options);
        return up.migrate.formerlyAsync('up.layer.dismiss()');
    },
    url() {
        up.migrate.deprecated('up.popup.url()', 'up.layer.location');
        return up.layer.location;
    },
    coveredUrl() {
        var _a;
        up.migrate.deprecated('up.popup.coveredUrl()', 'up.layer.parent.location');
        return (_a = up.layer.parent) === null || _a === void 0 ? void 0 : _a.location;
    },
    get config() {
        up.migrate.deprecated('up.popup.config', 'up.layer.config.popup');
        return up.layer.config.popup;
    },
    contains(element) {
        up.migrate.deprecated('up.popup.contains()', 'up.layer.contains()');
        return up.layer.contains(element);
    },
    isOpen() {
        up.migrate.deprecated('up.popup.isOpen()', 'up.layer.isOverlay()');
        return up.layer.isOverlay();
    },
    sync() {
        up.migrate.deprecated('up.popup.sync()', 'up.layer.sync()');
        return up.layer.sync();
    }
};
up.migrate.renamedEvent('up:popup:open', 'up:layer:open');
up.migrate.renamedEvent('up:popup:opened', 'up:layer:opened');
up.migrate.renamedEvent('up:popup:close', 'up:layer:dismiss');
up.migrate.renamedEvent('up:popup:closed', 'up:layer:dismissed');
up.migrate.targetMacro('up-popup', { 'up-layer': 'new popup' }, () => up.migrate.deprecated('[up-popup]', '[up-layer="new popup"]'));


/***/ }),
/* 18 */
/***/ (() => {

up.macro('[up-tooltip]', function (opener) {
    up.migrate.warn('[up-tooltip] has been deprecated. A [title] was set instead.');
    up.element.setMissingAttr(opener, 'title', opener.getAttribute('up-tooltip'));
});


/***/ }),
/* 19 */
/***/ (() => {

up.migrate.clearCacheFromXHR = function (xhr) {
    let value = xhr.getResponseHeader('X-Up-Clear-Cache');
    if (value) {
        up.migrate.deprecated('X-Up-Clear-Cache', 'X-Up-Expire-Cache');
        if (value === 'false') {
            return false;
        }
        else {
            return value;
        }
    }
};
up.migrate.titleFromXHR = function (xhr) {
    let value = xhr.getResponseHeader('X-Up-Title');
    if (value) {
        if (value === 'false') {
            return false;
        }
        else if (value[0] !== '"' && value[0] !== "'") {
            up.migrate.warn('X-Up-Title must now be a JSON-encoded string');
            return value;
        }
    }
};


/***/ }),
/* 20 */
/***/ (() => {

const u = up.util;
up.migrate.renamedPackage('proxy', 'network');
up.migrate.renamedEvent('up:proxy:load', 'up:request:load');
up.migrate.renamedEvent('up:proxy:received', 'up:request:loaded');
up.migrate.renamedEvent('up:proxy:loaded', 'up:request:loaded');
up.migrate.renamedEvent('up:proxy:fatal', 'up:request:offline');
up.migrate.renamedEvent('up:request:fatal', 'up:request:offline');
up.migrate.renamedEvent('up:proxy:aborted', 'up:request:aborted');
up.migrate.renamedEvent('up:proxy:slow', 'up:network:late');
up.migrate.renamedEvent('up:proxy:recover', 'up:network:recover');
up.migrate.renamedEvent('up:request:late', 'up:network:late');
up.migrate.renamedEvent('up:request:recover', 'up:network:recover');
up.network.config.patch(function (config) {
    const preloadDelayMoved = () => up.migrate.deprecated('up.proxy.config.preloadDelay', 'up.link.config.preloadDelay');
    Object.defineProperty(config, 'preloadDelay', {
        configurable: true,
        get() {
            preloadDelayMoved();
            return up.link.config.preloadDelay;
        },
        set(value) {
            preloadDelayMoved();
            up.link.config.preloadDelay = value;
        }
    });
});
up.network.config.patch(function (config) {
    up.migrate.renamedProperty(config, 'maxRequests', 'concurrency');
    up.migrate.renamedProperty(config, 'slowDelay', 'lateDelay');
    up.migrate.renamedProperty(config, 'cacheExpiry', 'cacheExpireAge', 'The configuration up.network.config.cacheExpiry has been renamed to up.network.config.cacheExpireAge. Note that Unpoly 3+ automatically reloads cached content after rendering to ensure users always see fresh data ("cache revalidation"). Setting a custom expiry may no longer be necessary.');
    up.migrate.renamedProperty(config, 'clearCache', 'expireCache');
    up.migrate.forbiddenPropertyValue(config, 'cacheSize', 0, 'Disabling the cache with up.network.config.cacheSize = 0 is no longer supported. To disable automatic caching during navigation, set up.fragment.config.navigateOptions.cache = false instead.');
    up.network.config.requestMetaKeys = [];
    up.migrate.removedProperty(config, 'requestMetaKeys', 'The configuration up.network.config.requestMetaKeys has been removed. Servers that optimize responses based on request headers should instead set a Vary response header.');
});
up.migrate.handleRequestOptions = function (options) {
    up.migrate.fixKey(options, 'clearCache', 'expireCache');
    if (options.solo) {
        up.migrate.warn('The option up.request({ solo }) has been removed. Use up.network.abort() or up.fragment.abort() instead.');
    }
};
up.ajax = function (...args) {
    up.migrate.deprecated('up.ajax()', 'up.request()');
    const pickResponseText = response => response.text;
    return up.request(...args).then(pickResponseText);
};
up.network.clear = function () {
    up.migrate.deprecated('up.proxy.clear()', 'up.cache.expire()');
    up.cache.expire();
};
up.Request.Cache.prototype.clear = function (...args) {
    up.migrate.deprecated('up.cache.clear()', 'up.cache.expire()');
    this.expire(...args);
};
up.network.preload = function (...args) {
    up.migrate.deprecated('up.proxy.preload(link)', 'up.link.preload(link)');
    return up.link.preload(...args);
};
up.migrate.preprocessAbortArgs = function (args) {
    if (args.length === 2 && u.isString(args[1])) {
        up.migrate.warn('up.network.abort() no longer takes a reason as a second argument. Pass it as { reason } option instead.');
        args[1] = { reason: args[1] };
    }
};
up.network.isIdle = function () {
    up.migrate.deprecated('up.network.isIdle()', '!up.network.isBusy()');
    return !up.network.isBusy();
};
up.Request.prototype.navigate = function () {
    up.migrate.deprecated('up.Request#navigate()', 'up.Request#loadPage()');
    this.loadPage();
};
up.migrate.renamedProperty(up.Request.prototype, 'preload', 'background');
up.migrate.renamedProperty(up.Request.prototype, 'badResponseTime', 'lateDelay');
up.Response.prototype.isSuccess = function () {
    up.migrate.deprecated('up.Response#isSuccess()', 'up.Response#ok');
    return this.ok;
};
up.Response.prototype.getHeader = function (name) {
    up.migrate.deprecated('up.Response#getHeader()', 'up.Response#header()');
    return this.header(name);
};
up.Response.prototype.isError = function () {
    up.migrate.deprecated('up.Response#isError()', '!up.Response#ok');
    return !this.ok;
};
function mayHaveCustomIndicator() {
    const listeners = up.EventListener.allNonDefault(document);
    return u.find(listeners, listener => listener.eventType === 'up:network:late');
}
const progressBarDefault = up.network.config.progressBar;
up.network.config.patch(function (config) {
    config.progressBar = function () {
        if (mayHaveCustomIndicator()) {
            up.migrate.warn('Disabled the default progress bar as may have built a custom loading indicator with your up:network:late listener. Please set up.network.config.progressBar to true or false.');
            return false;
        }
        else {
            return progressBarDefault;
        }
    };
});
up.network.shouldReduceRequests = function () {
    up.migrate('up.network.shouldReduceRequests() has been removed without replacement');
    return false;
};
up.network.config.patch(function (config) {
    up.migrate.removedProperty(config, 'badRTT');
    up.migrate.removedProperty(config, 'badDownlink');
    up.migrate.renamedProperty(config, 'badResponseTime', 'lateDelay');
});


/***/ }),
/* 21 */
/***/ (() => {

const e = up.element;
up.radio.config.patch(function (config) {
    up.migrate.renamedProperty(config, 'hungry', 'hungrySelectors');
});
up.radio.config.pollEnabled = true;
let pollEnabledRef;
up.radio.config.patch(function (config) {
    pollEnabledRef = up.migrate.removedProperty(config, 'pollEnabled', 'The configuration up.radio.config.pollEnabled has been removed. To disable polling, prevent up:fragment:poll instead.');
});
up.on('up:fragment:poll', function (event) {
    if (!pollEnabledRef[0]) {
        event.preventDefault();
    }
});
up.compiler('[up-hungry][up-if-history]', function (element) {
    let ifHistory = e.booleanAttr(element, 'up-if-history');
    if (!ifHistory)
        return;
    element.addEventListener('up:fragment:hungry', function (event) {
        if (!event.renderOptions.history) {
            event.preventDefault();
        }
    });
});


/***/ }),
/* 22 */
/***/ (() => {

up.migrate.renamedPackage('layout', 'viewport');
up.viewport.config.patch(function (config) {
    up.migrate.renamedProperty(config, 'viewports', 'viewportSelectors');
    up.migrate.renamedProperty(config, 'fixedTop', 'fixedTopSelectors');
    up.migrate.renamedProperty(config, 'fixedBottom', 'fixedBottomSelectors');
    up.migrate.renamedProperty(config, 'anchoredRight', 'anchoredRightSelectors');
    up.migrate.renamedProperty(config, 'snap', 'revealSnap');
    up.migrate.removedProperty(config, 'scrollSpeed');
});
up.viewport.closest = function (...args) {
    up.migrate.deprecated('up.viewport.closest()', 'up.viewport.get()');
    return up.viewport.get(...args);
};
up.viewport.scroll = function (viewport, top, options = {}) {
    up.migrate.deprecated('up.scroll()', 'Element#scrollTo()');
    viewport = up.fragment.get(viewport, options);
    viewport.scrollTo(Object.assign(Object.assign({}, options), { top }));
    return up.migrate.formerlyAsync('up.scroll()');
};
up.scroll = up.viewport.scroll;


/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
up.framework.startExtension();
__webpack_require__(1);
__webpack_require__(2);
__webpack_require__(3);
__webpack_require__(4);
__webpack_require__(5);
__webpack_require__(6);
__webpack_require__(7);
__webpack_require__(8);
__webpack_require__(9);
__webpack_require__(10);
__webpack_require__(11);
__webpack_require__(12);
__webpack_require__(13);
__webpack_require__(14);
__webpack_require__(15);
__webpack_require__(16);
__webpack_require__(17);
__webpack_require__(18);
__webpack_require__(19);
__webpack_require__(20);
__webpack_require__(21);
__webpack_require__(22);
up.framework.stopExtension();

})();

/******/ })()
;