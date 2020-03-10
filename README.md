# Jetix

Minimal wiring for TypeScript components made of pure functions.

- [Effects as data](https://www.youtube.com/watch?v=6EdXaWfoslc) for separation and cleaner tests
- [Snabbdom VDOM](https://github.com/snabbdom/snabbdom) for a [unidirectional data flow](https://guide.elm-lang.org/architecture/)
- [hyperscript-helpers](https://github.com/ohanhi/hyperscript-helpers) means the view is just functions
- [Optimized](https://github.com/robCrawford/jetix/blob/master/src/jetix.spec.ts) for fewer renders/patches
- High type coverage

Also contains lightweight prevention of anti-patterns like state mutation and manually calling declarative actions.\
See a [single page app example](http://robcrawford.github.io/demos/jetix/?debug) and its [src](https://github.com/robCrawford/jetix/tree/master/examples/spa).  

------------------------

## Example 1
*[Hello World!](https://github.com/robCrawford/jetix/tree/master/examples/hello-world)*

```JavaScript
import { component, html, mount, Config, Next, TaskSpec, VNode } from "jetix";
import { setDocTitle} from "../services/browser";
const { div } = html;

export type State = Readonly<{
  message: string;
  ready: boolean;
}>;

export type Actions = Readonly<{
  UpdateMessage: { message: string };
  UpdateStatus: { ready: boolean };
}>;

export type Tasks = Readonly<{
  SetDocTitle: { title: string };
}>;

export type Component = {
  State: State;
  Actions: Actions;
  Tasks: Tasks;
};


const app = component<Component>(
  ({ action, task }): Config<Component> => ({

    // Initial state
    state: (): State => ({ message: "", ready: false }),

    // Initial action
    init: action("UpdateMessage", { message: "Hello World!" }),

    // Action handlers return new state, and any next actions/tasks
    actions: {
      UpdateMessage: ({ message }, { state }): { state: State; next: Next } => {
        return {
          state: {
            ...state,
            message
          },
          next: task("SetDocTitle", { title: message })
        };
      },
      UpdateStatus: ({ ready }, { state }): { state: State } => {
        return {
          state: {
            ...state,
            ready
          }
        };
      },
    },

    // Task handlers provide callbacks for effects and async operations that may fail
    tasks: {
      SetDocTitle: ({ title }): TaskSpec<null, State> => ({
        perform: (): Promise<void> => setDocTitle(title),
        success: (): Next => action("UpdateStatus", { ready: true }),
        failure: (): Next => action("UpdateStatus", { ready: false })
      })
    },

    // View renders from props & state
    view(id, { state }): VNode {
      return div(`#${id}-message`, [
        div(state.message),
        div(state.ready ? '✅' : '❎')
      ]);
    }

  })
);

document.addEventListener(
  "DOMContentLoaded",
  (): void => mount({ app, props: {} })
);

export default app;
```

------------------------

## Unit tests

For tests the `action` and `task` functions just return data, so component logic can be tested without mocks.

```JavaScript
import { testComponent } from "jetix";
import app from "./app";

describe("App", () => {

  const { action, task, config, initialState } = testComponent(app);

  it("should set initial state", () => {
    expect(initialState).toEqual({ message: "" });
  });

  it("should initialize", () => {
    expect(config.init).toEqual({
      name: "UpdateMessage",
      data: { message: "Hello World!" }
    });
  });

  it("should perform 'UpdateMessage' action", () => {
    const { state, next } = action(
      "UpdateMessage",
      { message: "Hello World!"}
    );
    expect(state).toEqual({ message: "Hello World!" });
    expect(Array.isArray(next)).toBe(false);

    if (!Array.isArray(next)) {
      expect(next.name).toBe("SetDocTitle");
      expect(next.data).toEqual({ title: "Hello World!" });
    }
  });

  it("should contain 'SetDocTitle' task", () => {
    const { perform, success, failure } = task("SetDocTitle", { title: "test" });
    expect(perform).toBeTruthy();
    expect(success).toBeUndefined();
    expect(failure).toBeUndefined();
  })

});
```

------------------------

## Example 2
*Counter component [(from SPA src)](https://github.com/robCrawford/jetix/tree/master/examples/spa)*

```JavaScript
import { component, html, Config, VNode, Next, TaskSpec } from "jetix";
import notification from "./notification";
import { validateCount } from "../services/validation";
const { div, button } = html;

export type Props = Readonly<{
  start: number;
}>;

export type State = Readonly<{
  counter: number;
  feedback: string;
}>;

type Actions = Readonly<{
  Increment: { step: number };
  Decrement: { step: number };
  Validate: null;
  SetFeedback: { text: string };
}>;

type Tasks = Readonly<{
  ValidateCount: { count: number };
}>;

type Component = {
  Props: Props;
  State: State;
  Actions: Actions;
  Tasks: Tasks;
};


export default component<Component>(
  ({ action, task }): Config<Component> => ({

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
