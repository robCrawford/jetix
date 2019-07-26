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
import { Next, TaskSpec } from "./jetix";

export function initComponent(component, props): {} {
    // Initialise component passing in `nextAsData()` instead of `action()` and `task()` functions
    const config = component.getConfig(nextAsData, nextAsData);
    const initialState = config.state(props);

    return {
        // Output from the callback passed into `component(...)`
        config,

        // For comparing state changes
        initialState,

        // Run an action
        runAction(name: string, data?: {}): Next {
            // Returns any next operations as data
            return config.actions[name](data, props, initialState);
        },

        // Get task for manually testing `success` and `failure` output
        getTask(name: string, data?: {}): TaskSpec<{}, {}> {
            // Returns task spec
            return config.tasks[name](data);
        }
    };
}

// Returns next action/task inputs
const nextAsData = (name: string, data: {}): {} => ({ name, data });
