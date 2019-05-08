import { Action, Task, component } from "jetix";
import notification from "./notification";
import { validateCount } from "../services/validation";
import { html } from "../lib/vdom";
const { div, button } = html;

type Props = {
    readonly start: number;
};

type State = {
    counter: number;
    feedback: string;
};

type ActionName =
    "Increment" |
    "Decrement" |
    "Validate" |
    "SetFeedback";

type TaskName =
    "ValidateCount"


export default component<State, Props, ActionName, TaskName>((action: Action<ActionName>, task: Task<TaskName>) => ({

    // Initial state
    state: (props: Props) => ({
        counter: props.start,
        feedback: ""
    }),

    // Initial action
    init: action("Validate"),

    // Action handlers return new state, and any next actions/tasks
    actions: {
        // Inputs: action data, state, props, rootState
        Increment: ({ step }: { step: number }, state: State) => {
            state.counter += step;
            return {
                state,
                next: action("Validate")
            };
        },
        Decrement: ({ step }: { step: number }, state: State) => {
            state.counter -= step;
            return {
                state,
                next: action("Validate")
            };
        },
        Validate: (_, state: State) => {
            return {
                state,
                next: [
                    action("SetFeedback", { text: "Validating..." }),
                    // Async task
                    task("ValidateCount", { count: state.counter })
                ]};
        },
        SetFeedback: ({ text }: { text: string }, state: State) => {
            state.feedback = text;
            return { state };
        }
    },

    // Task handlers provide callbacks for async operations that may fail
    tasks: {
        ValidateCount: ({ count }: { count: number }) => {
            return {
                perform: () => validateCount(count),
                success: (text: string) => action("SetFeedback", { text }),
                failure: () => action("SetFeedback", { text: "Unavailable" })
            };
        }
    },

    // View renders from props & state
    // Inputs: component instance id, state, props, rootState
    view(id: string, state: State, props: Props) {
        return div(".counter", [
            button(
                { on: { click: action("Increment", { step: 1 }) } },
                "+"
            ),
            div(String(state.counter)),
            button(
                { on: { click: action("Decrement", { step: 1 }) } },
                "-"
            ),
            // Child component - `notification` module
            notification(`#${id}-feedback`, {
                text: state.feedback,
                onDismiss: action("SetFeedback", { text: "" })
            })
        ]);
    }

}));
