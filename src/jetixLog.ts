/*
  Logging for Jetix lifecycle
*/
let groupId = '';

const logEnabled = /[&?]debug/.test(window.location.search);

export const log = ({
    noInitialAction(id: string, state: {}): void {
        if (logEnabled) {
            console.group(`%c#${id}`, "color: #69f");
            if (state) {
                console.log(`${JSON.stringify(state)}`);
            }
            groupId = id;
        }
    },
    updateStart(id: string, state: {}, label: string, data?: {}): void {
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
    updateEnd(state: {}): void {
        if (logEnabled && state) {
            console.log(`${JSON.stringify(state)}`);
        }
    },
    taskPerform(label: string, isPromise: boolean): void {
        if (logEnabled) {
            console.log(`%cTask "${label}" perform${isPromise ? '...': 'ed'}`, "color: #dd8");
        }
    },
    taskSuccess(id: string, label: string): void {
        if (logEnabled) {
            console.log(`%c\n...#${id} task "${label}" success`, "color: #dd8");
        }
    },
    taskFailure(id: string, label: string, err: Error): void {
        if (logEnabled) {
            console.log(`%c\n...#${id} task "${label}" failure`, "color: #dd8");
            console.error(JSON.stringify(err));
        }
    },
    render(id: string, props: {}): void {
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
    noRender(id: string): void {
        if (logEnabled) {
            console.groupEnd();
            let msg = `! No render - #${id} has no changes`;
            console.log(`%c${msg}`, "color: #888");
            groupId = '';
        }
    },
    manualError(id: string, name: string): void {
        throw Error(`#${id} "${name}" cannot be invoked manually`);
    }
});

window.addEventListener('error', (): void => {
    setTimeout((): void => {
        console.groupEnd();
        groupId = '';
    });
});
