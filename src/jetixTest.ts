/*
API for unit testing Jetix components

- Initialise component test API
import counter from "./counter";
const { initialState, action, task, config } = testComponent(counter, { start: 0 });

- Run an action to inspect result `state` and `next` as data
const { state, next } = action("Increment", { step: 1 });

- Get a task to invoke `success` and `failure` callbacks
const { perform, success, failure } = task("ValidateCount", { count: 0 });
const { name, data } = success({ text: "Test" });
*/
import { Context, Dict, Next } from "./jetix";

type ComponentTestApi = {
  config: {
    state?: Function;
    init?: Next;
    actions?: Dict;
    tasks?: Dict;
    view: Function;
  };
  initialState: Dict;
  action: <S>(name: string, data?: {}) => { state: S; next?: NextData | NextData[] };
  task: (name: string, data?: {}) => TestTaskSpec;
};

export type NextData = {
  name: string;
  data?: Dict;
};

type TestTaskSpec<P = Dict, S = Dict, RS = Dict> = {
  perform: () => Promise<{}> | void;
  success?: (result?: {}, ctx?: Context<P, S, RS>) => NextData | NextData[];
  failure?: (error?: {}, ctx?: Context<P, S, RS>) => NextData | NextData[];
};

// Returns next action/task inputs as data
const nextToData = (name: string, data?: {}): NextData => ({ name, data });

export function testComponent(component: { getConfig: Function }, props?: object): ComponentTestApi {
  // Initialise component passing in `nextToData()` instead of `action()` and `task()` functions
  const config = component.getConfig({
    action: nextToData,
    task: nextToData,
    rootAction: nextToData,
    rootTask: nextToData
  });
  const initialState = config.state && config.state(props);

  return {
    // Output from the callback passed into `component(...)`
    config,

    // For comparing state changes
    initialState,

    // Run an action
    action<S>(name: string, data?: {}): { state: S; next?: NextData } {
      // Returns any next operations as data
      return config.actions[name](data, { props, state: initialState });
    },

    // Get task spec for manually testing `success` and `failure` output
    task(name: string, data?: {}): TestTaskSpec {
      // Returns task spec
      return config.tasks[name](data);
    }
  };
}
