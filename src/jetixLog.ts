/*
  Logging for Jetix lifecycle
*/
let groupId = '';

const logEnabled = /[&?]debug/.test(window.location.search);

export const log = ({
    noInitialAction(id: string, state: {}) {
        if (logEnabled) {
            console.group(`%c#${id}`, "color: #69f");
            if (state) {
                console.log(`${JSON.stringify(state)}`);
            }
            groupId = id;
        }
    },
    updateStart(id: string, state: {}, label: string, data?: {}) {
        if (logEnabled) {
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
        if (logEnabled && state) {
            console.log(`${JSON.stringify(state)}`);
        }
    },
    taskPerform(label: string) {
        if (logEnabled) {
            console.log(`%cTask "${label}" perform...`, "color: #dd8");
        }
    },
    taskSuccess(id: string, label: string) {
        if (logEnabled) {
            console.log(`%c\n...#${id} task "${label}" success`, "color: #dd8");
        }
    },
    taskFailure(id: string, label: string, err: Error) {
        if (logEnabled) {
            console.log(`%c\n...#${id} task "${label}" failure`, "color: #dd8");
            console.error(JSON.stringify(err));
        }
    },
    render(id: string, props: {}) {
        if (logEnabled) {
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
        if (logEnabled) {
            console.groupEnd();
            let msg = `! No render - #${id} has no changes`;
            console.log(`%c${msg}`, "color: #888");
            groupId = '';
        }
    },
    manualError(id: string, name: string) {
        console.error(`Error: #${id} "${name}" cannot be invoked manually`);
    }
});

window.addEventListener('error', () => {
    setTimeout(() => {
        console.groupEnd();
        groupId = '';
    });
});
