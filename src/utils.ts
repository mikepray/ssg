import chalk from "chalk";
import { log } from "console";
import { Faction, StationState, Vessel } from "./types";

export function calculateStorageCeilings(stationState: StationState) {
    // iterate through station modules to determine storage ceilings
    let airStorageCeiling = 0;
    let powerStorageCeiling = 0;
    let foodStorageCeiling = 0;
    stationState.stationModules.forEach(module => {
        airStorageCeiling += module.airStorage;
        powerStorageCeiling += module.powerStorage;
        foodStorageCeiling += module.foodStorage;
    });
    return {
        airStorageCeiling: airStorageCeiling,
        powerStorageCeiling: powerStorageCeiling,
        foodStorageCeiling: foodStorageCeiling
    }
}

export function subtractWithFloor(n:number, i:number, floor:number) {
    if (n - i < floor) {
        n = floor;
    } else {
        n -= i;
    }
    return n;
}

export function addWithCeiling(n:number, i:number, ceiling:number) {
    if (n + i > ceiling) {
        n = ceiling;
    } else {
        n += i;
    }
    return n;
}

export function addWithFloor(n:number, i:number, floor:number) {
    if (n + i < floor) {
        n = floor;
    } else {
        n += i;
    }
    return n;
}

export function addWithCeilingAndFloor(n:number, i:number, floor:number, ceiling:number) {
    if (n + i > ceiling ) {
        n = ceiling;
    } else if (n + i < floor) {
        n = floor;
    } else {
        n += i;
    }
    return n;
}

export function progressBar(stops:number, value:number, max:number, filled:chalk.Chalk, unfilled:chalk.Chalk) {
    let string = '[';
    const filledTo = stops * value / max;
    for (let i = 0; i < stops; i++) {
        if (i < filledTo) {
            string += filled(' ');
        } else {
            string += unfilled(' ');
        }
    }
    string += ']';
    return string;
}

export function getVesselColor(vessel: Vessel | undefined, factions: Faction[]): string {
    const vesselFaction = factions.find(faction => faction.name === vessel?.faction);
    return vesselFaction !== undefined ? vesselFaction.hexColor : 'FFFFFF';
}

export function printTable(moduleTable: string[][]): any {
    moduleTable.forEach(row => {
        let cells = '';
        for(let i = 0; i < row.length; i++) {
            cells = cells + row[i] + ' | ';
        }   
        log(cells);
    });
}

export function getUnassignedCrew(stationState: StationState) {
    return stationState.crew - getAssignedCrew(stationState);
}

export function getAssignedCrew(stationState: StationState) {
    let crewAssigned = 0;
    stationState.stationModules.forEach(module => {
        crewAssigned += module.crewApplied;
    })
    return crewAssigned;
}

export function d100() {
    return Math.floor(Math.random() * 100) + 1;
}

export function d20() {
    return Math.floor(Math.random() * 20) + 1;
}

export function dN(n: number) {
    return Math.floor(Math.random() * n) + 1;
}