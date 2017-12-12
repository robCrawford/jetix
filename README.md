
A `Model`, `Update`, `View` pattern for ES6 components, inspired by [The Elm Architecture](https://guide.elm-lang.org/architecture/).  

- Nested VDOM components for unidirectional data flow
- Flow for type safety
- Model freeze/clone cycle (removed in prod for speed)
- Optimised for minimal number of renders ([tests](https://github.com/robCrawford/es6-muv/blob/master/src/test/lib/muvSpec.js))

The [MUV lib](https://github.com/robCrawford/es6-muv/blob/master/src/js/lib/muv.js) itself is trivially small, the aim being to provide type-safe wiring and nothing else.  
This project configuration uses [Snabbdom](https://github.com/snabbdom/snabbdom) VDOM, ES6 modules, Flow, Sass, and Karma.  

```
npm install
gulp
```

Then visit: `http://localhost:8080`  

Run tests with `npm test`.  


Example counter component
-------------------------
[Demo](http://robcrawford.github.io/demos/es6-muv/)  

- Types `Model` and `Msg` are enforced throughout by the `Config<Model, Msg>` annotation.  
- `"Validate"` demonstrates a promise that resolves with an action.  
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


export default (props: Props) =>

    init(action => ({

        initialModel: {
            counter: props.start,
            highlight: isEven(props.start),
            errors: ""
        },

        initialAction:
            action("Validate"),

        update(model) {
            // A handler updates `model` and returns any next action(s),
            // or a `Promise` that resolves with next action(s)
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

        view(model) {
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


// Export for tests
export function isEven(n: number): boolean {
    return !(n % 2);
}

export function isNegative(n: number): boolean {
    return n < 0;
}

function validateCount(n: number): Promise<string> {
    return new Promise(resolve => {
        setTimeout(() => resolve(isNegative(n) ? "Negative!" : ""), 500);
    });
}
```
