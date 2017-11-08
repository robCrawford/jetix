import { add } from "./lib/muv";


/*
  Counter component
*/
add("Counter", {

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

    view(model, action) {
        render(
            document.getElementById("Counter"),
            div([
                button('+', () => action("Increment", 1)),
                div([ text(model.counter) ]),
                button('-', () => action("Decrement", 2))
            ])
        );
    }
});


/*
  Utils
*/
function render(node, children) {
    empty(node);
    node.appendChild(children);
}

function empty(node) {
    while (node.firstChild) {
        node.removeChild(node.firstChild);
    }
}

function el(...a) {
    return document.createElement(...a);
}

function div(children = []) {
    const div = el('div');
    children.forEach(el => div.appendChild(el));
    return div;
}

function text(data) {
    return document.createTextNode(data);
}

function button(buttontext, clickAction) {
    const button = el('button');
    const label = text(buttontext);
    button.appendChild(label);
    button.onclick = clickAction;
    return button;
}
