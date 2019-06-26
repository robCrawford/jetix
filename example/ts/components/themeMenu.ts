import { component, rootAction, html } from "../../../src/jetix";
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
