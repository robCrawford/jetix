import { ActionThunk, component } from "../../../src/jetix";
import { html } from "../../../src/vdom";
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


export default component<State, Props, Actions>(action => ({

    state: () => ({
        show: true
    }),

    actions: {
        Dismiss: (_, state: State, props: Props) => {
            state.show = false;
            return {
                state,
                next: props.onDismiss
            };
        }
    },

    view(id: string, state: State, props: Props) {
        return div(".notification", {
            class: {
                show: state.show && props.text.length
            }
        }, [
            props.text,
            button({ on: { click: action("Dismiss") } }, "Dismiss")
        ]);
    }

}));
