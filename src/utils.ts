import chalk from "chalk";
import { log } from "console";
import { baseModule } from "./data/stationModules";
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
        return floor;
    }
    return n - i;
}

export function addWithCeiling(n:number, i:number, ceiling:number) {
    if (n + i > ceiling) {
       return ceiling;
    } 
    return n + i;
}

export function addWithFloor(n:number, i:number, floor:number) {
    if (n + i < floor) {
        return floor;
    }
    return n + i;
}

export function addWithCeilingAndFloor(n:number, i:number, floor:number, ceiling:number) {
    if (n + i > ceiling ) {
        return ceiling;
    } else if (n + i < floor) {
        return floor;
    }
    return n + i;    
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

export function printTable(moduleTable: string[][]): void {
    moduleTable.forEach(row => {
        let cells = '';
        for(let i = 0; i < row.length; i++) {
            cells = cells + row[i] + ' | ';
        }   
        log(cells);
    });
}

export function isCommandModuleOperational(stationState: StationState) {
    const commandModule = stationState.stationModules.find(({name}) => name === "Command Module");
    return commandModule && commandModule?.crewApplied >= commandModule?.crewRequired;
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

export function getStationDockingPorts(stationState: StationState) {
    return stationState.stationModules.reduce((previousValue, module) => {
        return {
            ...previousValue,
            dockingPorts: previousValue.dockingPorts + module.dockingPorts
        }
    },{...baseModule}).dockingPorts;
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

export function logWithCeiling(x: number, limit?: number, ramp?: number) {
    if (!limit) {
        limit = 10;
    }
    if (!ramp) {
        ramp = 1;
    }

    // effectively a logarithmic function with a limit
    // higher the ramp, the slower the increase in the multiplier

    // ramp should be within 1 and 10. values higher than 10 require very high x to hit the limit
    // ramp value of less than 1 will hit the limit very quickly
    // example values: 
    // 5 = getMultiplier(1, 10, 1);
    // 7.5 = getMultiplier(3, 10, 1);
    // 9.096 = getMultiplier(10, 10, 1);

    // example values: 
    // .9 = getMultiplier(1, 10, 10);
    // 2.308 = getMultiplier(3, 10, 10);
    // 5 = getMultiplier(10, 10, 10);
    return ((x - 1) * limit) / (x + ramp)
}