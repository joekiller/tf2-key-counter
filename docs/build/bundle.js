
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.31.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\App.svelte generated by Svelte v3.31.0 */

    const file = "src\\App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let h1;
    	let t1;
    	let p0;
    	let t2;
    	let t3;
    	let t4_value = (/*key*/ ctx[1] === 1 ? "" : "s") + "";
    	let t4;
    	let t5;
    	let t6;
    	let t7;
    	let t8;
    	let textarea;
    	let t9;
    	let img;
    	let img_src_value;
    	let t10;
    	let p1;
    	let t11;
    	let a0;
    	let t13;
    	let t14;
    	let footer;
    	let h2;
    	let t16;
    	let div;
    	let a1;
    	let t18;
    	let a2;
    	let t20;
    	let a3;
    	let t22;
    	let a4;
    	let t24;
    	let a5;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "TF2 Key and Refined Counter";
    			t1 = space();
    			p0 = element("p");
    			t2 = text(/*key*/ ctx[1]);
    			t3 = text(" Key");
    			t4 = text(t4_value);
    			t5 = text(", ");
    			t6 = text(/*ref*/ ctx[2]);
    			t7 = text(" Refined");
    			t8 = space();
    			textarea = element("textarea");
    			t9 = space();
    			img = element("img");
    			t10 = space();
    			p1 = element("p");
    			t11 = text("Paste the text of a trade from ");
    			a0 = element("a");
    			a0.textContent = "steam inventory history";
    			t13 = text(" above to count the total Mann Co. Supply Crate Key and Refined Metal items from Team Fortress 2 were included in the trade.");
    			t14 = space();
    			footer = element("footer");
    			h2 = element("h2");
    			h2.textContent = "Helpful Links";
    			t16 = space();
    			div = element("div");
    			a1 = element("a");
    			a1.textContent = "TF2 Key Price History";
    			t18 = space();
    			a2 = element("a");
    			a2.textContent = "TF2 Currency Converter";
    			t20 = space();
    			a3 = element("a");
    			a3.textContent = "site src and licenses";
    			t22 = space();
    			a4 = element("a");
    			a4.textContent = "TF2 Spell Counts";
    			t24 = space();
    			a5 = element("a");
    			a5.textContent = "TF2 Post Life Spell Counts";
    			attr_dev(h1, "class", "svelte-i1ia4g");
    			add_location(h1, file, 20, 1, 721);
    			add_location(p0, file, 21, 1, 760);
    			attr_dev(textarea, "placeholder", "Mann Co. Supply Crate Key");
    			attr_dev(textarea, "class", "svelte-i1ia4g");
    			add_location(textarea, file, 22, 1, 816);
    			if (img.src !== (img_src_value = /*src*/ ctx[3])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Steam Inventory History Screenshot with an Unusual and TF2 Key and Metal Text");
    			add_location(img, file, 23, 1, 891);
    			attr_dev(a0, "href", "https://steamcommunity.com/id/joekiller/inventoryhistory/");
    			add_location(a0, file, 24, 35, 1027);
    			add_location(p1, file, 24, 1, 993);
    			attr_dev(main, "class", "svelte-i1ia4g");
    			add_location(main, file, 19, 0, 712);
    			add_location(h2, file, 27, 1, 1272);
    			attr_dev(a1, "href", "https://manic.tf/keyprice/");
    			add_location(a1, file, 29, 2, 1320);
    			attr_dev(a2, "href", "https://calculator.tf/");
    			add_location(a2, file, 30, 2, 1386);
    			attr_dev(a3, "href", "https://github.com/joekiller/tf2-key-counter");
    			add_location(a3, file, 31, 2, 1449);
    			attr_dev(a4, "href", "all/render/index.html");
    			add_location(a4, file, 32, 2, 1533);
    			attr_dev(a5, "href", "allpostlife/render/index.html");
    			add_location(a5, file, 33, 2, 1589);
    			attr_dev(div, "class", "links");
    			add_location(div, file, 28, 1, 1297);
    			add_location(footer, file, 26, 0, 1261);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			append_dev(main, p0);
    			append_dev(p0, t2);
    			append_dev(p0, t3);
    			append_dev(p0, t4);
    			append_dev(p0, t5);
    			append_dev(p0, t6);
    			append_dev(p0, t7);
    			append_dev(main, t8);
    			append_dev(main, textarea);
    			set_input_value(textarea, /*value*/ ctx[0]);
    			append_dev(main, t9);
    			append_dev(main, img);
    			append_dev(main, t10);
    			append_dev(main, p1);
    			append_dev(p1, t11);
    			append_dev(p1, a0);
    			append_dev(p1, t13);
    			insert_dev(target, t14, anchor);
    			insert_dev(target, footer, anchor);
    			append_dev(footer, h2);
    			append_dev(footer, t16);
    			append_dev(footer, div);
    			append_dev(div, a1);
    			append_dev(div, t18);
    			append_dev(div, a2);
    			append_dev(div, t20);
    			append_dev(div, a3);
    			append_dev(div, t22);
    			append_dev(div, a4);
    			append_dev(div, t24);
    			append_dev(div, a5);

    			if (!mounted) {
    				dispose = listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[4]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*key*/ 2) set_data_dev(t2, /*key*/ ctx[1]);
    			if (dirty & /*key*/ 2 && t4_value !== (t4_value = (/*key*/ ctx[1] === 1 ? "" : "s") + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*ref*/ 4) set_data_dev(t6, /*ref*/ ctx[2]);

    			if (dirty & /*value*/ 1) {
    				set_input_value(textarea, /*value*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (detaching) detach_dev(t14);
    			if (detaching) detach_dev(footer);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const KEY = /Mann Co\. Supply Crate Key/g;
    const REF = /Refined Metal/g;
    const REC = /Reclaimed Metal/g;
    const SCRAP = /Scrap Metal/g;

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let src = "example.PNG";
    	let value = "";

    	const matches = (v, m) => {
    		const result = v.match(m);
    		return result ? result.length : 0;
    	};

    	const calcRef = (scrap = 0, reclaimed = 0) => {
    		const sr = scrap === 0
    		? 0
    		: Math.trunc(scrap / 9) + scrap % 9 * 0.11;

    		const rr = reclaimed === 0
    		? 0
    		: Math.trunc(reclaimed / 3) + reclaimed % 3 * 0.33;

    		return rr + sr;
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function textarea_input_handler() {
    		value = this.value;
    		$$invalidate(0, value);
    	}

    	$$self.$capture_state = () => ({
    		KEY,
    		REF,
    		REC,
    		SCRAP,
    		src,
    		value,
    		matches,
    		calcRef,
    		key,
    		ref
    	});

    	$$self.$inject_state = $$props => {
    		if ("src" in $$props) $$invalidate(3, src = $$props.src);
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    		if ("key" in $$props) $$invalidate(1, key = $$props.key);
    		if ("ref" in $$props) $$invalidate(2, ref = $$props.ref);
    	};

    	let key;
    	let ref;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*value*/ 1) {
    			 $$invalidate(1, key = matches(value, KEY));
    		}

    		if ($$self.$$.dirty & /*value*/ 1) {
    			 $$invalidate(2, ref = matches(value, REF) + calcRef(matches(value, SCRAP), matches(value, REC)));
    		}
    	};

    	return [value, key, ref, src, textarea_input_handler];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({ target: document.body });

    return app;

}());
