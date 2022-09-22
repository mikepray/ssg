import { testingStationState } from "./data/testStartingState";
import { gameLoop } from "./game";

gameLoop(1, testingStationState, console.log);