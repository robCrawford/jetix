/*
  @flow
  These utils are imported for dev only
*/
let groupId = '';

const debugEnabled = /[&?]debug/.test(window.location.search);

export const log = ({
    noInitialAction(id: string, state: {}) {
        if (debugEnabled) {
            console.group(`%c#${id}`, "color: #69f");
            if (state) {
                console.log(`${JSON.stringify(state)}`);
            }
            groupId = id;
        }
    },
    updateStart(id: string, state: {}, label: string, data?: {}) {
        if (debugEnabled) {
            if (!groupId || groupId !== id) {
                console.group(`%c#${id}`, "color: #69f");
                if (state) {
                    console.log(`%c${JSON.stringify(state)}`, "text-decoration: line-through;");
                }
                groupId = id;
            }
            let msg = `${String(label)}`;
            if (data) {
                msg += ` ${JSON.stringify(data)}`;
            }
            console.log(`%c${msg}`, "color: #f6b");
        }
    },
    updateEnd(state: {}) {
        if (debugEnabled && state) {
            console.log(`${JSON.stringify(state)}`);
        }
    },
    taskPerform(label: string) {
        if (debugEnabled) {
            console.log(`%cTask "${label}" perform...`, "color: #dd8");
        }
    },
    taskSuccess(id: string, label: string) {
        if (debugEnabled) {
            console.log(`%c\n...#${id} task "${label}" success`, "color: #dd8");
        }
    },
    taskFailure(id: string, label: string, err: Error) {
        if (debugEnabled) {
            console.log(`%c\n...#${id} task "${label}" failure`, "color: #dd8");
            console.error(JSON.stringify(err));
        }
    },
    render(id: string, props: {}) {
        if (debugEnabled) {
            console.groupEnd();
            let msg = `⟳ Render #${id}`;
            if (props && Object.keys(props).length) {
                msg += `, props: ${JSON.stringify(props)}`;
            }
            console.log(`%c${msg}`, "color: #888");
            groupId = '';
        }
    },
    noRender(id: string) {
        if (debugEnabled) {
            console.groupEnd();
            let msg = `! No render - #${id} has no changes`;
            console.log(`%c${msg}`, "color: #888");
            groupId = '';
        }
    },
    manualActionError(id: string, actionName: string) {
        console.error(`Error: #${id} "${actionName}" cannot be invoked manually`);
    }
});

window.addEventListener('error', () => {
    setTimeout(() => {
        console.groupEnd();
        groupId = '';
    });
});
