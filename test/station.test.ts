import prompts from "prompts";
import tap from "tap";
import { testingStationState } from "../src/data/testStartingState";
import { gameLoop } from "../src/game";
import { StationState } from "../src/types";

const newStationState = testingStationState
.fold({stationName: "updated"})
.foldAndCombine((state) => {
    return { ...state, credits: state.credits + 100 };
});

tap.equal(newStationState.stationName,
  "updated"
);

tap.equal(newStationState.credits, testingStationState.credits + 100);

// prove immutability
tap.equal(testingStationState.stationName, "DS-10");

// can wait

prompts.inject(['wait']);
gameLoop(testingStationState, console.log, console.clear).then((newState: StationState) =>{
  newState
})