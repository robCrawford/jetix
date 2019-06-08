import { initComponent } from "jetixTest";
import counter from "../../ts/components/counter";

describe("Counter component", function() {

    it("should increment counter and return 'Validate' for 'Increment' action", function() {
        const component = initComponent(counter, { start: 0 });
        const { state, next } = component.runAction("Increment", { step: 1 });

        expect(state.counter).toBe(1);
        expect(next.actionName).toBe("Validate");
        expect(next.data).toBe(undefined);
    });

    it("should decrement counter and return 'Validate' for 'Decrement' action", function() {
        const component = initComponent(counter, { start: 0 });
        const { state, next } = component.runAction("Decrement", { step: 1 });

        expect(state.counter).toBe(-1);
        expect(next.actionName).toBe("Validate");
        expect(next.data).toBe(undefined);
    });

    it("should return correct actions for 'Validate' action", function() {
        const component = initComponent(counter, { start: 0 });
        const initialState = component.initialState;

        const { state, next } = component.runAction("Validate");
        expect(JSON.stringify(state)).toEqual(JSON.stringify(initialState));

        expect(Array.isArray(next)).toBe(true);
        expect(next.length).toBe(2);

        // Action
        expect(next[0].actionName).toBe('SetFeedback');
        expect(next[0].data).toEqual({ text: "Validating..." });

        // Task
        expect(next[1].taskName).toBe('ValidateCount');
        expect(next[1].data).toEqual({ count: 0 });

        // Task result actions
        const validateCountSpec = component.getTask('ValidateCount', { count: 0 });
        const resolveAction = validateCountSpec.success('Success');
        const rejectAction = validateCountSpec.failure();

        expect(resolveAction.actionName).toBe('SetFeedback');
        expect(resolveAction.data).toEqual({ text: 'Success' });
        expect(rejectAction.actionName).toBe('SetFeedback');
        expect(rejectAction.data).toEqual({ text: 'Unavailable' });
    });

    it("should update state with no return action for 'SetFeedback' action", function() {
        const component = initComponent(counter, { start: 0 });
        const testStr = "test feedback";
        const { state, next } = component.runAction("SetFeedback", { text: testStr });

        expect(state.feedback).toBe(testStr);
        expect(next).toBe(undefined);
    });

});
