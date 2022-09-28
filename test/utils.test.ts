import chalk from "chalk";
import tap from "tap";
import { testingStationState } from "../src/data/testStartingState";
import { vessels } from "../src/data/vessels";
import { printStationStatus } from "../src/game";
import { Log } from "../src/types";
import { addWithCeiling, addWithCeilingAndFloor, addWithFloor, getAssignedCrew, getUnassignedCrew, getVesselColor, progressBar, subtractWithFloor } from "../src/utils";


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

tap.test('testing add and subtract with floor and ceiling', t => {
    t.equal(subtractWithFloor(100, 5, 0), 95);
    t.equal(subtractWithFloor(0, 5, 0), 0);
    t.equal(subtractWithFloor(100, 5, 97), 97);

    t.equal(addWithCeiling(100, 5, 200), 105);
    t.equal(addWithCeiling(95, 20, 100), 100);

    t.equal(addWithFloor(5, -10, -20), -5);
    t.equal(addWithFloor(5, -10, 0), 0);

    t.equal(addWithCeilingAndFloor(5, 4, 0, 10), 9);
    t.equal(addWithCeilingAndFloor(5, 6, 0, 10), 10);
    t.equal(addWithCeilingAndFloor(5, -5, 0, 10), 0);
    t.end();
});