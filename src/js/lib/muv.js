/*
  @flow
  `Model, Update, View` wiring
*/
import { patch } from "../lib/snabbdom";


export type Action<msg> =
    (tag: msg, ...data: any[]) => () => void;

export type Handlers<msg> =
    { [tag: msg]: (data: any[]) => (() => void) | void; };

export type Config<a, msg> = {
    initialModel: a,
    update: (model: a, action: Action<msg>) => Handlers<msg>,
    view: (model: a, action: Action<msg>) => void
}


export function init<a, msg>(config: Config<a, msg>): void {
    let componentRoot = config.view(
            config.initialModel,
            action(config.initialModel)
        );

    function action(model: a): Action<msg> {
        return (tag, ...data) => () => {
            const newModel = update(model, tag, data);
            if (newModel) {
                view(newModel);
            }
        };
    }

    function update(model: a, tag: msg, data: any[]): a | void {
        const newModel = clone(model);
        const nextAction = config.update(newModel, action(newModel))[tag](data);
        deepFreeze(newModel);
        return (nextAction ? nextAction() : newModel);
    }

    function view(model: a): void {
        patch(
            componentRoot,
            componentRoot = config.view(model, action(model))
        );
    }

    return componentRoot;
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
