/*
  @flow
  Counter component
*/
import type { Config } from "../lib/muv";
import { init } from "../lib/muv";
import { h } from "../lib/snabbdom";
import warning from "./warning";


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
                    "-"),
                (model.counter < 0) ?
                    warning({ message: "Negative!" }) :
                    ""
            ]);
        }

    }: Config<Model, Msg>)
);

function isHighlight(n: number): boolean {
    return !!n && n % 2 === 0;
}
