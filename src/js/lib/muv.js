/*
  `Model, Update, View` wiring
*/
export function add(componentId, config) {

    function update(model, tag, data) {
        const updatedModel = Object.assign({}, model);
        config.update(updatedModel)[tag](data);
        return updatedModel;
    }

    function view(model) {
        config.view(
            model,
            (tag, ...data) => view(
                update(model, tag, data)
            )
        );
    }

    // Initialise
    document.addEventListener("DOMContentLoaded", () => {
        const componentRoot = document.createElement("div");
        componentRoot.id = componentId;
        getRootElement().appendChild(componentRoot);
        view(config.initialModel);
    });
}


export function remove(componentId) {
    const componentRoot = document.getElementById(componentId);
    if (componentRoot) {
        getRootElement().removeChild(componentRoot);
    }
}


function getRootElement() {
    return document.getElementById('app');
}
