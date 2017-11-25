/*
  @flow
  `Model, Update, View` wiring
*/
import { patch } from "../lib/snabbdom";


type Thunk = () => void;

type HandlerOutput =
    Thunk | Thunk[] | Promise<any> | void;

export type Action<msg> =
    (tag: msg, ...data: any[]) => Thunk;

export type Handlers<msg> =
    { [tag: msg]: (...data: any[]) => HandlerOutput; };

export type Config<a, msg> = {
    initialModel: a,
    update: (model: a, action: Action<msg>) => Handlers<msg>,
    view: (model: a, action: Action<msg>) => void
}


export function init<a, msg>(config: Config<a, msg>): void {
    let model: a = config.initialModel;
    let componentRoot;
    let blockRender: boolean = false;

    const action: Action<msg> = (tag, ...data) =>
        () => {
            if (update(tag, data) && !blockRender) {
                patch(
                    componentRoot,
                    componentRoot = config.view(model, action)
                );
            }
        };

    function update(tag: msg, data: any[]): boolean {
        model = clone(model);
        const next = config.update(model, action)[tag]
            .apply(null, data);
        deepFreeze(model);
        return run(next);
    }

    function run(next: HandlerOutput): boolean {
        // Render view only when `next` chain ends
        let render = false;

        if (!next) {
            render = true;
        }
        else if (typeof next === "function") {
            next();
        }
        else if (Array.isArray(next)) {
            blockRender = true;
            next.forEach(a => run(a));
            blockRender = false;
            render = true;
        }
        else if (typeof next.then === "function") {
            next.then(a => a && a());
            render = true; // End of sync chain
        }

        return render;
    }

    return componentRoot = config.view(model, action);
}


export function main(rootElement: any) {
    document.addEventListener("DOMContentLoaded", () => {
        patch(
            document.getElementById("app"),
            rootElement
        );
    });
}


function clone(o: any) {
    return JSON.parse(JSON.stringify(o));
}

function deepFreeze(o: any) {
    Object.freeze(o);
    Object.getOwnPropertyNames(o).forEach(
        p => {
            if (o.hasOwnProperty(p)
                && o[p] !== null
                && (typeof o[p] === "object" || typeof o[p] === "function")
                && !Object.isFrozen(o[p])
            ) {
                deepFreeze(o[p]);
            }
    });
    return o;
}
