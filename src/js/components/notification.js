/*
  @flow
  Notification component
*/
import type { Config, Action } from "../lib/muv";
import { component } from "../lib/muv";
import { h } from "../lib/vdom";


type Props = {|
    +text: string;
    +dismissAction: () => void;
|};

type Model = {|
    show: boolean;
|};

type Msg =
    "Dismiss";


export default component((action: Action<Msg>, props: Props) => ({

    initialModel: {
        show: true
    },

    initialAction: undefined,

    update: {
        Dismiss: model => {
            model.show = false;
            return props.dismissAction;
        }
    },

    view(id: string, props: Props, model: Model) {
        return h("div.notification",
            { class: { show: model.show && props.text.length } },
            [ props.text,
                h('button',
                    { on: { click: action("Dismiss") } },
                    "Dismiss")
            ]);
    }

}: Config<Model, Msg>));
