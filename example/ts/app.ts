import { component, html, Config, VNode, TaskSpec } from "jetix";
import counterPage from "./pages/counterPage";
import aboutPage from "./pages/aboutPage";
import "./router";
const { div } = html;

export type RootProps = Readonly<{}>;

export type RootState = Readonly<{
  theme: Theme;
  page?: Page;
}>;

export type RootActions = Readonly<{
  SetPage: { page: Page };
  SetTheme: { theme: Theme };
}>;

export type RootTasks = Readonly<{
  SetDocTitle: { title: string };
}>;

export type Page = "counterPage" | "aboutPage";

export type Theme = "default" | "dark";


export default component<RootProps, RootState, RootActions, RootTasks>(
  (action, task): Config<RootProps, RootState, RootActions, RootTasks> => ({

    state: (): RootState => ({
      theme: "default",
      page: null
    }),

    // Root actions, import into any component
    actions: {
      SetPage: ({ page }, { state }): { state: RootState } => {
        return {
          state: {
            ...state,
            page
          }
        };
      },
      SetTheme: ({ theme }, { state }): { state: RootState } => {
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
      SetDocTitle: ({ title }): TaskSpec<RootProps, RootState> => ({
        perform: (): void => {
          document.title = title;
        }
      })
    },

    view(id, { state }): VNode {
      return div(`#${id}.page.${state.theme}`,
        ((): VNode => {
          switch (state.page) {
            case "aboutPage":
              return aboutPage("#about-page", { onSetTheme: action("SetTheme") });

            case "counterPage":
              return counterPage("#counter-page", { onSetTheme: action("SetTheme") });
          }
        })()
      );
    }

  })
);
