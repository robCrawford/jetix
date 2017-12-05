
A `Model`, `Update`, `View` pattern in ES6 influenced by [The Elm Architecture](https://guide.elm-lang.org/architecture/) and [React](https://reactjs.org/tutorial/tutorial.html#passing-data-through-props).  


Uses [Snabbdom VDOM](https://github.com/snabbdom/snabbdom), ES6 modules, Flow, Sass, and Karma.  
Live reload requires the [Chrome liveReload plugin](https://chrome.google.com/webstore/detail/livereload/jnihajbhpnppcggbcgedagnkighmdlei).

```
npm install
gulp
```

Then visit: `http://localhost:8080`

Run tests with `npm test`.


Example counter component
-------------------------
[Demo](http://robcrawford.github.io/demos/es6-muv/)  

- Types `Msg` and `Model` are enforced throughout by the `Config<Model, Msg>` annotation.  
- `Validate` demonstrates a promise that resolves with an action.  
- `message` demonstrates a child component.  

```JavaScript
type Props = {|
    +start: number;
|};

type Model = {|
    counter: number;
    highlight: boolean;
    errors: string;
|};

type Msg =
    "Increment" |
    "Decrement" |
    "Highlight" |
    "Validate" |
    "SetErrors";


export default (props: Props) => init(
    ({
        initialModel: {
            counter: props.start,
            highlight: isEven(props.start),
            errors: ""
        },

        update(model, action) {
            // A handler updates `model` and returns any next action(s),
            // or a `Promise` that resolves with an action
            return {
                Increment: (step: number) => {
                    model.counter += step;
                    return [
                        action("Highlight"),
                        action("Validate")
                    ];
                },
                Decrement: (step: number) => {
                    model.counter -= step;
                    return action("Validate");
                },
                Highlight: () => {
                    model.highlight = isEven(model.counter);
                },
                Validate: () => {
                    model.errors = "";
                    // Async
                    return validateCount(model.counter)
                        .then(e => action("SetErrors", e));
                },
                SetErrors: (text: string) => {
                    model.errors = text;
                }
            };
        },

        view(model, action) {
            return h("div.counter", [
                h('button',
                    { on: { click: action("Increment", 1) } },
                    "+"),
                h('div',
                    { class: { highlight: model.highlight } },
                    String(model.counter)),
                h('button',
                    { on: { click: action("Decrement", 2) } },
                    "-"),
                // Child component
                model.errors.length ?
                    message({ text: model.errors }) :
                    ""
            ]);
        }

    }: Config<Model, Msg>)
);


export function isEven(n: number): boolean {
    return !(n % 2);
}

export function isNegative(n: number): boolean {
    return n < 0;
}

function validateCount(n: number): Promise<string> {
    return new Promise((resolve/*, reject*/) => {
        setTimeout(() => resolve(isNegative(n) ? "Negative!" : ""), 500);
    });
}
```
