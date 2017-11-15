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

    function action(model: a): Action<a, msg> {
        return (tag, ...data) => () => {
            const updatedModel = update(model, tag, data);
            view(updatedModel);
            return updatedModel;
        };
    }

    function update(model: a, tag: msg, data: any[]): a {
        const nextModel = Object.assign({}, model);
        const nextAction = config.update(nextModel, action(nextModel))[tag](data);
        state[componentId] = nextModel; // Just for logging
        return (nextAction ? nextAction() : nextModel);
    }

    function view(model: a): void {
        config.view(model, action(model));
    }

    // Initialise
    const componentRoot = document.createElement("div");
    componentRoot.id = componentId;
    getRootElement().appendChild(componentRoot);
    view(state[componentId] = config.initialModel);
}


export function remove(componentId: string): void {
    const componentRoot = document.getElementById(componentId);
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
