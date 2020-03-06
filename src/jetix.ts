import { patch, setHook, VNode } from "./vdom";
export { html, VNode } from "./vdom";
import { log } from "./jetixLog";
export * from './jetixTest';

type ValueOf<T> = T[keyof T];

enum ThunkType {
  Action,
  Task
};

export type ActionThunk = {
  (data?: Dict): void | ActionThunk; // Returns another `ActionThunk` when currying
  type: ThunkType;
}

export type GetActionThunk<A> = <K extends keyof A>(actionName: K, data?: A[K]) => ActionThunk;

export type RunAction<A> = (actionName: keyof A, data?: ValueOf<A>) => void;

export type TaskThunk = {
  (data?: Dict): Promise<Next> | void;
  type: ThunkType;
  taskName: string;
};

export type GetTaskThunk<T> = (taskName: keyof T, data?: ValueOf<T>) => TaskThunk;

export type Next = undefined | ActionThunk | TaskThunk | (ActionThunk | TaskThunk)[];

export type Context<P, S, RS> = {
  props?: P;
  state?: S;
  rootState?: RS;
};

export type ActionHandler<D = Dict, P = Dict, S = Dict, RS = Dict> = (
  data?: D,
  ctx?: Context<P, S, RS>
) => { state: S; next?: Next };

type TaskHandler<D = Dict, P = Dict, S = Dict, RS = Dict> = (data?: D) => TaskSpec<P, S, RS>;

export type TaskSpec<P = Dict, S = Dict, RS = Dict> = {
  perform: () => Promise<Dict> | void;
  success?: (result: {}, ctx: Context<P, S, RS>) => Next;
  failure?: (error: {}, ctx: Context<P, S, RS>) => Next;
};

type Component = {
  Props?: Dict;
  State?: Dict;
  Actions?: Dict;
  Tasks?: Dict;
  RootState?: Dict;
  RootActions?: Dict;
  RootTasks?: Dict;
};

export type Config<C extends Component = Dict> = {
  state?: (props?: C['Props']) => C['State'];
  init?: Next;
  actions?: {[K in keyof C['Actions']]: ActionHandler<C['Actions'][K], C['Props'], C['State'], C['RootState']>};
  tasks?: {[K in keyof C['Tasks']]: TaskHandler<C['Tasks'][K], C['Props'], C['State'], C['RootState']>};
  view: (
    id: string,
    ctx: Context<C['Props'], C['State'], C['RootState']>
  ) => VNode;
};

export type GetConfig<C extends Component> = (fns: {
  action: GetActionThunk<C['Actions']>;
  task: GetTaskThunk<C['Tasks']>;
  rootAction: GetActionThunk<C['RootActions']>;
  rootTask: GetTaskThunk<C['RootTasks']>;
}) => Config<C>;

type RenderFn<P> = (props?: P) => VNode | void;

export type Dict<T = {}> = Record<string, T>;


// App state
let renderRefs: { [id: string]: RenderFn<Dict> } = {};
let rootState: Dict | undefined;
let prevProps: Record<string, Dict | undefined> = {};
let renderIds: Record<string, boolean> = {};
let renderRootId: string | undefined;
let noRender = 0;
let rootStateChanged = false;

function resetAppState(): void {
  renderRefs = {};
  rootState = undefined;
  prevProps = {};
  renderIds = {};
  renderRootId = undefined;
}

const appId = "app";
let internalKey = {}; // Private unique value

export const _setTestKey = <T>(k: T): T => internalKey = k; // For lib unit tests
let rootAction: Function;
let rootTask: Function;

