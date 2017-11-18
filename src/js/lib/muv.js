/*
  @flow
  `Model, Update, View` wiring
*/
const state = {};


export type Action<a, msg> =
    (tag: msg, ...data: any[]) => () => a;

export type Handlers<a, msg> =
    { [tag: msg]: (data: any[]) => (() => a) | void; };

export type Config<a, msg> = {
    id: string,
    initialModel: a,
    update: (model: a, action: Action<a, msg>) => Handlers<a, msg>,
    view: (model: a, action: Action<a, msg>) => void
}


export function add<a, msg>(config: Config<a, msg>): void {
    const componentId = config.id;

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
        const nextAction = config.update(newModel, action(newModel, level + 1))[tag](data);
        freezeState(newModel);
        return (nextAction ? nextAction() : newModel);
    }

    function view(model: a): void {
        config.view(model, action(model));
    }

    function freezeState(model: a): a {
        // `state` entry is just for logging
        return state[componentId] = deepFreeze(model);
    }

    // Initialise
    const componentRoot = document.createElement("div");
    componentRoot.id = componentId;
    getRootElement().appendChild(componentRoot);
    view(freezeState(config.initialModel));
}


export function remove(componentId: string): void {
    const componentRoot = document.getElementById(componentId);
    delete state[componentId];
    if (componentRoot) {
        getRootElement().removeChild(componentRoot);
    }
}


export function logState(): void {
    console.table(state);
}


function getRootElement(): HTMLElement {
    return document.getElementById('app');
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
