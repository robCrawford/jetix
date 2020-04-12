import { _setTestKey, component, html, mount } from "../src/jetix";
import { log } from "../src/jetixLog";
import * as vdom from "../src/vdom";
const { div } = html;
const testKey = _setTestKey({});

const patchSpy = jest.spyOn(vdom, "patch");
const renderSpy = jest.spyOn(log, "render");
const ctx = { rootState: { theme: "a" }, props: { test: "x" }, state: { count: 0 } };


describe("Jetix components", () => {
  let rootAction;
  let parentAction;
  let parentTask;
  let childAction;
  let validatePerform;

  const parentActions = {
    Increment: jest.fn( ({ step }, { state }) => ({ state: { ...state, count: state.count + step } }) ),
    Decrement: jest.fn( ({ step }, { state }) => ({ state: { ...state, count: state.count - step } }) )
  };
  const validateSuccess = jest.fn(
    (result, { props, state, rootState }) => parentAction("Increment", { step: result })
  );
  const validateFailure = jest.fn(
    (err, { props, state, rootState }) => parentAction("Decrement", { step: err })
  );
  const parentTasks = {
    Validate: ({ count }) => {
      return {
        perform: () => validatePerform(),
        success: validateSuccess,
        failure: validateFailure,
      };
    }
  };

  const jestReset = () => {
    patchSpy.mockClear();
    renderSpy.mockClear();
    validateSuccess.mockClear();
    validateFailure.mockClear();
    Object.keys(parentActions).forEach(
      (k) => parentActions[k].mockClear()
    );
  };

  // Initialise app
  const appEl = document.createElement("div");
  appEl.setAttribute("id", "app");
  document.body.appendChild(appEl);

  beforeEach(() => {
    const child = component<{
      Props: { test: string };
      State: { count: number };
      Actions: {
        Increment: { step: number };
        NoOp: null;
      };
    }>(({ action: a })  => {
      childAction = a;
      return {
        state: () => ({ count: 0 }),
        actions: {
          Increment: ({ step }, { state }) => ({ state: { ...state, count: state.count + step } }),
          NoOp: (_, { state }) => ({ state })
        },
        view: id => div(`#${id}`, "test")
      };
    });

    const parent = component<{
      Props: { test: string };
      State: { count: number };
      Actions: {
        Increment: { step: number };
        Decrement: { step: number };
      };
      Tasks: {
        Validate: { count: number };
      };
    }>(({ action: a, task: t }) => {
      parentAction = a;
      parentTask = t;
      return {
        state: () => ({ count: 0 }),
        actions: parentActions,
        tasks: parentTasks,
        view: id => div(`#${id}`, child(`#child`, { test: "x" }))
      };
    });

    const app = component<{
      Props: { test: string };
      State: { theme: string; };
      Actions: {
        SetTheme: { theme: string; };
        NoOp: null;
      };
    }>(({ action: a }) => {
      rootAction = a;
      return {
        state: () => ({ theme: "a" }),
        actions: {
          SetTheme: ({ theme }, { state }) => ({ state: { ...state, theme }}),
          NoOp: (_, { state }) => ({ state })
        },
        view: id => div(`#${id}`, [ parent(`#parent`, { test: "x" }) ])
      }
    });

    mount({ app, props: { test: "x" } });
    jestReset();
  });

  it("should render component and children when state changes", () => {
    parentAction("Increment", { step: 1 })(testKey);
    expect(renderSpy).toHaveBeenCalledTimes(2);
    expect(patchSpy).toHaveBeenCalledTimes(1);
  });

  it("should not render parent when child state changes", () => {
    childAction("Increment", { step: 1 })(testKey);
    expect(renderSpy).toHaveBeenCalledTimes(1);
    expect(patchSpy).toHaveBeenCalledTimes(1);
  });

  it("should render all when root state changes", () => {
    rootAction("SetTheme", { theme: "test" })(testKey);
    expect(renderSpy).toHaveBeenCalledTimes(3);
    expect(patchSpy).toHaveBeenCalledTimes(1);
  });

  it("should not render when state does not change", () => {
    childAction("NoOp")(testKey);
    expect(renderSpy).not.toHaveBeenCalled();
    expect(patchSpy).not.toHaveBeenCalled();
  });

  it("should not render when rootState does not change", () => {
    rootAction("NoOp")(testKey);
    expect(renderSpy).not.toHaveBeenCalled();
    expect(patchSpy).not.toHaveBeenCalled();
  });

  it("should run the success action of a synchronous task", () => {
    validatePerform = () => 5;
    return parentTask("Validate", { count: 1 })(testKey).then(() => {
      expect(validateSuccess).toHaveBeenCalled();
      expect(validateFailure).not.toHaveBeenCalled();
      expect(parentActions.Increment).toHaveBeenCalledWith({ step: 5 }, ctx);
      expect(renderSpy).toHaveBeenCalledTimes(2);
      expect(patchSpy).toHaveBeenCalledTimes(1);
    })
  });

  it("should run the failure action of a synchronous task", () => {
    validatePerform = () => { throw 3 };
    return parentTask("Validate", { count: 1 })(testKey).then(() => {
      expect(validateSuccess).not.toHaveBeenCalled();
      expect(validateFailure).toHaveBeenCalled();
      expect(parentActions.Decrement).toHaveBeenCalledWith({ step: 3 }, ctx);
      expect(renderSpy).toHaveBeenCalledTimes(2);
      expect(patchSpy).toHaveBeenCalledTimes(1);
    })
  });

  it("should run the success action of an asynchronous task", () => {
    validatePerform = () => new Promise(res => setTimeout(() => res(5), 100));
    return parentTask("Validate", { count: 1 })(testKey).then(() => {
      expect(validateSuccess).toHaveBeenCalled();
      expect(validateFailure).not.toHaveBeenCalled();
      expect(parentActions.Increment).toHaveBeenCalledWith({ step: 5 }, ctx);
      expect(renderSpy).toHaveBeenCalledTimes(2);
      expect(patchSpy).toHaveBeenCalledTimes(1);
    })
  });

  it("should run the failure action of an asynchronous task", () => {
    validatePerform = () => new Promise((res, rej) => setTimeout(() => rej(3), 100));
    return parentTask("Validate", { count: 1 })(testKey).then(() => {
      expect(validateSuccess).not.toHaveBeenCalled();
      expect(validateFailure).toHaveBeenCalled();
      expect(parentActions.Decrement).toHaveBeenCalledWith({ step: 3 }, ctx);
      expect(renderSpy).toHaveBeenCalledTimes(2);
      expect(patchSpy).toHaveBeenCalledTimes(1);
    })
  });

});

