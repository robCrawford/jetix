/*
  @flow
  `Model, Update, View` wiring
*/
import { patch } from "../lib/vdom";
import { h, setHook } from "./vdom";
import app from "../app";


type Thunk = () => void;

type Next =
    Thunk | Promise<any> | Array<Thunk | Promise<any>> | void;

export type Action<msg> =
    (tag: msg, data?: Object) => Thunk;

export type Config<a, msg> = {|
    +initialModel: a,
    +initialAction?: Next,
    +update: { +[tag: msg]: (a, data: Object) => Next },
    +view: (model: a) => void
|}


export function init<a, msg>(id: string, getConfig: Action<msg> => Config<a, msg>) {

    let componentRoot = renderById(id);
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
        deepFreeze(model); // @Dev-only
        run(next);
    }

    function run(next: Next) {
        if (!next) {
            render();
        }
        else if (typeof next === "function") {
            next();
        }
        else if (Array.isArray(next)) {
            noRender++;
            next.forEach(run);
            noRender--;
            render();
        }
        else if (typeof next.then === "function") {
            next.then(run);
            render(); // End of sync chain
        }
    }

    function render() {
        if (!noRender) {
            patch(
                componentRoot,
                componentRoot = config.view(model)
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

    componentRoot = config.view(model);
    setRefs(componentRoot, id, render);
    return componentRoot;
}

document.addEventListener("DOMContentLoaded", () => {
    patch(
        document.getElementById("app"),
        h("div#app", [ app() ])
    );
});

function renderById(id: string) {
    const domNode: ?Object = document.getElementById(id);
    if (domNode) {
        return domNode.render();
    }
}

function setRefs(vnode: *, id: string, render: () => *) {
    // Run after all sync patches
    setTimeout(() => {
        if (vnode) {
            vnode.elm.id = id;
            vnode.elm.render = render;
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
