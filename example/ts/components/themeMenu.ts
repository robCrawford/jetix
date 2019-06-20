import { component, rootAction } from "../../../src/jetix";
import { html } from "../../../src/vdom";
const { div, button } = html;


export default component(() => ({

    view() {
        return div(".theme-menu", [
            button(
                { on: { click: rootAction("SetTheme", { theme: "light" }) } },
                "Light theme"),
            button(
                { on: { click: rootAction("SetTheme", { theme: "dark" }) } },
                "Dark theme")
        ]);
    }

}));
