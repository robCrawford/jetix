import { testComponent, NextData } from "jetix";
import counterPage from "./counterPage";

describe("Counter Page component", () => {
  const { config } = testComponent(counterPage);

  it("should run initial action", () => {
    expect(config.init).toEqual({ name: "SetDocTitle", data: { title: "Counter" } });
  });

});
