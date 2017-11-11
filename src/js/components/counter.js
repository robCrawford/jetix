/*
  @flow
  Counter component
*/
import type { Config } from "../lib/muv";


type Model =
    { counter: number;
    };

type Msg
    = "Increment"
    | "Decrement";


export default (componentId: string): Config<Model, Msg> => ({

    id: componentId,

    initialModel: {
        counter: 0
    },

    update(model) {
        return {
            Increment: ([step]) => {
                model.counter += step;
            },
            Decrement: ([step]) => {
                model.counter -= step;
            }
        };
    },

    view(model, action): void {
        render(componentId,
            div([
                button('+', () => action("Increment", 1)),
                div([ text(String(model.counter)) ]),
                button('-', () => action("Decrement", 2))
            ], "counter")
        );
    }
});


/*
  Utils
*/
function render(id: string, children: HTMLElement): void {
    const node = document.getElementById(id);
    empty(node);
    node.appendChild(children);
}

function empty(node: HTMLElement): void {
    while (node.firstChild) {
        node.removeChild(node.firstChild);
    }
}

function el(type: string): HTMLElement {
    return document.createElement(type);
}

function div(children: Array<HTMLElement | Text> = [], classes?: string): HTMLElement{
    const div = el('div');
    if (classes) {
        div.className = classes;
    }
    children.forEach(el => div.appendChild(el));
    return div;
}

function text(content: string): Text {
    return document.createTextNode(content);
}

function button(label: string, clickAction: (e: Event) => void): HTMLElement {
    const button = el('button');
    button.appendChild(text(label));
    button.onclick = clickAction;
    return button;
}
