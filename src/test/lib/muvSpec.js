import { init, main } from "../../js/lib/muv";
import * as snabbdom from "../../js/lib/snabbdom";

describe("Model, Update, View", function() {
    let patchCount, model, action;

    const view = (m, a) => {
        model = m;
        action = a;
    };

    beforeEach(function() {
        patchCount = 0;
        spyOn(snabbdom, "patch").and.callFake(() => patchCount++);
    });


    it("should call `patch` once following a chain of actions", function() {
        const numTestActions = 20;

        init({
            initialModel: {
                count: 0
            },
            update(model, action) {
                const handlers = {};

                for (let i = 1; i < numTestActions; i++) {
                    handlers["Increment" + i] =
                        () => {
                            model.count++;
                            return action("Increment" + (i+1));
                        };
                }
                handlers["Increment" + numTestActions] =
                    () => {model.count++;};

                return handlers;
            },
            view
        });

        expect(patchCount).toBe(0);
        expect(model.count).toBe(0);

        action("Increment1")();
        expect(model.count).toBe(numTestActions);
        expect(patchCount).toBe(1);
    });

    it("should call `patch` once following an array of actions", function() {
        const numTestActions = 20;

        init({
            initialModel: {
                count: 0
            },
            update(model, action) {
                const handlers = {};
                const incrementRetActions = [];

                for (let i = 1; i <= numTestActions; i++) {
                    handlers["Increment" + i] =
                        () => {
                            model.count++;
                        };
                    incrementRetActions.push(action("Increment" + i));
                }
                handlers["Increment"] =
                    () => incrementRetActions;

                return handlers;
            },
            view
        });

        expect(patchCount).toBe(0);
        expect(model.count).toBe(0);

        action("Increment")();
        expect(model.count).toBe(numTestActions);
        expect(patchCount).toBe(1);
    });

    it("should call `patch` once following an mix of action chains", function() {
        const numTestActions = 20;

        init({
            initialModel: {
                count: 0
            },
            update(model, action) {
                const handlers = {};
                const incrementRetActions = [];

                // "Increment1" - "Increment19" return single action
                for (let i = 1; i < numTestActions; i++) {
                    handlers["Increment" + i] =
                        () => {
                            model.count++;
                            return action("Increment" + (i+1));
                        };
                }
                handlers["Increment" + numTestActions] =
                    () => {model.count++;};

                // "IncrementA" returns array of actions
                for (let i = 1; i <= numTestActions; i++) {
                    handlers["IncrementA" + i] =
                        () => {
                            model.count++;
                            if (i % 2) {
                                return action("Increment1");
                            }
                        };
                    incrementRetActions.push(action("IncrementA" + i));
                }
                handlers["IncrementA"] =
                    () => incrementRetActions;

                return handlers;
            },
            view
        });

        expect(patchCount).toBe(0);
        expect(model.count).toBe(0);

        action("IncrementA")();
        expect(model.count).toBe(numTestActions + (numTestActions * numTestActions/2));
        expect(patchCount).toBe(1);
    });

});
