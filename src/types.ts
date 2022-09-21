import { Answers } from "prompts";

export interface StationState {
    stationName: string,
    baseStation: string,
    location: string,
    crew: number,
    morale: number,
    power: number,
    air: number,
    food: number,
    credits: number,
    daysWithoutFood: number,
    dockRings: DockRing[],
    vesselQueue: Vessel[],
    funding: number,
    crewSalary: number,
    stationModules: StationModule[],
    belongsToFaction: string,
    factions: Faction[],
}

export interface StationModule {
    name: string,
    description: string,
    /* resource cost per day. positive gains resource, negative spends resource */
    rarity: number, // 0 is extremely common, 1 is extremely rare, -1 is never
    power: number,
    air: number,
    food: number,
    credits: number,
    morale: number,
    crewRequired: number,
    crewApplied: number,
    powerStorage: number,
    airStorage: number,
    foodStorage: number,
    creditPurchaseCost: number,
}

export interface DockRing {
    vessel?: Vessel
}

export interface Vessel {
    name: string,
    class: string,
    faction: string,
    /* the amount of air, power, and food the vessel or its crew consumes or generates when docked with the station */
    generatesAir: number,
    generatesPower: number,
    generatesFood: number,
    /* the amount of air, power, or food the vessel has to trade. negative means the vessel wants a resource, positive means it will sell */
    tradesAir: number,
    tradesPower: number,
    tradesFood: number,
    /* the amount of credits a vessel will trade a resource for. negative means it is selling, positive it is buying */
    tradesAirForCredits: number,
    tradesPowerForCredits: number,
    tradesFoodForCredits: number,
    credits: number,
    morale: number, // the morale boost (or penalty) to the stations' crew while the vessel is docked
    queueTolerance: number, // the amount in days the vessel will tolerate staying in the docking queue before leaving the area
    dockingDaysRequested: number, // the number of days the vessel wants to stay docked
    /* the vessel's sensitivity to docking fees. 1 = fully elastic, 0 = inelastic. The more elastic, the less likely the vessel will
    be willing to dock with the station if it charges higher docking fees */
    dockingFeePriceElasticity: number, 
    timeInQueue: number, // Positive if the vessel is warping in, negative if it's warping out
}

export interface Faction {
    name: string,
    description: string,
    favor: number,
    hexColor: string,
}

export interface StartingOptions {
  stationName?: Answers<string>;
  baseStation?: Answers<string>;
  location?: Answers<string>;
}