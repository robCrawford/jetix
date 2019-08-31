import { component, html, rootTask, Config, VNode } from "../../../src/jetix";
import themeMenu from "../components/themeMenu";
const { div, h1, a } = html;


export default component((): Config => ({

  init: rootTask("SetDocTitle", { title: "About" }),

  view(id): VNode {
    return div(`#${id}`,
      div(".intro", [
        themeMenu("#theme-menu"),
        a({attrs: {href: "/counter" + location.search, "data-navigo": true}}, "Counter page"),
        h1("About"),
        div("Lorem ipsum dolor sit amet.")
      ])
    );
  }

}));
