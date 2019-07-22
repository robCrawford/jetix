
# Jetix

*Type-safe HyperScript components using pure functions.*

- Based on [Elm's MUV pattern](https://guide.elm-lang.org/architecture/), unidirectional and lightweight.
- Inspired by this [effects as data](https://www.youtube.com/watch?v=6EdXaWfoslc) talk for more pure functions and testability.
- [hyperscript-helpers](https://github.com/ohanhi/hyperscript-helpers) means the view is just JS functions.
- Optimised for [*least possible number of renders*](https://github.com/robCrawford/jetix/blob/master/test/jetixSpec.ts) and then to only the affected tree depth.  

Also contains lightweight prevention of anti-patterns like state mutation and manually calling declarative actions.  
See a [single page app example](http://robcrawford.github.io/demos/jetix/?debug) and its [src](https://github.com/robCrawford/jetix/tree/master/example).  

------------------------

## Example 1
*Counter component [(from SPA src)](https://github.com/robCrawford/jetix/tree/master/example)*

```JavaScript
import { component, html } from "jetix";
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
        Increment: ({ step }, props, state, rootState) => {
            return {
                state: {
                    ...state,
                    counter: state.counter + step
                },
                next: action("Validate")
            };
        },
        Decrement: ({ step }, props, state, rootState) => {
            return {
                state: {
                    ...state,
                    counter: state.counter - step
                },
                next: action("Validate")
            };
        },
        Validate: (_, props, state, rootState) => {
            return {
                state,
                next: [
                    action("SetFeedback", { text: "Validating..." }),
                    // An async task
                    task("ValidateCount", { count: state.counter })
                ]};
        },
        SetFeedback: ({ text }, props, state, rootState) => {
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
                success: (result: { text: string }, props, state) => {
                    return action("SetFeedback", result);
                },
                failure: (err, props, state) => {
                    return action("SetFeedback", { text: "Unavailable" });
                }
            };
        }
    },

    // View renders from props & state
    view(id, props, state, rootState) {
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
```

------------------------

## Example 2
*Hello World!*

```JavaScript
import { component, html, mount } from "jetix";
const { div } = html;

type Props = {};

type State = {
    message: string;
};

type Actions = {
    UpdateMessage: { message: string };
};

type Tasks = {
    SetDocTitle: { title: string };
}

const app = component<Props, State, Actions, Tasks>((action, task) => ({

    state: () => ({ message: "" }),

    init: action(
        "UpdateMessage",
        { message: "Hello World!" }
    ),

    actions: {
        UpdateMessage: ({ message }, props, state) => {
            return {
                state: {
                    ...state,
                    message
                },
                next: task("SetDocTitle", { title: message })
            };
        }
    },

    tasks: {
        SetDocTitle: ({ title }) => ({
            perform: () => {
                document.title = title;
            }
        })
    },

    view(id, props, state) {
        return div(`#${id}-message`, state.message);
    }

}));


document.addEventListener(
    "DOMContentLoaded",
    () => mount({ app, props: {} })
);
```