export function component<C extends Component>(
  getConfig: GetConfig<C>
): { (idStr: string, props?: C['Props']): VNode; getConfig: Function } {
  // Pass in callback that returns component config
  // Returns render function that is called by parent e.g. `counter("counter-0", { start: 0 })`
  const renderFn = (idStr: string, props?: C['Props']): VNode => {
    const id = (idStr || "").replace(/^#/, "");
    if (!id.length || (!noRender && renderIds[id])) {
      throw Error(`Component${id ? ` "${id}" ` : ' '}must have a unique id!`);
    }
    // Ids included in this render
    renderIds[id] = true;
    return renderComponent<C>(id, getConfig, props);
  };
  // Add a handle to `getConfig` for tests
  renderFn.getConfig = getConfig;
  return renderFn;
}

export function renderComponent<C extends Component>(
  id: string,
  getConfig: GetConfig<C>,
  props?: C['Props']
): VNode {
  deepFreeze(props);
  const isRoot = id === appId;

  // If component already exists, just run render() again
  const existingComponentRoot = renderById(id, props);
  if (existingComponentRoot) {
    return existingComponentRoot;
  }

  const action: GetActionThunk<C['Actions']> = (actionName, data): ActionThunk => {
    const actionThunk = (thunkInput?: ValueOf<C['Actions']> | object): void => {
      if (isDomEvent(thunkInput as Dict)) {
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
        action(actionName, thunkInput as ValueOf<C['Actions']>);
      }
      else {
        log.manualError(id, String(actionName));
      }
    };
    actionThunk.type = ThunkType.Action;
    return actionThunk;
  };

  const task: GetTaskThunk<C['Tasks']> = (taskName, data): TaskThunk => {
    if (!config.tasks) {
      throw Error(`tasks ${String(config.tasks)}`);
    }
    const performTask = (): Promise<Next> | void => {
      const tasks = config.tasks;
      if (tasks) {
        const { perform, success, failure }: TaskSpec<C['Props'], C['State'], C['RootState']> = tasks[taskName](data);
        const output = perform();
        if (output && output.then) {
          return output
            .then((result: Dict): Next => success && success(result, { props, state, rootState }))
            .catch((err: Dict): Next => failure && failure(err, { props, state, rootState }));
        }
      }
    };
    const taskThunk = (thunkInput?: Dict): Promise<Next> | void => {
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

  const config = getConfig({
    action,
    task,
    rootAction: rootAction as GetActionThunk<C['RootActions']>,
    rootTask: rootTask as GetTaskThunk<C['RootTasks']>
  });
  let state = config.state && config.state(props);

  function update(actionName: keyof C['Actions'], data?: ValueOf<C['Actions']>): void {
    let next: Next;
    const prevState = deepFreeze(state);
    log.updateStart(id, prevState, String(actionName), data);

    const actions = config.actions;
    if (actions) {
      ({ state, next } = (actions[actionName] as ActionHandler<ValueOf<C['Actions']>, C['Props'], C['State'], C['RootState']>)(
        data, { props, state: prevState, rootState }
      ));
      if (isRoot) {
        rootState = state;
        // Action handlers return existing state by ref if no changes
        if (prevState !== state) {
          rootStateChanged = true;
        }
      }
      log.updateEnd(state as Dict);
      run(next, props, String(actionName));
    }
  }

  function run(next: Next | undefined, props?: C['Props'], prevTag?: string): void {
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

  const render: RenderFn<C['Props']> = (props?: C['Props']): VNode | void => {
    if (!noRender) {
      if (rootStateChanged) {
        const rootRender = renderRefs[appId];
        rootStateChanged = false;
        rootRender && rootRender(prevProps[appId]);
      }
      else {
        let isRenderRoot = false;
        if (!renderRootId) {
          // The root component of this render
          renderRootId = id;
          isRenderRoot = true;
        }
        const prevComponentRoot = componentRoot;
        componentRoot = config.view( id, { props, state, rootState });
        log.render(id, props);

        if (isRenderRoot) {
          patch(prevComponentRoot as VNode, componentRoot);
          log.patch();
          renderRootId = undefined;
          renderIds = {};
        }
        log.setStateGlobal(id, state);
        if (isRenderRoot) {
          publish("patch");
        }
        setRenderRef(componentRoot as VNode, id, render as RenderFn<Dict>);
      }
    }
    prevProps[id] = props;
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
    rootAction = action;
    rootTask = task;
    rootState = state;
  }

  log.render(id, props);
  let componentRoot = config.view(id, { props, state, rootState });
  prevProps[id] = props;
  setRenderRef(componentRoot, id, render as RenderFn<Dict>);
  log.setStateGlobal(id, state);

  return componentRoot;
}

export function mount<A, P>({ app, props, init }: {
  app: (idStr: string, props?: P) => VNode;
  props: P;
  init?: (runRootAction: RunAction<A>) => void;
}): void {
  resetAppState();
  // Mount the top-level app component
  patch(
    document.getElementById(appId) as Element,
    app(appId, props)
  );
  log.patch();
  publish("patch");
  renderIds = {};

  // Manually invoking an action without `internalKey` is an error, so `runRootAction`
  // is provided by `mount` for wiring up events to root actions (e.g. routing)
  if (init) {
    const runRootAction: RunAction<A> = (actionName, data): void => {
      rootAction(actionName as string, data)(internalKey);
    };
    init(runRootAction);
  }
}

function isDomEvent(e?: Dict): boolean {
  return Boolean(e && "eventPhase" in e);
}

function renderById(id: string, props?: Dict): VNode | void {
  const render = renderRefs[id];
  if (render) {
    return render(props);
  }
}

function setRenderRef(vnode: VNode, id: string, render: RenderFn<Dict>): void {
  renderRefs[id] = render;
  setHook(vnode, "destroy", (): void => {
    // Component not found in `renderIds` for this render
    if(!renderIds[id] && id !== renderRootId) {
      delete renderRefs[id];
      delete prevProps[id];
      log.setStateGlobal(id, undefined);
    }
  });
}

function deepFreeze<T extends Dict>(o?: T): T | undefined {
  if (o) {
    Object.freeze(o);
    Object.getOwnPropertyNames(o).forEach((p: string): void => {
      if (o.hasOwnProperty(p) &&
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

export function publish(type: string, detail?: Dict): void {
  document.dispatchEvent(new CustomEvent(type, detail ? { detail } : undefined));
}
