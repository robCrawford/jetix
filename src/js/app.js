/* @flow */
import { main } from "./lib/muv";
import { h } from "./lib/snabbdom";
import counter from "./components/counter";


main(
    h("div.container", [
        counter({ start: 0 }),
        counter({ start: 2 })
    ])
);
