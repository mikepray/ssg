import tap from "tap";
import { testingStationState } from "../src/data/testStartingState";

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
