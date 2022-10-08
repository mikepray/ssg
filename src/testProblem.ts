import prompts from "prompts";
import { problems } from "./data/problems";
import { stationModules } from "./data/stationModules";
import { testingStationState } from "./data/testStartingState";
import { doProblem } from "./menus/problemMenu";

prompts({
  type: "autocomplete",
  name: "value",
  message: "Choose a problem to test",
  choices: problems.map(({ name }) => {
    return { title: name, value: name };
  }),
}).then((input) => {
  const problem = problems.find(({ name }) => name === input.value);
  if (problem) {
    doProblem(
      testingStationState.foldAndCombine((station) => {
        const modulesToAdd = station.stationModules.concat(
          stationModules.filter((module) => 
          module.name === "MIE Shield")
        );
        return { stationModules: modulesToAdd, power: 9 };
      }),
      problem,
      console.log,
      console.clear
    );
  }
});
