import prompts from "prompts";
import tap from "tap";
import { stationModules } from "../src/data/stationModules";
import { testingStationState } from "../src/data/testStartingState";
import { baseVessel, vessels } from "../src/data/vessels";
import { gameLoop } from "../src/game";
import { noOp, StationState, VesselDockingStatus } from "../src/types";
import { getUnassignedCrew, getAssignedCrew } from "../src/utils";

tap.test("testing fold and foldAndCombine", (t) => {
  const newStationState = testingStationState
    .fold({ stationName: "updated" })
    .foldAndCombine((state) => {
      return { ...state, credits: state.credits + 100 };
    });

  t.equal(newStationState.stationName, "updated");

  t.equal(newStationState.credits, testingStationState.credits + 100);

  // prove immutability
  t.equal(testingStationState.stationName, "DS-10");

  t.end();
});

tap.test("testing credits reduced by crew salary", (t) => {
  prompts.inject(["wait"]);
  gameLoop(
    testingStationState.fold({ funding: 0 }),
    noOp,
    noOp,
  ).then((newState: StationState) => {
    t.equal(
      newState.credits,
      975,
      "Test that credits is reduced per crew by salary"
    );
    t.end();
  });
});

tap.test("test that funding is increased", (t) => {
  prompts.inject(["wait"]);
  gameLoop(
    testingStationState.fold({ funding: 10, crewSalary: 0 }),
    noOp,
    noOp,
  ).then((newState: StationState) => {
    t.equal(newState.credits, 1000 + 10, "Test that funding is increased");
    t.end();
  });
});

tap.equal(
  testingStationState.fold({ credits: 0 }).foldAndCombine((station) => {
    return station.credits <= 0 ? { morale: station.morale - 2 } : station;
  }).morale,
  98,
  "some message"
);

tap.test("Test that crew dies without air", t => {
  // crew dies with no air
  prompts.inject(["wait"]);
  gameLoop(
    testingStationState.fold({ air: 0 }),
    noOp,
    noOp,
  ).then((newState: StationState) => {
    t.equal(newState.crew, 4);
    t.equal(getUnassignedCrew(newState) + getAssignedCrew(newState), newState.crew);
    t.end();
  });
})

// morale reduced when no credits to pay crew.
// important - need to disable modules, since testing command module increases morale

// wait
tap.test("Test that resources are reduced every game loop", (t) => {
  prompts.inject(["wait"]);
  gameLoop(
    testingStationState,
    noOp,
    noOp,
  ).then((newState: StationState) => {
    t.equal(newState.stardate, 1);
    t.equal(newState.air, 100);
    t.equal(newState.power, 100);
    t.equal(newState.food, 85, "Crew should consume 3 food per turn");
    t.end();
  });
});

tap.test("Test that crew dies without food for several days", t => {

  // crew dies with no food after several days
  prompts.inject(["wait"]);
  gameLoop(
    testingStationState.fold({ food: 0, daysWithoutFood: 7 }),
    noOp,
    noOp,
  ).then((newState: StationState) => {
    // console.log(newState);
    t.equal(newState.stardate, 1);
    t.equal(newState.crew, 4);
    t.equal(newState.food, 0);
    t.equal(getUnassignedCrew(newState) + getAssignedCrew(newState), newState.crew);
    t.end();
  });
})

tap.test("Test that crew does not die without food for several days", t => {

  // crew dies with no food after several days
  prompts.inject(["wait"]);
  gameLoop(
    testingStationState.fold({ food: 0, daysWithoutFood: 3 }),
    noOp,
    noOp,
  ).then((newState: StationState) => {
    // console.log(newState);
    t.equal(newState.stardate, 1);
    t.equal(newState.crew, 5);
    t.equal(newState.food, 0);
    t.equal(getUnassignedCrew(newState) + getAssignedCrew(newState), newState.crew);
    t.end();
  });
})

tap.test("Test game over", t => {
  // game over
  prompts.inject(["wait"]);
  t.rejects(
    gameLoop(
      testingStationState.fold({ crew: 0 }),
      noOp,
      noOp,
    ).then((newState: StationState) => {})
    );
    t.end();
})
