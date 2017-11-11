/*
  @flow
  `Model, Update, View` wiring
*/
export type Action<msg> =
    (tag: msg, ...data: any[]) => void;

export type Handlers<msg> =
    { [tag: msg]: (data: any[]) => void; };

export type Config<a, msg> =
    { id: string
    , initialModel: a
    , update: (model: a) => Handlers<msg>
    , view: (model: a, action: Action<msg>) => void
    }


export function add<a, msg>(config: Config<a, msg>): void {
    const componentId = config.id;

    function update(model: a, tag: msg, data: any[]): a {
        const updatedModel = Object.assign({}, model);
        config.update(updatedModel)[tag](data);
        return updatedModel;
    }

    function view(model: a): void {
        config.view(
            model,
            (tag, ...data) => {
                view(update(model, tag, data));
            });
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
