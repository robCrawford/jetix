/*
  @flow
  Counter component
*/
import type { Config } from "../lib/muv";
import { init } from "../lib/muv";
import { h } from "../lib/vdom";
import notification from "./notification";


type Props = {|
    +start: number;
|};

type Model = {|
    counter: number;
    warning: string;
|};

type Msg =
    "Increment" |
    "Decrement" |
    "Validate" |
    "SetWarning" |
    "ClearWarning";


export default (id: string, props: Props) =>

    init(id, action => ({

        initialModel: {
            counter: props.start,
            warning: ""
        },

        initialAction: action("Validate"),

        update: {
            // A handler updates `model` and returns any next action(s),
            // or a `Promise` that resolves with next action(s)
            Increment: (model, { step }: { step: number }) => {
                model.counter += step;
                return action("Validate");
            },
            Decrement: (model, { step }: { step: number }) => {
                model.counter -= step;
                return action("Validate");
            },
            Validate: model => {
                return [
                    action("ClearWarning"),
                    // Async
                    validateCount(model.counter)
                        .then(text => action("SetWarning", { text }))
                ];
            },
            SetWarning: (model, { text }: { text: string }) => {
                model.warning = text;
            },
            ClearWarning: model => {
                model.warning = "";
            }
        },

        view(model) {
            return h("div.counter", [
                h("button",
                    { on: { click: action("Increment", { step: 1 }) } },
                    "+"),
                h("div", String(model.counter)),
                h("button",
                    { on: { click: action("Decrement", { step: 1 }) } },
                    "-"),

                model.warning.length ?
                    // Child component - `notification` module
                    notification(`${id}-warning`, {
                        text: model.warning,
                        dismissAction: action("ClearWarning")
                    }) :
                    ""
                ]);
        }

    }: Config<Model, Msg>));


// Export for tests
export function isNegative(n: number): boolean {
    return n < 0;
}

function validateCount(n: number): Promise<string> {
    return new Promise(resolve => {
        setTimeout(() => resolve(isNegative(n) ? "Negative!" : ""), 500);
    });
}
