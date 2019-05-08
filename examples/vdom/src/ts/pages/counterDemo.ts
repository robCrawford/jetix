import { component } from "jetix";
import counter from "../components/counter";
import themeMenu from "../components/themeMenu";
import { html } from "../lib/vdom";
const { div, h1, i, a } = html;


export default component(() => ({

    view() {
        return div([
            div(".intro", [
                themeMenu("#theme-menu"),
                a({attrs: {href: "/about" + location.search, "data-navigo": true}}, "About page"),
                h1("Counter demo"),
                div("Please open the developer console, where all component actions, state and renders are logged (when `debug` is in the query string)."),
                i("Note that `render()` doesn't update the DOM unless the VDOM has changed.")
            ]),
            counter("#counter-0", { start: 0 }),
            counter("#counter-1", { start: -1 })
        ]);
    }

}));
