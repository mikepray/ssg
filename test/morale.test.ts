import prompts from "prompts";
import tap from "tap";
import { testingStationState } from "../src/data/testStartingState";
import { vessels } from "../src/data/vessels";
import { addMorale, gameLoop, reduceMorale } from "../src/game";
import { StationState, VesselDockingStatus } from "../src/types";
import { getAssignedCrew, getUnassignedCrew, logWithCeiling } from "../src/utils";

tap.test("Morale should be reduced according to food rationing", async (t) => {
    t.equal(reduceMorale(testingStationState.fold({crewFoodRation: 3})).morale, 99, "morale should be reduced by one per turn");
    t.equal(reduceMorale(testingStationState.fold({crewFoodRation: 2})).morale, 96, "morale should be reduced if food ration is 2");
    t.equal(reduceMorale(testingStationState.fold({crewFoodRation: 1})).morale, 93, "morale should be reduced if food ration is 1");
    t.equal(reduceMorale(testingStationState.fold({crewFoodRation: 0})).morale, 90, "morale should be reduced if food ration is 0");
    t.end();
})

tap.test("Morale should be reduced according to air", async (t) => {
    t.equal(reduceMorale(testingStationState.fold({air: 0})).morale, 0, "Morale should be zero when there's no air");
    t.end();
})

tap.test("Morale should be reduced according to crew salary", async (t) => {
    t.equal(reduceMorale(testingStationState.fold({crewSalary: 5})).morale, 99, "Morale should not be reduced if salary is at 5");
    t.equal(reduceMorale(testingStationState.fold({crewSalary: 4})).morale, 98, "Morale should be reduced for every value under 5");
    t.equal(reduceMorale(testingStationState.fold({crewSalary: 0})).morale, 94, "Morale should be reduced for every value under 5");  
    t.end();
})

tap.test("testing morale with no food", (t) => {
    prompts.inject(["wait"]);
    gameLoop(
      testingStationState.fold({ food: 0, stationModules: [], morale: 50 }),
      () => {},
      () => {}
    ).then((newState: StationState) => {
      t.equal(newState.morale, 29, "Test that morale is reduced with no food");
      t.end();
    });
  });

tap.test("Morale should be increased according to food rationing", async (t) => {
    t.equal(addMorale(testingStationState.fold({crewFoodRation: 4, morale: 0})).morale, 4, "Morale should increase by some amount as food ration goes up");
    t.equal(addMorale(testingStationState.fold({crewFoodRation: 5, morale: 0})).morale, 5, "Morale should increase by some amount as food ration goes up");
    t.equal(addMorale(testingStationState.fold({crewFoodRation: 10, morale: 0})).morale, 6, "Morale should increase by some amount as food ration goes up");
    t.end();
})

tap.test("Morale should be increased according to crew salary", async (t) => {
    t.equal(addMorale(testingStationState.fold({crewSalary: 6, morale: 0})).morale, 6, "Salary: 6 - Morale should increase by some amount as crew salary goes up");
    t.equal(addMorale(testingStationState.fold({crewSalary: 7, morale: 0})).morale, 7, "Salary: 7 - Morale should increase by some amount as crew salary goes up");    
    t.equal(addMorale(testingStationState.fold({crewSalary: 10, morale: 0})).morale, 10, "Salary: 10 - Morale should increase by some amount as crew salary goes up");    
    t.equal(addMorale(testingStationState.fold({crewSalary: 20, morale: 0})).morale, 15, "Salary: 20 - Morale should increase by some amount as crew salary goes up");    
    t.equal(addMorale(testingStationState.fold({crewSalary: 10, morale: 0, credits: 0})).morale, 0, "Morale should not increase by crew salary if there are no credits to pay the crew");    

    t.end();
});

tap.test("Crew should leave the station when morale is low enough", (t) => {
  const vessel = vessels.find(({ name }) => name === "Big Fred");
  if (vessel) {
    prompts.inject(["wait"]);
    gameLoop(
      testingStationState.fold({ morale: 0,
        vessels: [
        vessel.fold({
          dockingStatus: VesselDockingStatus.Docked,
          dockingDaysRequested: 0,
        }),
      ], }),
      () => {},
      () => {}
    ).then((newState: StationState) => {
      t.equal(newState.crew, 4, "Test that crew leave when morale is low enough and a docked vessel leaves");
      t.equal(getUnassignedCrew(newState) + getAssignedCrew(newState), newState.crew);
      t.end();
    });
  } else {
    t.fail();
  }
});