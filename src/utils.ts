import { StationState } from "./types";

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