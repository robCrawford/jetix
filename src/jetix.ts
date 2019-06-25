/*
  Lines marked `@devBuild` should be removed for production
*/
import { patch, setHook, VNode } from "./vdom";
import { log } from "./jetixDev"; // @devBuild

type ValueOf<T> = T[keyof T];

export type ActionThunk = (data?: {}) => void | ActionThunk; // Argument only used when currying

export type GetActionThunk<A> = <K extends keyof A>(actionName: K, data?: A[K]) => ActionThunk;

export type RunAction<A> = (actionName: keyof A, data?: ValueOf<A>) => void;

export type GetTaskThunk<T> = (taskName: keyof T, data?: ValueOf<T>) => Promise<ActionThunk>;

type Next = ActionThunk | Promise<ActionThunk> | (ActionThunk | Promise<ActionThunk>)[];

export type ActionHandler<S, P, D> = (
    data: D,
    state: S,
    props: P,
    rootState: {}
) => { state: S; next?: Next };

type TaskHandler<D> = (data: D) => TaskSpec;

type TaskResult = any; // Result from the effect promise

type TaskSpec = {
    perform: () => Promise<TaskResult>;
    success: (a: TaskResult) => ActionThunk;
    failure: (a: TaskResult) => ActionThunk;
};

type WithTaskName<F, T> = F & { taskName: keyof T };

export type Config<S, P, A, T> = {
    state?: (props: P) => S;
    init?: Next;
    actions?: {[K in keyof A]: ActionHandler<S, P, A[K]>};
    tasks?: {[K in keyof T]: TaskHandler<T[K]>};
    view: (id: string, state: S, props: {}, rootState: {}) => VNode;
};

export type GetConfig<S, P, A, T> =
    (action: GetActionThunk<A>, task: GetTaskThunk<T>) => Config<S, P, A, T>;

type RenderFn<T> = (props: T) => VNode | void;

const appId = "app";
const renderRefs: { [a: string]: RenderFn<{}> } = {};
const internalKey = {}; // Private unique value
let rootState;
export let rootAction;

