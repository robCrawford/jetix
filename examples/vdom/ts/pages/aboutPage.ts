import { component } from "jetix";
import { html } from "../lib/vdom";
import themeMenu from "../components/themeMenu";
const { div, h1, a } = html;


export default component(() => ({

    view() {
        return div([
            div(".intro", [
                themeMenu("#theme-menu"),
                a({attrs: {href: "/" + location.search, "data-navigo": true}}, "Counter demo"),
                h1("About"),
                div("Lorem ipsum dolor sit amet.")
            ]),
        ]);
    }

}));
