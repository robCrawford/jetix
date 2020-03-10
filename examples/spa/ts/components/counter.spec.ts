import { testComponent } from "jetix";
import counter, { State } from "./counter";

const isArray = Array.isArray;

describe("Counter component", function(): void {

  it("should increment counter and return 'Validate' for 'Increment' action", function(): void {
    const { action } = testComponent(counter, { start: 0 });
    const { state, next } = action<State>("Increment", { step: 1 });
    expect(isArray(next)).toBe(false);

    if (!isArray(next)) {
      expect(state.counter).toBe(1);
      expect(next.name).toBe("Validate");
      expect(next.data).toBe(undefined);
    }
  });

  it("should decrement counter and return 'Validate' for 'Decrement' action", function(): void {
    const { action } = testComponent(counter, { start: 0 });
    const { state, next } = action<State>("Decrement", { step: 1 });
    expect(isArray(next)).toBe(false);

    if (!isArray(next)) {
      expect(state.counter).toBe(-1);
      expect(next.name).toBe("Validate");
      expect(next.data).toBe(undefined);
    }
  });

  it("should return correct actions for 'Validate' action", function(): void {
    const { initialState, action, task } = testComponent(counter, { start: 0 });

    const { state, next } = action<State>("Validate");
    expect(JSON.stringify(state)).toEqual(JSON.stringify(initialState));
    expect(isArray(next)).toBe(true);

    if (isArray(next)) {
      expect(isArray(next)).toBe(true);
      expect(next.length).toBe(2);

      // Action
      expect(next[0].name).toBe("SetFeedback");
      expect(next[0].data).toEqual({ text: "Validating..." });

      // Task
      expect(next[1].name).toBe("ValidateCount");
      expect(next[1].data).toEqual({ count: 0 });

      // Task result actions
      const { success, failure } = task("ValidateCount", { count: 0 });

      const successResult = success({ text: "Success test" }, {});
      expect(isArray(successResult)).toBe(false);

      if (!isArray(successResult)) {
        let { name, data } = successResult;
        expect(name).toBe("SetFeedback");
        expect(data).toEqual({ text: "Success test" });

        const failureResult = failure("", {});
        expect(isArray(failureResult)).toBe(false);

        if (!isArray(failureResult)) {
          ({ name, data } = failureResult);
          expect(name).toBe('SetFeedback');
          expect(data).toEqual({ text: 'Unavailable' });
        }
      }
    }
  });

  it("should update state with no return action for 'SetFeedback' action", function(): void {
    const { action } = testComponent(counter, { start: 0 });
    const testStr = "test feedback";
    const { state, next } = action<State>("SetFeedback", { text: testStr });

    expect(state.feedback).toBe(testStr);
    expect(next).toBe(undefined);
  });

});