export function component<S = {}, P = {}, A = {}, T = {}>(
    getConfig: GetConfig<S, P, A, T>
) {
    // Pass in callback that returns component config
    // Returns render function that is called by parent e.g. `counter("counter-0", { start: 0 })`
    const renderFn = (idStr: string, props?: P): VNode => {
        const id = idStr.replace(/^#/, "");
        if (!id.length) {
            throw Error("Component requires an id");
        }
        return renderComponent<S, P, A, T>(id, props, getConfig);
    };
    // Add a handle to `getConfig` for tests
    renderFn.getConfig = getConfig;
    return renderFn;
}

export function renderComponent<S, P, A, T>(
    id: string,
    props: P,
    getConfig: GetConfig<S, P, A, T>
): VNode {
    deepFreeze(props); // @devBuild
    const isRoot = id === appId;

    // If component already exists, just run render() again
    let componentRoot = renderById(id, props);
    if (componentRoot) {
        return componentRoot;
    }

    const action: GetActionThunk<A> = (actionName, data): ActionThunk => {
        return (thunkInput?: ValueOf<A> | {}): void => {
            if (thunkInput && "srcElement" in thunkInput) {
                // Invoked from the DOM, `thunkInput` is the (unused) event
                update(actionName, data);
            }
            else if (thunkInput === internalKey) {
                // Called by internal method `run()`
                // `internalKey` disallows an action being invoked manually from outside
                update(actionName, data);
            }
            else if (thunkInput) {
                // If a data argument is supplied, return a new thunk instead of invoking the current one
                // This enables currying e.g. when passing an action from parent to child via props
                action(actionName, thunkInput as ValueOf<A>);
            }
            else { // @devBuild
                log.manualActionError(id, String(actionName)); // @devBuild
            } // @devBuild
        };
    };

    const task: GetTaskThunk<T> = (taskName, data) => {
        if (!config.tasks) {
            throw Error(`tasks ${String(config.tasks)}`);
        }
        const { perform, success, failure }: TaskSpec = config.tasks[taskName](data);
        const promise = perform();
        (promise.then as WithTaskName<typeof promise.then, T>).taskName = taskName;
        return promise.then(success).catch(failure);
    };

    // Invoke the function passed into `component()` with props and these functions
    const config = getConfig(action, task);
    let state = config.state && config.state(props);
    let noRender = 0;

    function update(actionName: keyof A, data?: ValueOf<A>): void {
        let next;
        log.updateStart(id, state, String(actionName), data); // @devBuild
        const newState =
            clone( // @devBuild
                state
            ) // @devBuild
        ;
        if (isRoot) {
            rootState = newState;
        }
        const actionHandler = config.actions[actionName];
        ({ state, next } = (actionHandler as ActionHandler<S, P, ValueOf<A>>)(data, newState, props, rootState));
        // Freeze in dev to error on any mutation outside of action handlers
        deepFreeze(state); // @devBuild
        log.updateEnd(state); // @devBuild
        run(next, props, String(actionName));
    }

    function run(next: Next | undefined, props: P, prevTag?: string): void {
        if (!next) {
            render(props);
        }
        else if (typeof next === "function") {
            // An action thunk is either invoked here or from the DOM
            // `internalKey` prevents manual calls from outside
            next(internalKey);
        }
        else if (Array.isArray(next)) {
            noRender++;
            next.forEach(n => run(n, props, prevTag));
            noRender--;
            render(props);
        }
        else if (typeof next.then === "function") {
            const taskName = (next.then as WithTaskName<typeof next.then, T>).taskName || "unknown";
            next
                .then(n => {
                    log.taskSuccess(id, String(taskName)); // @devBuild
                    run(n, props, prevTag);
                })
                .catch(e => log.taskFailure(id, String(taskName), e)); // @devBuild
            log.taskPerform(String(taskName)); // @devBuild
            render(props); // End of sync chain
        }
    }

    const render: RenderFn<P> = (props: P) => {
        if (!noRender) {
            patch(componentRoot as VNode, (componentRoot = config.view(id, state, props, rootState)));
            setRenderRef(componentRoot, id, render);
            log.render(id, props); // @devBuild
            publish("patch");
        }
        return componentRoot;
    }

    if (config.init) {
        noRender++;
        run(config.init, props);
        noRender--;
    }
    else { // @devBuild
        log.noInitialAction(id, state); // @devBuild
    } // @devBuild

    if (isRoot) {
        rootAction = action as GetActionThunk<A>;
        rootState = state;
    }

    componentRoot = config.view(id, state, props, rootState);
    setRenderRef(componentRoot, id, render);
    log.render(id, props); // @devBuild
    return componentRoot;
}

export function mount<T, P>({ app, props, init }: {
    app: (idStr: string, props?: P) => VNode;
    props: P;
    init?: (runRootAction: RunAction<T>) => void;
}): void {
    // Mount the top-level app component
    patch(
        document.getElementById(appId),
        app(appId, props)
    );
    // Manually invoking an action without `internalKey` is an error, so `runRootAction`
    // is provided by `mount` for wiring up events to root actions (e.g. routing)
    if (init) {
        const runRootAction: RunAction<T> = (actionName, data) => {
            rootAction(actionName, data)(internalKey);
        };
        init(runRootAction);
    }
}

function renderById(id: string, props: {}): VNode | void {
    const render = renderRefs[id];
    if (render) {
        return render(props);
    }
}

function setRenderRef(vnode: VNode, id: string, render: RenderFn<{}>): void {
    // Run after all synchronous patches
    setTimeout(() => {
        renderRefs[id] = render;
        setHook(vnode, "destroy", () => {
            delete renderRefs[id];
        });
    });
}

function clone<T>(o: T): T { // @devBuild
    // Should only be cloning simple state models
    return o && JSON.parse(JSON.stringify(o)); // @devBuild
} // @devBuild

function deepFreeze<T>(o: T): T { // @devBuild
    if (o) { // @devBuild
        Object.freeze(o); // @devBuild
        Object.getOwnPropertyNames(o).forEach((p: string) => { // @devBuild
            if ( // @devBuild
                o.hasOwnProperty(p) && // @devBuild
                o[p] !== null && // @devBuild
                (typeof o[p] === "object" || typeof o[p] === "function") && // @devBuild
                !Object.isFrozen(o[p]) // @devBuild
            ) { // @devBuild
                deepFreeze(o[p]); // @devBuild
            } // @devBuild
        }); // @devBuild
    } // @devBuild
    return o; // @devBuild
} // @devBuild

// Pub/sub
export function subscribe(type: string, listener: EventListener) {
    document.addEventListener(type, listener);
}
export function unsubscribe(type: string, listener: EventListener) {
    document.removeEventListener(type, listener);
}
export function publish(type: string, detail?: any) {
    document.dispatchEvent(new CustomEvent(type, detail ? { detail } : null));
}
