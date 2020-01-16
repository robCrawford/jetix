import { _setTestKey, rootAction, component, html, mount } from "../src/jetix";
import { log } from "../src/jetixLog";
import * as vdom from "../src/vdom";
const { div } = html;

const patchSpy = jest.spyOn(vdom, "patch");
const renderSpy = jest.spyOn(log, "render");

const testKey = _setTestKey({});
const defaultProps = { testP: "test" };
const counterState = () => ({ count: 0 });
const counterActions = {
  Increment: ({ step }, { state }) => ({ state: { ...state, count: state.count + step } }),
};


describe("Jetix components", function() {
  let childCounterProps;
  let childCounterAction;
  let parentCounterAction;

  // Initialise app
  const appEl = document.createElement("div");
  appEl.setAttribute("id", "app");
  document.body.appendChild(appEl);

  beforeEach(() => {
    childCounterProps = defaultProps;

    const childCounter = component<{ testP: string }, { count: number }, any, any>(a => {
      childCounterAction = a;
      return {
        state: counterState,
        actions: counterActions,
        view: id => div(`#${id}`, "test")
      };
    });

    const parentCounter = component<{}, { count: number }, any, any>(a => {
      parentCounterAction = a;
      return {
        state: counterState,
        actions: counterActions,
        view: id => div(`#${id}`, [ childCounter(`#c1`, childCounterProps) ])
      };
    });

    const app = component(() => ({
      state: () => ({ timestamp: 0, theme: "a" }),
      actions: {
        SetTimestamp: ({ timestamp }, { state }) => {
          return { state: { ...state, timestamp } };
        },
        SetTheme: ({ theme }, { state }) => {
          return { state: { ...state, theme } };
        },
      },
      view: id => div(`#${id}`, [ parentCounter(`#c0`) ])
    }));

    mount({ app, props: {} });
    patchSpy.mockClear();
    renderSpy.mockClear();
  });

  it("should render once when state changes", function() {
    expect(patchSpy).not.toHaveBeenCalled();
    expect(renderSpy).not.toHaveBeenCalled();
    parentCounterAction("Increment", { step: 1 })(testKey);
    expect(renderSpy).toHaveBeenCalledTimes(1); // render parent counter only
    expect(patchSpy).toHaveBeenCalledTimes(1);
  });

  it("should render once when a props value changes", function() {
    expect(patchSpy).not.toHaveBeenCalled();
    expect(renderSpy).not.toHaveBeenCalled();
    childCounterProps = { testP: "newValue" };
    parentCounterAction("Increment", { step: 1 })(testKey);
    expect(renderSpy).toHaveBeenCalledTimes(2); // render parent counter, render child counter
    expect(patchSpy).toHaveBeenCalledTimes(1);
  });

  it("should not rerender when props is a new object with the same value", function() {
    expect(patchSpy).not.toHaveBeenCalled();
    expect(renderSpy).not.toHaveBeenCalled();
    childCounterProps = { testP: "test" };
    parentCounterAction("Increment", { step: 1 })(testKey);
    expect(renderSpy).toHaveBeenCalledTimes(1); // render parent counter, no child counter render
    expect(patchSpy).toHaveBeenCalledTimes(1);
  });

});
