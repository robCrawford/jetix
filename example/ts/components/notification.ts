import { ActionThunk, component, html } from "../../../src/jetix";
const { div, button } = html;

type Props = {
    readonly text: string;
    readonly onDismiss: ActionThunk;
};

type State = {
    show: boolean;
};

type Actions = {
    "Dismiss": null;
}

export default component<Props, State, Actions>(action => ({

    state: () => ({
        show: true
    }),

    actions: {
        Dismiss: (_, { props, state }) => {
            return {
                state: {
                    ...state,
                    show: false
                },
                next: props.onDismiss
            };
        }
    },

    view(id, { props, state }) {
        return div(`#${id}.notification`, {
            class: {
                show: state.show && props.text.length
            }
        }, [
            props.text,
            button({ on: { click: action("Dismiss") } }, "Dismiss")
        ]);
    }

}));
