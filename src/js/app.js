/*
  @flow
  Root component
*/
import type { Config } from "./lib/muv";
import { init } from "./lib/muv";
import { h } from "./lib/vdom";
import counter from "./components/counter";


type Model = {};

type Msg = "";


export default () =>

    init(action => ({

        initialModel: {},

        initialAction: undefined,

        update: {},

        view(model) {
            return h("div.page", [
                counter({ start: 0 }),
                counter({ start: -1 })
            ]);
        }

    }: Config<Model, Msg>)
);
