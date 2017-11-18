/*
  @flow
  `Model, Update, View` wiring
*/
import { patch } from "../lib/snabbdom";


export type Action<a, msg> =
    (tag: msg, ...data: any[]) => () => a;

export type Handlers<a, msg> =
    { [tag: msg]: (data: any[]) => (() => a) | void; };

export type Config<a, msg> = {
    initialModel: a,
    update: (model: a, action: Action<a, msg>) => Handlers<a, msg>,
    view: (model: a, action: Action<a, msg>) => void
}


export function init<a, msg>(config: Config<a, msg>): void {
    let componentRoot = config.view(
            config.initialModel,
            action(config.initialModel)
        );

    function action(model: a, level: number = 0): Action<a, msg> {
        return (tag, ...data) => () => {
            const newModel = update(model, tag, data, level);
            if (level === 0) {
                view(newModel);
            }
            return newModel;
        };
    }

    function update(model: a, tag: msg, data: any[], level: number): a {
        const newModel = clone(model);
        const nextAction = config.update(
                newModel,
                action(newModel, level + 1)
            )[tag](data);
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
