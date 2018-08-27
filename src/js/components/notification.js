/*
  @flow
  Notification component
*/
import type { Config } from "../lib/muv";
import { init } from "../lib/muv";
import { h } from "../lib/vdom";


type Props = {|
    +text: string;
    +dismissAction: () => void;
|};

type Model = {|
    show: boolean;
|};

type Msg =
    "Hide";


export default (id: string, props: Props) =>

    init(id, action => ({

        initialModel: {
            show: true
        },

        initialAction: undefined,

        update: {
            Hide: model => {
                model.show = false;
                return props.dismissAction;
            }
        },

        view(model) {
            return h("div.notification",
                { class: { show: model.show } },
                [ props.text,
                    h('button',
                        { on: { click: action("Hide") } },
                        "OK")
                ]);
        }

    }: Config<Model, Msg>)
);
