import { initComponent } from "../../src/jetixTest";
import counter from "../ts/components/counter";

describe("Counter component", function() {

    it("should increment counter and return 'Validate' for 'Increment' action", function() {
        const { runAction } = initComponent(counter, { start: 0 });
        const { state, next } = runAction("Increment", { step: 1 });

        expect(state.counter).toBe(1);
        expect(next.name).toBe("Validate");
        expect(next.data).toBe(undefined);
    });

    it("should decrement counter and return 'Validate' for 'Decrement' action", function() {
        const { runAction } = initComponent(counter, { start: 0 });
        const { state, next } = runAction("Decrement", { step: 1 });

        expect(state.counter).toBe(-1);
        expect(next.name).toBe("Validate");
        expect(next.data).toBe(undefined);
    });

    it("should return correct actions for 'Validate' action", function() {
        const { initialState, runAction, getTask } = initComponent(counter, { start: 0 });

        const { state, next } = runAction("Validate");
        expect(JSON.stringify(state)).toEqual(JSON.stringify(initialState));

        expect(Array.isArray(next)).toBe(true);
        expect(next.length).toBe(2);

        // Action
        expect(next[0].name).toBe('SetFeedback');
        expect(next[0].data).toEqual({ text: "Validating..." });

        // Task
        expect(next[1].name).toBe('ValidateCount');
        expect(next[1].data).toEqual({ count: 0 });

        // Task result actions
        const { success, failure } = getTask('ValidateCount', { count: 0 });

        let { name, data } = success('Test');
        expect(name).toBe('SetFeedback');
        expect(data).toEqual({ text: 'Test' });

        ({ name, data } = failure());
        expect(name).toBe('SetFeedback');
        expect(data).toEqual({ text: 'Unavailable' });
    });

    it("should update state with no return action for 'SetFeedback' action", function() {
        const { runAction } = initComponent(counter, { start: 0 });
        const testStr = "test feedback";
        const { state, next } = runAction("SetFeedback", { text: testStr });

        expect(state.feedback).toBe(testStr);
        expect(next).toBe(undefined);
    });

});
