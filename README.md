
# Jetix

*Type-safe HyperScript components using pure functions.*

This is similar to the React/Redux pattern but is more directly inspired by Elm.  
It provides minimal wiring for components consisting of pure functions, with high TypeScript coverage.  

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
import { component, html, Config, VNode, Next, TaskSpec } from "../../../src/jetix";
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
  Increment: { step: number };
  Decrement: { step: number };
  Validate: null;
  SetFeedback: { text: string };
};

type Tasks = {
  ValidateCount: { count: number };
}


export default component<Props, State, Actions, Tasks>(
  (action, task): Config<Props, State, Actions, Tasks> => ({

    // Initial state
    state: (props): State => ({
      counter: props.start,
      feedback: ""
    }),

    // Initial action
    init: action("Validate"),

    // Action handlers return new state, and any next actions/tasks
    actions: {
      Increment: ({ step }, { props, state, rootState }): { state: State; next: Next } => {
        return {
          state: {
            ...state,
            counter: state.counter + step
          },
          next: action("Validate")
        };
      },
      Decrement: ({ step }, { props, state, rootState }): { state: State; next: Next } => {
        return {
          state: {
            ...state,
            counter: state.counter - step
          },
          next: action("Validate")
        };
      },
      Validate: (_, { props, state, rootState }): { state: State; next: Next } => {
        return {
          state,
          next: [
            action("SetFeedback", { text: "Validating..." }),
            // An async task
            task("ValidateCount", { count: state.counter })
          ]};
      },
      SetFeedback: ({ text }, { props, state, rootState }): { state: State } => {
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
      ValidateCount: ({ count }): TaskSpec<Props, State> => {
        return {
          perform: (): Promise<{ text: string }> => validateCount(count),
          success: (result: { text: string }, { props, state, rootState }): Next => {
            return action("SetFeedback", result);
          },
          failure: (err, { props, state, rootState }): Next => {
            return action("SetFeedback", { text: "Unavailable" });
          }
        };
      }
    },

    // View renders from props & state
    view(id, { props, state, rootState }): VNode {
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

  })
);
```

------------------------

## Example 2
*Hello World!*

```JavaScript
import { component, html, mount, Config, Next, TaskSpec, VNode } from "jetix";
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

const app = component<Props, State, Actions, Tasks>(
  (action, task): Config<Props, State, Actions, Tasks> => ({

    state: (): State => ({ message: "" }),

    init: action(
      "UpdateMessage",
      { message: "Hello World!" }
    ),

    actions: {
      UpdateMessage: ({ message }, { props, state }): { state: State; next: Next } => {
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
      SetDocTitle: ({ title }): TaskSpec<Props, State> => ({
        perform: (): void => {
          document.title = title;
        }
      })
    },

    view(id, { props, state }): VNode {
      return div(`#${id}-message`, state.message);
    }

  })
);

document.addEventListener(
  "DOMContentLoaded",
  (): void => mount({ app, props: {} })
);
```

------------------------

## Unit tests

For tests the `action` and `task` functions just return data, so component logic can be tested without mocks.

```JavaScript
import { initComponent } from "../../src/jetixTest";
import counter from "../ts/components/counter";

// Calling `initComponent` returns the test API
const { runAction, getTask } = initComponent(counter, { start: 0 });

// Test the output of an action
const { state, next } = runAction("Increment", { step: 1 });
expect(state.counter).toBe(1);
expect(next.name).toBe("Validate");

// Test the output of a task
const { success, failure } = getTask("ValidateCount", { count: 0 });
const next = success({ text: "✓ Valid" });
expect(next.name).toBe("SetFeedback");
```
