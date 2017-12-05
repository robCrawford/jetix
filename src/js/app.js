/* @flow */
import { main } from "./lib/muv";
import { h } from "./lib/vdom";
import counter from "./components/counter";


main(
    h("div.container", [
        counter({ start: 0 }),
        counter({ start: 2 })
    ])
);
