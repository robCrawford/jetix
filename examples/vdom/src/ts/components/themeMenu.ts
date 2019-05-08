import { component, rootAction } from "jetix";
import { html } from "../lib/vdom";
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
