/*
  API for unit testing Jetix components
*/
export function initComponent(component, props) {

    const config = component.getConfig(
        // Return actions and tasks as data instead of thunks
        (actionName, data) => ({
            actionName,
            data
        }),
        (taskName, data) => ({
            taskName,
            data
        })
    );
    const initialState = config.state(props);

    return {
        // Output from the fn passed into `component(...)` (the default export of each module)
        config,

        // For comparing state changes
        initialState,

        // Run an action - returns output as data `{ actionName, data }` for testing output expectations
        runAction(actionName: string, data?: {}, props?: {}, state = initialState) {
            return config.actions[actionName](data, props, state);
        },

        // Get task as data for manually testing `success` and `failure` output expectations
        getTask(taskName: string, data?: {}) {
            return config.tasks[taskName](data);
        }
    };
}
