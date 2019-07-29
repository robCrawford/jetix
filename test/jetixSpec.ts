import { renderComponent, _setTestKey } from "../src/jetix";
import * as vdom from "../src/vdom";

const testKey = _setTestKey({});

describe("Jetix", function() {
    let patchCount, state, action;
    let componentId = 0;
    const getId = () => `_${componentId++}`;

    function view(id, { props, state: curState }) {
        state = curState;
        return {} as vdom.VNode;
    }

    beforeEach(function() {
        patchCount = 0;
        spyOn(vdom, "patch").and.callFake(() => {
            patchCount++;
        });
    });

    it("should render once following a chain of actions", function() {
        const numTestActions = 20;

        renderComponent<{}, {count: number}, any, any>(getId(), {}, a => {
            action = a;
            const actions = {};

            for (let i = 1; i < numTestActions; i++) {
                actions["Increment" + i] =
                    (_, { props, state }) => {
                        return {
                            state: { ...state, count: state.count + 1 }, next: action("Increment" + (i+1))
                        };
                    };
            }
            actions["Increment" + numTestActions] =
                (_, { props, state }) => {
                    return {
                        state: { ...state, count: state.count + 1 }
                    };
                };

            return {
                state: () => ({ count: 0 }),
                actions,
                view
            };
        });

        expect(patchCount).toBe(0);
        action("Increment1")(testKey);
        logResult(state.count, patchCount);
        expect(state.count).toBe(numTestActions);
        expect(patchCount).toBe(1);
    });

    it("should render once following an array of actions", function() {
        const numTestActions = 20;

        renderComponent<{}, {count: number}, any, any>(getId(), {}, a => {
            action = a;
            const actions = {};
            const incrementRetActions = [];

            for (let i = 1; i <= numTestActions; i++) {
                actions["Increment" + i] =
                    (_, { props, state }) => {
                        return {
                            state: { ...state, count: state.count + 1 }
                        };
                    };
                incrementRetActions.push(action("Increment" + i));
            }
            actions["Increment"] =
                (_, { props, state }) => ({ state, next: incrementRetActions });

            return {
                state: () => ({ count: 0 }),
                actions,
                view
            };
        });

        expect(patchCount).toBe(0);
        action("Increment")(testKey);
        logResult(state.count, patchCount);
        expect(state.count).toBe(numTestActions);
        expect(patchCount).toBe(1);
    });

    it("should render twice when a chain of actions contains a promise", function(done) {
        const numTestActions = 20;
        runActionsWithPromise(numTestActions, 2, done);
        expect(patchCount).toBe(0);
        action("Increment1")(testKey);
    });

    it("should render once when initial action chain contains a promise", function(done) {
        const numTestActions = 20;
        runActionsWithPromise(numTestActions, 1, done, "Increment1"); // 1 render after promise
        expect(patchCount).toBe(0); // No render after init
    });

    function runActionsWithPromise(numTestActions, expectedPatchCount, done, initialAction?) {
        renderComponent<{}, {count: number}, any, any>(getId(), {}, (a, task) => {
            action = a;
            const actions = {};

            for (let i = 1; i < numTestActions; i++) {
                actions["Increment" + i] =
                    (_, { props, state }) => {
                        return {
                            state: { ...state, count: state.count + 1 },
                            next: action("Increment" + (i+1))
                        };
                    };
            }
            actions["Increment" + numTestActions] =
                (_, { props, state }) => {
                    const newState = { ...state, count: state.count + 1 };
                    setTimeout(() => {
                        // After last action has been processed
                        logResult(newState.count, patchCount);
                        expect(newState.count).toBe(numTestActions);
                        expect(patchCount).toBe(expectedPatchCount);
                        done();
                    });
                    return {
                        state: newState
                    };
                };

            // Overwrite middle action with task
            const midIndex = numTestActions/2;
            actions["Increment" + midIndex] =
                (_, { props, state }) => {
                    return {
                        state: { ...state, count: state.count + 1 },
                        next: task("TestAsync")
                    };
                };

            return {
                state: () => ({ count: 0 }),
                init: initialAction ? a(initialAction) : undefined,
                actions,
                tasks: {
                    TestAsync: () => ({
                        perform: () => new Promise(resolve => setTimeout(() => resolve(), 100)),
                        success: () => action("Increment" + (midIndex + 1))
                    })
                },
                view
            };
        });
    }

    it("should render twice when a promise returns an array of actions", function(done) {
        renderComponent<{}, {count: number}, {
            "Increment2": null;
            "Increment3": null;
        }, any>(getId(), {}, (a, task) => {
            action = a;

            return {
                state: () => ({ count: 0 }),
                actions: {
                    Increment1: (_, { props, state }) => {
                        return {
                            state: { ...state, count: state.count + 1 },
                            next: task("TestAsync")
                        };
                    },
                    Increment2: (_, { props, state }) => {
                        return {
                            state: { ...state, count: state.count + 1 }
                        };
                    },
                    Increment3: (_, { props, state }) => {
                        const newState = { ...state, count: state.count + 1 };
                        setTimeout(() => {
                            // After last action has been processed
                            logResult(newState.count, patchCount);
                            expect(newState.count).toBe(3);
                            expect(patchCount).toBe(2);
                            done();
                        });
                        return {
                            state: newState
                        };
                    }
                },
                tasks: {
                    "TestAsync": () => ({
                        perform: () => new Promise(resolve => setTimeout(() => resolve(), 100)),
                        success: () => [ action("Increment2"), action("Increment3") ]
                    })
                },
                view
            };
        });

        expect(patchCount).toBe(0);
        action("Increment1")(testKey);
    });

    it("should render once following a mix of action arrays and chains", function() {
        const numTestActions = 20; // Must be even due to `i % 2`

        expect(patchCount).toBe(0);
        runMixedActions(numTestActions);
        action("IncrementA2-Init")(testKey);

        logResult(state.count, patchCount);
        expect(state.count).toBe(
            getMixedActionsIncr(numTestActions)
        );
        expect(patchCount).toBe(1);
    });

    it("should not render when initial action is a mix of arrays and chains", function() {
        const numTestActions = 20; // Must be even due to `i % 2`

        expect(patchCount).toBe(0);
        runMixedActions(numTestActions, "IncrementA2-Init");

        logResult(state.count, patchCount);
        expect(state.count).toBe(
            getMixedActionsIncr(numTestActions)
        );
        expect(patchCount).toBe(0);
    });

    function runMixedActions(numTestActions, initialAction?) {
        renderComponent<{}, {count: number}, any, any>(getId(), {}, a => {
            action = a;
            const actions = {};
            const actionsArray1 = [];
            const actionsArray2 = [];

            // Array of single increment actions that return nothing
            for (let i = 1; i <= numTestActions; i++) {
                actions["IncrementA1-" + i] =
                    (_, { props, state }) => {
                        return {
                            state: { ...state, count: state.count + 1 }
                        };
                    };
                actionsArray1.push(action("IncrementA1-" + i));
            }
            // Series of increment actions "IncrementS1-1" - "IncrementS1-19"
            for (let i = 1; i < numTestActions; i++) {
                actions["IncrementS1-" + i] =
                    (_, { props, state }) => {
                        return {
                            state: { ...state, count: state.count + 1 },
                            next: action("IncrementS1-" + (i+1))
                        };
                    };
            }
            actions["IncrementS1-" + numTestActions] =
                (_, { props, state }) => {
                    // "IncrementS1-20" returns `actionsArray1` array
                    return {
                        state: { ...state, count: state.count + 1 },
                        next: actionsArray1
                    };
                };
            // Series of increment actions "IncrementS2-1" - "IncrementS2-10"
            for (let i = 1; i < numTestActions/2; i++) {
                actions["IncrementS2-" + i] =
                    (_, { props, state }) => {
                        return {
                            state: { ...state, count: state.count + 1 },
                            next: action("IncrementS2-" + (i+1))
                        };
                    };
            }
            actions["IncrementS2-" + numTestActions/2] =
                (_, { props, state }) => {
                    return { state: { ...state, count: state.count + 1 } };
                };

            // "IncrementA2-Init" returns `actionsArray2` array
            for (let i = 1; i <= numTestActions; i++) {
                actions["IncrementA2-" + i] =
                    (_, { props, state }) => {
                        // Half return chain "IncrementS1-1" - "IncrementS1-20",
                        // where "IncrementS1-20" returns `actionsArray1`
                        if (i % 2) {
                            return { state: { ...state, count: state.count + 1 }, next: action("IncrementS1-1") };
                        }
                        // Half return chain "IncrementS2-1" - "IncrementS2-10"
                        else {
                            return { state: { ...state, count: state.count + 1 }, next: action("IncrementS2-1") };
                        }
                    };
                actionsArray2.push(action("IncrementA2-" + i));
            }
            actions["IncrementA2-Init"] =
                (_, { props, state }) => ({ state, next: actionsArray2 });

            return {
                state: () => ({ count: 0 }),
                init: initialAction ? a(initialAction) : undefined,
                actions,
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
