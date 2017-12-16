import { init, main } from "../../js/lib/muv";
import * as vdom from "../../js/lib/vdom";

describe("Model, Update, View", function() {
    let patchCount, model, action;

    function view(m) {
        model = m;
    }

    beforeEach(function() {
        patchCount = 0;
        spyOn(vdom, "patch").and.callFake(() => {
            patchCount++;
        });
    });

    it("should render once following a chain of actions", function() {
        const numTestActions = 20;

        init(a => {
            action = a;

            return {
                initialModel: {
                    count: 0
                },
                update(model) {
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
            };
        });

        expect(patchCount).toBe(0);
        action("Increment1")();
        logResult(model.count, patchCount);
        expect(model.count).toBe(numTestActions);
        expect(patchCount).toBe(1);
    });

    it("should render once following an array of actions", function() {
        const numTestActions = 20;

        init(a => {
            action = a;

            return {
                initialModel: {
                    count: 0
                },
                update(model) {
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
            };
        });

        expect(patchCount).toBe(0);
        action("Increment")();
        logResult(model.count, patchCount);
        expect(model.count).toBe(numTestActions);
        expect(patchCount).toBe(1);
    });

    it("should render twice when a chain of actions contains a promise", function(done) {
        const numTestActions = 20;
        runActionsWithPromise(numTestActions, 2, done);
        expect(patchCount).toBe(0);
        action("Increment1")();
    });

    it("should render once when initial action chain contains a promise", function(done) {
        const numTestActions = 20;
        runActionsWithPromise(numTestActions, 1, done, "Increment1"); // 1 render after promise
        expect(patchCount).toBe(0); // No render after initialAction
    });

    function runActionsWithPromise(numTestActions, expectedPatchCount, done, initialAction) {
        init(a => {
            action = a;

            return {
                initialModel: {
                    count: 0
                },
                initialAction: initialAction ? a(initialAction) : undefined,
                update(model) {
                    const handlers = {};

                    for (let i = 1; i < numTestActions; i++) {
                        handlers["Increment" + i] =
                            () => {
                                model.count++;
                                return action("Increment" + (i+1));
                            };
                    }
                    handlers["Increment" + numTestActions] =
                        () => {
                            model.count++;
                            setTimeout(() => {
                                // After last action has been processed
                                logResult(model.count, patchCount);
                                expect(model.count).toBe(numTestActions);
                                expect(patchCount).toBe(expectedPatchCount);
                                done();
                            });
                        };

                    // Overwrite middle action with promise
                    const midIndex = numTestActions/2;
                    handlers["Increment" + midIndex] =
                        () => {
                            model.count++;
                            return new Promise(resolve => setTimeout(() => resolve(), 100))
                                .then(() => action("Increment" + (midIndex + 1)));
                        };

                    return handlers;
                },
                view
            };
        });
    }

    it("should render twice when a promise returns an array of actions", function(done) {
        init(a => {
            action = a;

            return {
                initialModel: {
                    count: 0
                },
                update(model) {
                    return {
                        Increment1: () => {
                            model.count++;
                            return new Promise(resolve => setTimeout(() => resolve(), 100))
                                .then(() => [ action("Increment2"), action("Increment3") ]);
                        },
                        Increment2: () => {
                            model.count++;
                        },
                        Increment3: () => {
                            model.count++;
                            setTimeout(() => {
                                // After last action has been processed
                                logResult(model.count, patchCount);
                                expect(model.count).toBe(3);
                                expect(patchCount).toBe(2);
                                done();
                            });
                        }
                    }
                },
                view
            };
        });

        expect(patchCount).toBe(0);
        action("Increment1")();
    });

    it("should render once following a mix of action arrays and chains", function() {
        const numTestActions = 20; // Must be even due to `i % 2`

        expect(patchCount).toBe(0);
        runMixedActions(numTestActions);
        action("IncrementA2-Init")();

        logResult(model.count, patchCount);
        expect(model.count).toBe(
            getMixedActionsIncr(numTestActions)
        );
        expect(patchCount).toBe(1);
    });

    it("should not render when initial action is a mix of arrays and chains", function() {
        const numTestActions = 20; // Must be even due to `i % 2`

        expect(patchCount).toBe(0);
        runMixedActions(numTestActions, "IncrementA2-Init");

        logResult(model.count, patchCount);
        expect(model.count).toBe(
            getMixedActionsIncr(numTestActions)
        );
        expect(patchCount).toBe(0);
    });

    function runMixedActions(numTestActions, initialAction) {
        init(a => {
            action = a;

            return {
                initialModel: {
                    count: 0
                },
                initialAction: initialAction ? a(initialAction) : undefined,
                update(model) {
                    const handlers = {};
                    const actionsArray1 = [];
                    const actionsArray2 = [];

                    // Array of single increment actions that return nothing
                    for (let i = 1; i <= numTestActions; i++) {
                        handlers["IncrementA1-" + i] =
                            () => {
                                model.count++;
                            };
                        actionsArray1.push(action("IncrementA1-" + i));
                    }
                    // Series of increment actions "IncrementS1-1" - "IncrementS1-19"
                    for (let i = 1; i < numTestActions; i++) {
                        handlers["IncrementS1-" + i] =
                            () => {
                                model.count++;
                                return action("IncrementS1-" + (i+1));
                            };
                    }
                    handlers["IncrementS1-" + numTestActions] =
                        () => {
                            // "IncrementS1-20" returns `actionsArray1` array
                            model.count++;
                            return actionsArray1;
                        };
                    // Series of increment actions "IncrementS2-1" - "IncrementS2-10"
                    for (let i = 1; i < numTestActions/2; i++) {
                        handlers["IncrementS2-" + i] =
                            () => {
                                model.count++;
                                return action("IncrementS2-" + (i+1));
                            };
                    }
                    handlers["IncrementS2-" + numTestActions/2] =
                        () => {
                            model.count++;
                        };

                    // "IncrementA2-Init" returns `actionsArray2` array
                    for (let i = 1; i <= numTestActions; i++) {
                        handlers["IncrementA2-" + i] =
                            () => {
                                model.count++;
                                // Half return chain "IncrementS1-1" - "IncrementS1-20",
                                // where "IncrementS1-20" returns `actionsArray1`
                                if (i % 2) {
                                    return action("IncrementS1-1");
                                }
                                // Half return chain "IncrementS2-1" - "IncrementS2-10"
                                else {
                                    return action("IncrementS2-1");
                                }
                            };
                        actionsArray2.push(action("IncrementA2-" + i));
                    }
                    handlers["IncrementA2-Init"] =
                        () => actionsArray2;

                    return handlers;
                },
                view
            };
        });
    }

    function getMixedActionsIncr(numTestActions) {
        const array1Incr = numTestActions;
        const series1Incr = numTestActions + array1Incr;
        const series2Incr = numTestActions/2;
        const array2Incr = numTestActions + (numTestActions/2 * series1Incr) + (numTestActions/2 * series2Incr);
        return array2Incr;
    }

    function logResult(numActions, numRenders) {
        console.log('Completed ' + numActions + ' actions with '
            + numRenders + ' render' + (numRenders === 1 ? '' : 's'));
    }

});
