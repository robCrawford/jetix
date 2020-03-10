import { Context, Dict, Next } from "./jetix";

/*
API for unit testing Jetix components

- Initialise component test API
import counter from "../ts/components/counter";
const { config, initialState, action, task } = testComponent(counter, { start: 0 });

- Run an action to inspect result `state` and `next` as data
const { state, next } = action("Increment", { step: 1 });

- Get a task to invoke `success` and `failure` callbacks
const { success, failure } = task('ValidateCount', { count: 0 });
const { name, data } = success('Test');
*/
type ComponentTestApi = {
  config: {
    state?: Function;
    init?: Next;
    actions?: Dict;
    tasks?: Dict;
    view: Function;
  };
  initialState: Dict;
  action: <S>(name: string, data?: {}) => { state: S; next?: NextAsData | NextAsData[] };
  task: (name: string, data?: {}) => TestTaskSpec;
};

type NextAsData = {
  name: string;
  data?: Dict;
};

type TestTaskSpec<P = Dict, S = Dict, RS = Dict> = {
  perform: () => Promise<{}> | void;
  success?: (result?: {}, ctx?: Context<P, S, RS>) => NextAsData | NextAsData[];
  failure?: (error?: {}, ctx?: Context<P, S, RS>) => NextAsData | NextAsData[];
};

// Returns next action/task inputs as data
const nextToData = (name: string, data?: {}): NextAsData => ({ name, data });

export function testComponent(component: { getConfig: Function }, props?: object): ComponentTestApi {
  // Initialise component passing in `nextToData()` instead of `action()` and `task()` functions
  const config = component.getConfig({ action: nextToData, task: nextToData });
  const initialState = config.state(props);

  return {
    // Output from the callback passed into `component(...)`
    config,

    // For comparing state changes
    initialState,

    // Run an action
    action<S>(name: string, data?: {}): { state: S; next?: NextAsData } {
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
