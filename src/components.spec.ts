import { _setTestKey, component, html, mount } from "../src/jetix";
import { log } from "../src/jetixLog";
import * as vdom from "../src/vdom";
const { div } = html;

const patchSpy = jest.spyOn(vdom, "patch");
const renderSpy = jest.spyOn(log, "render");

const testKey = _setTestKey({});
const counterState = () => ({ count: 0 });
const counterActions = {
  Increment: ({ step }, { state }) => ({ state: { ...state, count: state.count + step } }),
};

describe("Jetix components", function() {
  let rootAction;
  let parentAction;
  let childAction;

  // Initialise app
  const appEl = document.createElement("div");
  appEl.setAttribute("id", "app");
  document.body.appendChild(appEl);

  beforeEach(() => {
    const childCounter = component<{
      Props: { test: string };
      State: { count: number }
    }>(({ action: a })  => {
      childAction = a;
      return {
        state: counterState,
        actions: counterActions,
        view: id => div(`#${id}`, "test")
      };
    });

    const parentCounter = component<{
      State: { count: number }
    }>(({ action: a }) => {
      parentAction = a;
      return {
        state: counterState,
        actions: counterActions,
        view: id => div(`#${id}`, childCounter(`#child`, { test: '' }))
      };
    });

    const app = component<{
      State: { theme: string; };
      Actions: {
        SetTheme: { theme: string; }
      };
    }>(({ action: a }) => {
      rootAction = a;
      return {
        state: () => ({ theme: "a" }),
        actions: {
          SetTheme: ({ theme }, { state }) => ({ state: { ...state, theme }}),
        },
        view: id => div(`#${id}`, [ parentCounter(`#parent`) ])
      }
    });

    mount({ app, props: {} });
    patchSpy.mockClear();
    renderSpy.mockClear();
  });

  it("should render component and children when state changes", function() {
    parentAction("Increment", { step: 1 })(testKey);
    expect(renderSpy).toHaveBeenCalledTimes(2);
    expect(patchSpy).toHaveBeenCalledTimes(1);
  });

  it("should not render parent when child state changes", function() {
    childAction("Increment", { step: 1 })(testKey);
    expect(renderSpy).toHaveBeenCalledTimes(1);
    expect(patchSpy).toHaveBeenCalledTimes(1);
  });

  it("should render all when root state changes", function() {
    rootAction("SetTheme", { theme: 'test' })(testKey);
    expect(renderSpy).toHaveBeenCalledTimes(3);
    expect(patchSpy).toHaveBeenCalledTimes(1);
  });

});

