import { patch, setHook, VNode } from "./vdom";
export { html } from "./vdom";
import { log } from "./jetixLog";
import equal from 'fast-deep-equal';

type ValueOf<T> = T[keyof T];

enum ThunkType {
    Action,
    Task
};

export type ActionThunk = {
    (data: {}): void | ActionThunk; // Returns another `ActionThunk` when currying
    type: ThunkType;
}

export type GetActionThunk<A> = <K extends keyof A>(actionName: K, data?: A[K]) => ActionThunk;

export type RunAction<A> = (actionName: keyof A, data?: ValueOf<A>) => void;

export type TaskThunk = {
    (data: {}): Promise<Next> | void;
    type: ThunkType;
    taskName: string;
};

export type GetTaskThunk<T> = (taskName: keyof T, data?: ValueOf<T>) => TaskThunk;

export type Next = ActionThunk | TaskThunk | (ActionThunk | TaskThunk)[];

type Context<P, S> = {
    props: P;
    state: S;
    rootState: {};
};

export type ActionHandler<D, P, S> = (
    data: D,
    ctx: Context<P, S>
) => { state: S; next?: Next };

type TaskHandler<D, P, S> = (data: D) => TaskSpec<P, S>;

export type TaskSpec<P, S> = {
    perform: () => Promise<{}> | void;
    success?: (result: {}, ctx: Context<P, S>) => Next;
    failure?: (error: {}, ctx: Context<P, S>) => Next;
};

export type Config<P, S, A, T> = {
    state?: (props: P) => S;
    init?: Next;
    actions?: {[K in keyof A]: ActionHandler<A[K], P, S>};
    tasks?: {[K in keyof T]: TaskHandler<T[K], P, S>};
    view: (id: string, ctx: Context<P, S>) => VNode;
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

export const _setTestKey = (k: {}): void => {
    internalKey = k; // For lib unit tests
};
export let rootAction;
export let rootTask;

export function component<P = {}, S = {}, A = {}, T = {}>(
    getConfig: GetConfig<P, S, A, T>
): (idStr: string, props?: P) => VNode {
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
        const actionThunk = (thunkInput: ValueOf<A> | {}): void => {
            if (isDomEvent(thunkInput)) {
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
            else {
                log.manualError(id, String(actionName));
            }
        };
        actionThunk.type = ThunkType.Action;
        return actionThunk;
    };

    const task: GetTaskThunk<T> = (taskName, data): TaskThunk => {
        if (!config.tasks) {
            throw Error(`tasks ${String(config.tasks)}`);
        }
        const performTask = (): Promise<Next> | void => {
            const { perform, success, failure }: TaskSpec<P, S> = config.tasks[taskName](data);
            const output = perform();
            if (output && output.then) {
                return output
                    .then((result: {}): Next => success(result, { props, state, rootState }))
                    .catch((err: {}): Next => failure(err, { props, state, rootState }));
            }
        };
        const taskThunk = (thunkInput: {}): Promise<Next> | void => {
            if (isDomEvent(thunkInput)) {
                // Invoked from the DOM, `thunkInput` is the (unused) event
                const promise = performTask();
                if (promise && promise.then) {
                    promise.then((next: Next): void => run(next, props));
                }
            }
            else if (thunkInput === internalKey) {
                return performTask();
            }
            else {
                log.manualError(id, String(taskName));
            }
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
        let next: Next;
        const prevState = deepFreeze(state);
        prevProps[id] = props;
        log.updateStart(id, prevState, String(actionName), data);

        ({ state, next } = (config.actions[actionName] as ActionHandler<ValueOf<A>, P, S>)(
            data, { props, state: prevState, rootState }
        ));
        // Action handlers return existing state by ref if no changes
        stateChanged = prevState !== state;
        if (isRoot) {
            rootState = state;
            rootStateChanged = stateChanged;
        }
        log.updateEnd(state);
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
            next.forEach((n: Next): void => run(n, props, prevTag));
            noRender--;
            render(props);
        }
        else if ((next as TaskThunk).type === ThunkType.Task) {
            const result = (next as TaskThunk)(internalKey);
            const taskName = (next as TaskThunk).taskName;
            const isPromise = Boolean(result && result.then);
            if (isPromise) {
                (result as Promise<Next>)
                    .then((n: Next): void => {
                        log.taskSuccess(id, String(taskName));
                        run(n, props, prevTag);
                    })
                    .catch((e: Error): void => log.taskFailure(id, String(taskName), e));
            }
            log.taskPerform(String(taskName), isPromise);
            render(props); // End of sync chain
        }
    }

    const render: RenderFn<P> = (props: P): VNode | void => {
        if (!noRender) {
            // `state` is same ref when unchanged but `props` is always a new object so deep compare
            const renderRequired = stateChanged || rootStateChanged || !equal(prevProps[id], props);
            if (renderRequired) {
                patch(componentRoot as VNode, (componentRoot = config.view(id, { props, state, rootState })));
                setRenderRef(componentRoot, id, render);
                log.render(id, props);
                publish("patch");
                if (isRoot) {
                    rootStateChanged = false;
                }
            }
            else {
                log.noRender(id);
            }
        }
        return componentRoot;
    }

    if (config.init) {
        noRender++;
        run(config.init, props);
        noRender--;
    }
    else {
        log.noInitialAction(id, state);
    }

    if (isRoot) {
        rootAction = action as GetActionThunk<A>;
        rootTask = task as GetTaskThunk<T>;
        rootState = state;
    }

    componentRoot = config.view(id, { props, state, rootState });
    setRenderRef(componentRoot, id, render);
    log.render(id, props);
    return componentRoot;
}

export function mount<A, P>({ app, props, init }: {
    app: (idStr: string, props?: P) => VNode;
    props: P;
    init?: (runRootAction: RunAction<A>) => void;
}): void {
    // Mount the top-level app component
    patch(
        document.getElementById(appId),
        app(appId, props)
    );
    // Manually invoking an action without `internalKey` is an error, so `runRootAction`
    // is provided by `mount` for wiring up events to root actions (e.g. routing)
    if (init) {
        const runRootAction: RunAction<A> = (actionName, data): void => {
            rootAction(actionName, data)(internalKey);
        };
        init(runRootAction);
    }
}

function isDomEvent(e: {}): boolean {
    return e && "eventPhase" in e;
}

function renderById(id: string, props: {}): VNode | void {
    const render = renderRefs[id];
    if (render) {
        return render(props);
    }
}

function setRenderRef(vnode: VNode, id: string, render: RenderFn<{}>): void {
    // Run after all synchronous patches
    setTimeout((): void => {
        renderRefs[id] = render;
        setHook(vnode, "destroy", (): void => {
            delete renderRefs[id];
            delete prevProps[id];
        });
    });
}

function deepFreeze<T>(o: T): T {
    if (o) {
        Object.freeze(o);
        Object.getOwnPropertyNames(o).forEach((p: string): void => {
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
export function subscribe(type: string, listener: EventListener): void {
    document.addEventListener(type, listener);
}
export function unsubscribe(type: string, listener: EventListener): void {
    document.removeEventListener(type, listener);
}
export function publish(type: string, detail?: {}): void {
    document.dispatchEvent(new CustomEvent(type, detail ? { detail } : null));
}
