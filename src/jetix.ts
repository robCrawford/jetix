/*
  Lines marked `@devBuild` should be removed for production
*/
import { patch, setHook, VNode } from "./vdom";
export { html } from "./vdom";
import { log } from "./jetixDev"; // @devBuild
import equal from 'fast-deep-equal';

type ValueOf<T> = T[keyof T];

enum ThunkType {
    Action,
    Task
};

export type ActionThunk = {
    (data?: {}): void | ActionThunk; // Argument only used when currying
    type: ThunkType;
}

export type GetActionThunk<A> = <K extends keyof A>(actionName: K, data?: A[K]) => ActionThunk;

export type RunAction<A> = (actionName: keyof A, data?: ValueOf<A>) => void;

export type TaskThunk = {
    (): Promise<Next>;
    type: ThunkType;
    taskName: string;
};

export type GetTaskThunk<T> = (taskName: keyof T, data?: ValueOf<T>) => TaskThunk;

type Next = ActionThunk | TaskThunk | (ActionThunk | TaskThunk)[];

export type ActionHandler<D, P, S> = (
    data: D,
    props: P,
    state: S,
    rootState: {}
) => { state: S; next?: Next };

type TaskHandler<D> = (data: D) => TaskSpec;

type TaskResult = any; // Result from the effect promise

type TaskSpec = {
    perform: () => Promise<TaskResult>;
    success?: (a: TaskResult) => Next;
    failure?: (a: TaskResult) => Next;
};

export type Config<P, S, A, T> = {
    state?: (props: P) => S;
    init?: Next;
    actions?: {[K in keyof A]: ActionHandler<A[K], P, S>};
    tasks?: {[K in keyof T]: TaskHandler<T[K]>};
    view: (id: string, props: P, state: S, rootState: {}) => VNode;
};

export type GetConfig<P, S, A, T> =
    (action: GetActionThunk<A>, task: GetTaskThunk<T>) => Config<P, S, A, T>;

type RenderFn<T> = (props: T) => VNode | void;

const appId = "app";
const renderRefs: { [id: string]: RenderFn<{}> } = {};
const prevProps: { [id: string]: {} } = {};
let internalKey = {}; // Private unique value
let rootState;
let rootStateChanged = false;
export const _setTestKey = k => internalKey = k;
export let rootAction;

export function component<P = {}, S = {}, A = {}, T = {}>(
    getConfig: GetConfig<P, S, A, T>
) {
    // Pass in callback that returns component config
    // Returns render function that is called by parent e.g. `counter("counter-0", { start: 0 })`
    const renderFn = (idStr: string, props?: P): VNode => {
        const id = idStr.replace(/^#/, "");
        if (!id.length) {
            throw Error("Component requires an id");
        }
        return renderComponent<P, S, A, T>(id, props, getConfig);
    };
    // Add a handle to `getConfig` for tests
    renderFn.getConfig = getConfig;
    return renderFn;
}

export function renderComponent<P extends {}, S extends {}, A, T>(
    id: string,
    props: P,
    getConfig: GetConfig<P, S, A, T>
): VNode {
    deepFreeze(props);
    const isRoot = id === appId;

    // If component already exists, just run render() again
    let componentRoot = renderById(id, props);
    if (componentRoot) {
        return componentRoot;
    }

    const action: GetActionThunk<A> = (actionName, data): ActionThunk => {
        const actionThunk = (thunkInput?: ValueOf<A> | {}): void => {
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
        actionThunk.type = ThunkType.Action;
        return actionThunk;
    };

    const task: GetTaskThunk<T> = (taskName, data): TaskThunk => {
        if (!config.tasks) {
            throw Error(`tasks ${String(config.tasks)}`);
        }
        const taskThunk = () => {
            const { perform, success, failure }: TaskSpec = config.tasks[taskName](data);
            const promise = perform();
            return promise.then(success).catch(failure);
        };
        taskThunk.type = ThunkType.Task;
        taskThunk.taskName = String(taskName);
        return taskThunk;
    };

    const config = getConfig(action, task);
    let state = config.state && config.state(props);
    let noRender = 0;
    let stateChanged = false;

    function update(actionName: keyof A, data?: ValueOf<A>): void {
        let next;
        const prevState = deepFreeze(state);
        prevProps[id] = props;
        log.updateStart(id, prevState, String(actionName), data); // @devBuild

        ({ state, next } = (config.actions[actionName] as ActionHandler<ValueOf<A>, P, S>)(
            data, props, prevState, rootState
        ));
        // Action handlers return existing state by ref if no changes
        stateChanged = prevState !== state;
        if (isRoot) {
            rootState = state;
            rootStateChanged = stateChanged;
        }
        log.updateEnd(state); // @devBuild
        run(next, props, String(actionName));
    }

    function run(next: Next | undefined, props: P, prevTag?: string): void {
        if (!next) {
            render(props);
        }
        else if ((next as ActionThunk).type === ThunkType.Action) {
            // An action thunk may only be invoked here or from the DOM
            // `internalKey` prevents any manual calls from outside
            (next as ActionThunk)(internalKey);
        }
        else if (Array.isArray(next)) {
            noRender++;
            next.forEach(n => run(n, props, prevTag));
            noRender--;
            render(props);
        }
        else if ((next as TaskThunk).type === ThunkType.Task) {
            const promise = (next as TaskThunk)();
            const taskName = (next as TaskThunk).taskName;
            promise
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
            // `state` is same ref when unchanged but `props` is always a new object so deep compare
            const renderRequired = stateChanged || rootStateChanged || !equal(prevProps[id], props);
            if (renderRequired) {
                patch(componentRoot as VNode, (componentRoot = config.view(id, props, state, rootState)));
                setRenderRef(componentRoot, id, render);
                log.render(id, props); // @devBuild
                publish("patch");
                if (isRoot) {
                    rootStateChanged = false;
                }
            }
            else { // @devBuild
                log.noRender(id); // @devBuild
            } // @devBuild
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

    componentRoot = config.view(id, props, state, rootState);
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
            delete prevProps[id];
        });
    });
}

function deepFreeze<T>(o: T): T {
    if (o) {
        Object.freeze(o);
        Object.getOwnPropertyNames(o).forEach((p: string) => {
            if (
                o.hasOwnProperty(p) &&
                o[p] !== null &&
                (typeof o[p] === "object" || typeof o[p] === "function") &&
                !Object.isFrozen(o[p])
            ) {
                deepFreeze(o[p]);
            }
        });
    }
    return o;
}

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
