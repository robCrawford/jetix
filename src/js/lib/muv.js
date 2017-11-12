/*
  @flow
  `Model, Update, View` wiring
*/
export type Action<msg> =
    (tag: msg, ...data: any[]) => () => void;

export type Handlers<msg> =
    { [tag: msg]: (data: any[]) => (() => void) | void; };

export type Config<a, msg> = {
    id: string,
    initialModel: a,
    update: (model: a, action: Action<msg>) => Handlers<msg>,
    view: (model: a, action: Action<msg>) => void
}


export function add<a, msg>(config: Config<a, msg>): void {
    const componentId = config.id;

    function action(model: a): Action<msg> {
        return (tag, ...data) => () => {
            view(update(model, tag, data));
        };
    }

    function update(model: a, tag: msg, data: any[]): a {
        const newModel = Object.assign({}, model);
        const nextAction = config.update(newModel, action(newModel))[tag](data);
        if (nextAction) {
            nextAction();
        }
        return newModel;
    }

    function view(model: a): void {
        config.view(model, action(model));
    }

    // Initialise
    const componentRoot = document.createElement("div");
    componentRoot.id = componentId;
    getRootElement().appendChild(componentRoot);
    view(config.initialModel);
}


export function remove(componentId: string): void {
    const componentRoot = document.getElementById(componentId);
    if (componentRoot) {
        getRootElement().removeChild(componentRoot);
    }
}


function getRootElement(): HTMLElement {
    return document.getElementById('app');
}
