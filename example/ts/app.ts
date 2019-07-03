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

export type RootTasks = {
    "SetDocTitle": { title: string };
}

export type Page = "counterPage" | "aboutPage";

export type Theme = "default" | "dark";


export default component<Props, State, RootActions, RootTasks>((action, task) => ({

    state: () => ({
        theme: "default",
        page: null
    }),

    // Root actions, import into any component
    actions: {
        SetPage: ({ page }, props, state) => {
            return {
                state: {
                    ...state,
                    page
                }
            };
        },
        SetTheme: ({ theme }, props, state) => {
            return {
                state: {
                    ...state,
                    theme
                }
            };
        }
    },

    // Root tasks, import into any component
    tasks: {
        // Demonstrates a task that is only an effect
        SetDocTitle: ({ title }) => ({
            perform: async () => document.title = title
        })
    },

    view(id, props, state) {
        return div(`.page.${state.theme}`, [
            (() => {
                switch (state.page) {

                    case "aboutPage":
                        return div('.about-layout', [
                            aboutPage( "#about-page", { onSetTheme: action("SetTheme") })
                        ]);

                    case "counterPage":
                        return div('.counter-layout', [
                            counterPage( "#counter-page", { onSetTheme: action("SetTheme") })
                        ]);
                }
            })()
        ]);
    }

}));
