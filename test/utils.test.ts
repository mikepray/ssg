import chalk from "chalk";
import tap from "tap";
import { testingStationState } from "../src/data/testStartingState";
import { vessels } from "../src/data/vessels";
import { printStationStatus } from "../src/game";
import { Log } from "../src/types";
import { getAssignedCrew, getUnassignedCrew, getVesselColor, progressBar } from "../src/utils";


const stationState = testingStationState;
let logString = '';
printStationStatus(stationState, (str: string) => {
    logString += str;
}, console.clear)
tap.matchSnapshot(logString, 'stationStatusOutput');
tap.matchSnapshot(progressBar(10, 50, 100, chalk.white, chalk.black), 'progress bar 1');
tap.matchSnapshot(progressBar(4, 50, 100, chalk.white, chalk.black), 'progress bar 2');
tap.matchSnapshot(progressBar(100, 50, 100, chalk.white, chalk.black), 'progress bar 3');

tap.equal(getAssignedCrew(stationState), 5);
tap.equal(getUnassignedCrew(stationState), 0);

tap.equal(getVesselColor(undefined, stationState.factions), 'FFFFFF');
tap.equal(getVesselColor(vessels.find(vessel => vessel.name === 'Zeelandia'), stationState.factions), 'F5A623');
tap.equal(getVesselColor(vessels.find(vessel => vessel.name === 'NoSuchShip'), stationState.factions), 'FFFFFF');