/*
  `https://github.com/krasimir/navigo`
*/
import Navigo from "navigo";
import { mount, subscribe } from "./lib/jetix";
import app from "./app";

const router = new Navigo();

document.addEventListener(
    "DOMContentLoaded",
    () => {
        mount(app, runRootAction => {
            // The `mount` callback provides `runRootAction` for binding events to root actions
            // (manually invoking an action is disallowed everywhere else)
            const pageSetter = (page: string): () => void => {
                return () => {
                    runRootAction("SetPage", { page });
                };
            };

            router
                .on({
                    "about": pageSetter("aboutPage"),
                    "*": pageSetter("counterDemo")
                })
                .resolve();

            subscribe("patch", () => {
                router.updatePageLinks();
            });
        });
    }
);
