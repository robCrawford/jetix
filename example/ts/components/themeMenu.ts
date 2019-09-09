import { component, rootAction, html, Config, VNode } from "jetix";
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
      div('#note', "Add `debug` to the query string to activate state & render logging.")
    ]);
  }

}));
