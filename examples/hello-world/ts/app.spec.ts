import { testComponent } from "jetix";
import app, { State } from "./app";

describe("App", () => {

  const { action, task, config, initialState } = testComponent(app);

  it("should set initial state", () => {
    expect(initialState).toEqual({ message: "", ready: false });
  });

  it("should initialize", () => {
    expect(config.init).toEqual({
      name: "UpdateMessage",
      data: { message: "Hello World!" }
    });
  });

  it("should handle 'UpdateMessage' action", () => {
    const { state, next } = action<State>(
      "UpdateMessage",
      { message: "Hello World!"}
    );
    expect(state.message).toEqual("Hello World!");
    expect(Array.isArray(next)).toBe(false);

    if (!Array.isArray(next)) {
      expect(next.name).toBe("SetDocTitle");
      expect(next.data).toEqual({ title: "Hello World!" });
    }
  });

  it("should handle 'SetDocTitle' task", () => {
    const { perform, success, failure } = task("SetDocTitle", { title: "test" });
    expect(perform).toBeDefined;

    const successResult = success();
    expect(Array.isArray(successResult)).toBe(false);
    if (!Array.isArray(successResult)) {
      expect(successResult.name).toBe("UpdateStatus");
      expect(successResult.data).toEqual({ ready: true });
    }

    const failureResult = failure();
    expect(Array.isArray(failureResult)).toBe(false);
    if (!Array.isArray(failureResult)) {
      expect(failureResult.name).toBe("UpdateStatus");
      expect(failureResult.data).toEqual({ ready: false });
    }
  })

});
