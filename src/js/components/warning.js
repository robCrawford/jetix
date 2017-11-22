/*
  @flow
  Warning component
*/
import type { Config } from "../lib/muv";
import { init } from "../lib/muv";
import { h } from "../lib/snabbdom";


type Props = {
    message: string;
};

type Model = {
    show: boolean;
};

type Msg =
    "Hide";


export default (props: Props) => init(
    ({
        initialModel: {
            show: true
        },

        update(model/*, action*/) {
            return {
                Hide: () => {
                    model.show = false;
                }
            };
        },

        view(model, action) {
            return h("div.warning",
                { class: { show: model.show } },
                [ props.message,
                    h('button',
                        { on: { click: action("Hide") } },
                        "OK")
                ]);
        }

    }: Config<Model, Msg>)
);
