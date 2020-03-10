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
