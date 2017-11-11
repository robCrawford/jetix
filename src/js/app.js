/* @flow */
import { add } from "./lib/muv";
import counter from "./components/counter";


document.addEventListener("DOMContentLoaded", () => {
    add(counter("counter1"));
    add(counter("counter2"));
});
