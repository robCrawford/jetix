import Navigo from "navigo";
import { mount, subscribe, RunAction } from "./lib/jetix";
import app, { RootActionName } from "./app";

const router = new Navigo();

document.addEventListener("DOMContentLoaded", () => mount({
    app,
    props: {},
    init: (runRootAction: RunAction<RootActionName>) => {
        // Manually invoking an action is an error, so `runRootAction` is provided
        // by `mount` for wiring up events to root actions (e.g. routing)
        router
            .on({
                "about": () => runRootAction("SetPage", { page: "aboutPage" }),
                "*": () => runRootAction("SetPage", { page: "counterDemo" })
            })
            .resolve();

        subscribe("patch", () => router.updatePageLinks());
    }
}));
