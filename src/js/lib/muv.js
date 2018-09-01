/*
  @flow
  `Model, Update, View` wiring
*/
import { patch, h } from "./vdom";
import app from "../app";


type Thunk = () => void;

type Next =
    Thunk | Promise<*> | Array<Thunk | Promise<*>> | void;

export type Action<msg> =
    (tag: msg, data?: Object) => Thunk;

export type Config<a, msg> = {|
    +initialModel: a,
    +initialAction?: Next,
    +update: { +[tag: msg]: (a, data: Object) => Next },
    +view: (id: string, props: *, model: a) => void
|}


export function component<a, msg>(
    getConfigFromProps: (Action<msg>, props: *) => Config<a, msg>
) {
    // Will be called by parent markup e.g. `counter("counter-0", { start: 0 })`
    return (id: string, props: *) => {
        // Calls MUV init() each render, passing in a callback that receives `action`
        return init(id, props, action => {
            // Run passed in `getConfigFromProps` function
            return getConfigFromProps(action, props);
        });
    };
}

function init<a, msg>(
    id: string,
    props: *,
    getConfig: Action<msg> => Config<a, msg>
) {
    deepFreeze(props); // @Dev-only

    // If component already exists, just run render() again
    let componentRoot = renderById(id, props);
    if (componentRoot) {
        return componentRoot;
    }

    const config = getConfig(action);
    let model: a = config.initialModel;
    let noRender: number = 0;

    function action(tag, data = {}) {
        return () => update(tag, data);
    }

    function update(tag: msg, data: Object) {
        // Lines marked `@Dev-only` are removed by `prod` build
        model = clone(model); // @Dev-only
        const next = config.update[tag].apply(null, [model, data]);
        deepFreeze(model);    // @Dev-only
        run(next);
    }

    function run(next: Next) {
        if (!next) {
            render(props);
        }
        else if (typeof next === "function") {
            next();
        }
        else if (Array.isArray(next)) {
            noRender++;
            next.forEach(run);
            noRender--;
            render(props);
        }
        else if (typeof next.then === "function") {
            next.then(run);
            render(props); // End of sync chain
        }
    }

    function render(props) {
        if (!noRender) {
            patch(
                componentRoot,
                componentRoot = config.view(id, props, model)
            );
            setRefs(componentRoot, id, render);
        }
        return componentRoot;
    }

    if (config.initialAction) {
        noRender++;
        run(config.initialAction);
        noRender--;
    }

    componentRoot = config.view(id, props, model);
    setRefs(componentRoot, id, render);
    return componentRoot;
}

document.addEventListener("DOMContentLoaded", () => {
    const rootId = "app";
    patch(
        document.getElementById(rootId),
        app(rootId, { /* Props */ })
    );
});

function renderById(id: string, props: *) {
    const domNode: ?Object = document.getElementById(id);
    if (domNode && domNode.render) {
        return domNode.render(props);
    }
}

function setRefs(componentRoot: *, id: string, render: () => *) {
    // Run after all sync patches
    setTimeout(() => {
        if (componentRoot) {
        // Set `id` and a handle to the `render()` closure on DOM element
        // This creates a simple state/id pairing, and the VDOM lib takes care of clearing memory
            componentRoot.elm.id = id;
            componentRoot.elm.render = render;
        }
    });
}

function clone(o: *) {
    return JSON.parse(JSON.stringify(o));
}

function deepFreeze(o: *) {
    Object.freeze(o);
    Object.getOwnPropertyNames(o).forEach(
        p => {
            if (o.hasOwnProperty(p) &&
                o[p] !== null &&
                (typeof o[p] === "object" || typeof o[p] === "function") &&
                !Object.isFrozen(o[p])
            ) {
                deepFreeze(o[p]);
            }
    });
    return o;
}
