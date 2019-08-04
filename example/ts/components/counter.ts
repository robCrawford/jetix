import { component, html } from "../../../src/jetix";
import notification from "./notification";
import { validateCount } from "../services/validation";
const { div, button } = html;

export type Props = {
    readonly start: number;
};

export type State = {
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

export default component<Props, State, Actions, Tasks>((action, task) => ({

    // Initial state
    state: (props) => ({
        counter: props.start,
        feedback: ""
    }),

    // Initial action
    init: action("Validate"),

    // Action handlers return new state, and any next actions/tasks
    actions: {
        Increment: ({ step }, { props, state, rootState }) => {
            return {
                state: {
                    ...state,
                    counter: state.counter + step
                },
                next: action("Validate")
            };
        },
        Decrement: ({ step }, { props, state, rootState }) => {
            return {
                state: {
                    ...state,
                    counter: state.counter - step
                },
                next: action("Validate")
            };
        },
        Validate: (_, { props, state, rootState }) => {
            return {
                state,
                next: [
                    action("SetFeedback", { text: "Validating..." }),
                    // An async task
                    task("ValidateCount", { count: state.counter })
                ]};
        },
        SetFeedback: ({ text }, { props, state, rootState }) => {
            return {
                state: {
                    ...state,
                    feedback: text
                }
            };
        }
    },

    // Task handlers provide callbacks for effects and async operations that may fail
    tasks: {
        ValidateCount: ({ count }) => {
            return {
                perform: () => validateCount(count),
                success: (result: { text: string }, { props, state, rootState }) => {
                    return action("SetFeedback", result);
                },
                failure: (err, { props, state, rootState }) => {
                    return action("SetFeedback", { text: "Unavailable" });
                }
            };
        }
    },

    // View renders from props & state
    view(id, { props, state, rootState }) {
        return div(`#${id}.counter`, [
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
