import { component, rootAction, html, Config, VNode } from "../../../src/jetix";
const { div, button } = html;


export default component((): Config => ({

  view(id): VNode {
    return div(`#${id}`, [
      button(
        { on: { click: rootAction("SetTheme", { theme: "light" }) } },
        "Light theme"),
      button(
        { on: { click: rootAction("SetTheme", { theme: "dark" }) } },
        "Dark theme"),
      div('.note', "NOTE: Adding `debug` to the query string logs all state activity and renders.")
    ]);
  }

}));
