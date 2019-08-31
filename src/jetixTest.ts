/*
API for unit testing Jetix components

- Initialise component
import counter from "../ts/components/counter";
const { config, initialState, runAction, getTask } = initComponent(counter, { start: 0 });

- Run an action to inspect result `state` and `next` as data
const { state, next } = runAction("Increment", { step: 1 });

- Get a task to invoke `success` and `failure` callbacks
const { success, failure } = getTask('ValidateCount', { count: 0 });
const { name, data } = success('Test');
*/
import { Context } from "./jetix";

type ComponentTestApi = {
  config: {};
  initialState: {};
  runAction: <S>(name: string, data?: {}) => { state: S; next?: NextAsData | NextAsData[] };
  getTask: (name: string, data?: {}) => TestTaskSpec<{}, {}>;
};

type NextAsData = {
  name: string;
  data?: {};
};

type TestTaskSpec<P, S> = {
  perform: () => Promise<{}> | void;
  success?: (result: {}, ctx: Context<P, S>) => NextAsData | NextAsData[];
  failure?: (error: {}, ctx: Context<P, S>) => NextAsData | NextAsData[];
};

// Returns next action/task inputs as data
const nextToData = (name: string, data?: {}): NextAsData => ({ name, data });

export function initComponent(component, props): ComponentTestApi {
  // Initialise component passing in `nextToData()` instead of `action()` and `task()` functions
  const config = component.getConfig(nextToData, nextToData);
  const initialState = config.state(props);

  return {
    // Output from the callback passed into `component(...)`
    config,

    // For comparing state changes
    initialState,

    // Run an action
    runAction<S>(name: string, data?: {}): { state: S; next?: NextAsData } {
      // Returns any next operations as data
      return config.actions[name](data, { props, state: initialState });
    },

    // Get task spec for manually testing `success` and `failure` output
    getTask(name: string, data?: {}): TestTaskSpec<{}, {}> {
      // Returns task spec
      return config.tasks[name](data);
    }
  };
}
