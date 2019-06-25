import { component } from "../../../src/jetix";
import { html } from "../../../src/vdom";
import notification from "./notification";
import { validateCount } from "../services/validation";
const { div, button } = html;

type Props = {
    readonly start: number;
};

type State = {
    counter: number;
    feedback: string;
};

type Actions = {
    "Increment": { step: number };
    "Decrement": { step: number };
    "Validate": null;
    "SetFeedback": { text: string };
};

type Tasks = {
    "ValidateCount": { count: number };
}


export default component<State, Props, Actions, Tasks>((action, task) => ({

    // Initial state
    state: props => ({
        counter: props.start,
        feedback: ""
    }),

    // Initial action
    init: action("Validate"),

    // Action handlers return new state, and any next actions/tasks
    actions: {
        // Inputs: action data, state, props, rootState
        Increment: ({ step }, state) => {
            state.counter += step;
            return {
                state,
                next: action("Validate")
            };
        },
        Decrement: ({ step }, state) => {
            state.counter -= step;
            return {
                state,
                next: action("Validate")
            };
        },
        Validate: (_, state) => {
            return {
                state,
                next: [
                    action("SetFeedback", { text: "Validating..." }),
                    // Async task
                    task("ValidateCount", { count: state.counter })
                ]};
        },
        SetFeedback: ({ text }, state) => {
            state.feedback = text;
            return { state };
        }
    },

    // Task handlers provide callbacks for async operations that may fail
    tasks: {
        ValidateCount: ({ count }) => {
            return {
                perform: () => validateCount(count),
                success: (text: string) => action("SetFeedback", { text }),
                failure: () => action("SetFeedback", { text: "Unavailable" })
            };
        }
    },

    // View renders from props & state
    // Inputs: component instance id, state, props, rootState
    view(id, state, props) {
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
