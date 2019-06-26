import { component, html } from "../../../src/jetix";
import themeMenu from "../components/themeMenu";
const { div, h1, a } = html;


export default component(() => ({

    view() {
        return div([
            div(".intro", [
                themeMenu("#theme-menu"),
                a({attrs: {href: "/" + location.search, "data-navigo": true}}, "Counter page"),
                h1("About"),
                div("Lorem ipsum dolor sit amet.")
            ]),
        ]);
    }

}));
