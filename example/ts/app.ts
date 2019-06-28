import { component, html } from "../../src/jetix";
import counterPage from "./pages/counterPage";
import aboutPage from "./pages/aboutPage";
import "./router";
const { div } = html;

type Props = {};

export type State = {
    theme: Theme;
    page?: Page;
};

export type RootActions = {
    "SetPage": { page: Page };
    "SetTheme": { theme: Theme };
};

export type Page = "counterPage" | "aboutPage";

export type Theme = "default" | "dark";


export default component<Props, State, RootActions>(action => ({

    state: () => ({
        theme: "default",
        page: null
    }),

    actions: {
        SetPage: ({ page }, props, state) => {
            state.page = page;
            return { state };
        },
        SetTheme: ({ theme }, props, state) => {
            state.theme = theme;
            return { state };
        }
    },

    view(id, props, state) {
        return div(`.page.${state.theme}`,
            (() => {
                switch (state.page) {

                    case "aboutPage":
                        return aboutPage(
                            "#about-page",
                            { onSetTheme: action("SetTheme") }
                        );

                    case "counterPage":
                        return counterPage(
                            "#counter-page",
                            { onSetTheme: action("SetTheme") }
                        );
                }
            })()
        );
    }

}));
