
A `Model`, `Update`, `View` pattern in ES6 based on [The Elm Architecture](https://guide.elm-lang.org/architecture/).  


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
[Online demo](http://robcrawford.github.io/demos/es6-muv/)
```
type Props = {
    start: number;
};

type Model = {
    counter: number;
    highlight: boolean;
};

type Msg =
    "Increment" |
    "Decrement" |
    "SetHighlight";


export default (props: Props) => init(
    ({
        initialModel: {
            counter: props.start,
            highlight: isHighlight(props.start)
        },

        update(model, action) {
            return {
                Increment: ([ step: number ]) => {
                    model.counter += step;
                    return action("SetHighlight");
                },
                Decrement: ([ step: number ]) => {
                    model.counter -= step;
                    return action("SetHighlight");
                },
                SetHighlight: () => {
                    model.highlight = isHighlight(model.counter);
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
                    "-")
            ]);
        }

    }: Config<Model, Msg>)
);


export function isHighlight(n: number): boolean {
    return !!n && n % 2 === 0;
}

```
