import prompts, { Answers } from "prompts";

export type StationState = {
    stationName: string,
    baseStation: string,
    location: string,
    stardate: number,
    crew: number,
    morale: number,
    power: number,
    air: number,
    food: number,
    credits: number,
    daysWithoutFood: number,
    daysSinceVesselSpawn: number,
    vessels: Vessel[],
    funding: number,
    crewFoodRation: number,
    crewSalary: number,
    stationModules: StationModule[],
    belongsToFaction: string,
    factions: Faction[],
    previouslyVisitedVesselNames: {
        name: string,
        stardateSinceLastVisited: number,
    }[],
    previouslySolvedProblems: {
        name: string,
        stardateSinceLastSolved: number,
    }[],
    problemSequencesInProgress: {
        name: string,
        indexOfLastSequenceSolved: number,
    }[],
    dockingFee: number,
    fold: (stationState: Partial<StationState>) => StationState,
    foldAndCombine: (combine: (stationState: StationState) => Partial<StationState>) => StationState,
    foldAndCombineAsync: (combine: (stationState: StationState) => Promise<Partial<StationState>>) => Promise<StationState>,
}

export type StationModule = {
    name: string,
    description: string,
    /* resource cost per day. positive gains resource, negative spends resource */
    rarity: number, // -1 is never, 0 is extremely common, 20 is extremely rare
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
    dockingPorts: number,
    vesselAttraction: number,
    mutateStation: StationMutation,
    fold: (stationModule: Partial<StationModule>) => StationModule,
    foldAndCombine: (combine: (stationModule: StationModule) => Partial<StationModule>) => StationModule,
    foldAndCombineAsync:(combine: (stationModule: StationModule) => Partial<StationModule>) => StationModule,
}

export type StationMutation = (stationState: StationState) => Partial<StationState>;

export type DockRing = {
    vessel?: Vessel
}

export type Vessel = {
    name: string,
    class: string,
    faction: string,
    /* the amount of air, power, and food the vessel or its crew consumes or generates when docked with the station */
    generatesMorale: number, // the morale boost (or penalty) to the stations' crew while the vessel is docked
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
    crewForHire: number,
    crewHireFee: number,
    modulesForSale: {
        creditPrice: number,
        module: StationModule,
    }[],
    credits: number,
    queueTolerance: number, // the amount in days the vessel will tolerate staying in the docking queue before leaving the area
    dockingDaysRequested: number, // the number of days the vessel wants to stay docked. Also used to track how long a vessel has been docked. when zero, vessel will depart
    /* the vessel's sensitivity to docking fees. n = the maximum docking fee a vessel will pay to dock at the station  */
    dockingFeePriceTolerance: number, 
    timeInQueue: number, 
    rarity: number, // -1 is never, 1 is extremely common, 20 is very rare
    respawnWait: number, // -1 will never come back, otherwise the number of days the vessel will be away before it has a chance to respawn
    dockingStatus: VesselDockingStatus | undefined, 
    mutateStation: StationMutation,
    fold: (vessel: Partial<Vessel>) => Vessel,
    foldAndCombine: (combine: (vessel: Vessel) => Partial<Vessel>) => Vessel,
    foldAndCombineAsync: (combine: (vessel: Vessel) => Partial<Vessel>) => Vessel,
}

export enum VesselDockingStatus {
    WarpingIn,
    NearbyWaitingToDock,
    NearbyWaitingToLeave,
    Docked,
    WarpingOut,
}
    
export type Faction = {
    name: string,
    description: string,
    favor: number, // -1 means the player cannot gain or lose favor with this faction (e.g., unaligned, aliens)
    hexColor: string,
}

export type ProblemNarrative = { 
    name: string,
    rarity: number,
    respawnWait: number, // the number of days that must pass before this problem can be reencountered, 
    // or before the next problem in the sequence can be encountered
    narrativeSequence: {
        narrative: string,
        activationPredicate: (stationState: StationState) => boolean,
        questions: (stationState: StationState) => prompts.PromptObject<string>,
        results: ProblemResult[],
    }[],
}

export type ProblemResult = {
    answer: string,
    mutateStation: (station: StationState) => { narrative: string, mutateStation: Partial<StationState> }
}

export type StartingOptions = {
  stationName?: Answers<string>;
  baseStation?: Answers<string>;
  location?: Answers<string>;
}

export type Log = (input: string) => void;