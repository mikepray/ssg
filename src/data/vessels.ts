import { StationState, Vessel, VesselDockingStatus } from "../types";
import { baseModule } from "./stationModules";

export const baseVessel: Vessel = {
    name: "Base Vessel",
    class: "Default Vessel",
    faction: "Unaligned",
    generatesAir: 0,
    generatesPower: 0,
    generatesFood: 0,
    tradesAir: 0,
    tradesPower: 0,
    tradesFood: 0,
    tradesAirForCredits: 0,
    tradesPowerForCredits: 0,
    tradesFoodForCredits: 0,
    credits: 0,
    generatesMorale: 0,
    queueTolerance: 0,
    dockingDaysRequested: 0,
    dockingFeePriceTolerance: 0,
    timeInQueue: 0,
    rarity: -1,
    respawnWait: 11,
    modulesForSale: [ ],
    crewForHire: 0,
    crewHireFee: 0,
    dockingStatus: undefined,
    mutateStation: function(stationState: Partial<StationState>): Partial<StationState> {
        return stationState;
    },
    fold: function (props: Partial<Vessel>): Vessel {
        return { ...this, ...props };
    },
    foldAndCombine: function (fn: (state: Vessel) => Partial<Vessel>): Vessel {
        return { ...this, ...fn(this)};
    },
    foldAndCombineAsync: function (fn: (state: Vessel) => Partial<Vessel>): Vessel {
        return { ...this, ...fn(this)};
    },
}

export const vessels: Vessel[] = [
    {
        ...baseVessel,
        name: "Big Fred",
        class: "Space Truck",
        faction: "Space Freighter Union",
        tradesPower: -20,
        tradesFood: 100,
        tradesPowerForCredits: 10,
        tradesFoodForCredits: 5,
        credits: 200,
        generatesMorale: 1,
        queueTolerance: 2,
        dockingDaysRequested: 3,
        dockingFeePriceTolerance: 10,
        rarity: 1,
        respawnWait: 5,
    },
    {
        ...baseVessel,
        name: "Zeelandia",
        class: "Space Station Crew Transport",
        faction: "New Hague Merchants",
        generatesPower: 1,
        queueTolerance: 1,
        dockingDaysRequested: 5,
        dockingFeePriceTolerance: 9,

      },
      {
        ...baseVessel,
        name: "Agnes",
        class: "Space Truck",
        faction: "Space Freighter Union",
       
        tradesPower: -20,
        tradesFood: 100,
       
        tradesPowerForCredits: 10,
        tradesFoodForCredits: 5,
        credits: 200,
        generatesMorale: 1,
        queueTolerance: 2,
        dockingDaysRequested: 3,
        dockingFeePriceTolerance: 10,
        timeInQueue: 0,
        rarity: -1,
        respawnWait: 5,
    },
    {
        ...baseVessel,
        name: "Ned",
        class: "Space Truck",
        faction: "Space Freighter Union",
       
        tradesPower: -20,
        tradesFood: 100,
       
        tradesPowerForCredits: 10,
        tradesFoodForCredits: 5,
        credits: 200,
        generatesMorale: 1,
        queueTolerance: 2,
        dockingDaysRequested: 3,
        dockingFeePriceTolerance: 10,
        timeInQueue: 0,
        rarity: 1,
        respawnWait: 5,
    },
    {
        ...baseVessel,
        name: "Alfonso",
        class: "Space Truck",
        faction: "Space Freighter Union",
       
        tradesPower: -20,
        tradesFood: 100,
        tradesAirForCredits: 0,
        tradesPowerForCredits: 10,
        tradesFoodForCredits: 5,
        credits: 200,
        generatesMorale: 1,
        queueTolerance: 2,
        dockingDaysRequested: 3,
        dockingFeePriceTolerance: 10,
        timeInQueue: 0,
        rarity: 1,
        respawnWait: 5,
    },
    {
        ...baseVessel,
        name: "Zierikzee",
        class: "Amsterdam Merchant",
        faction: "New Hague Merchants",
        
        tradesPower: -30,
        tradesFood: 300,
        tradesAirForCredits: 0,
        tradesPowerForCredits: 10,
        tradesFoodForCredits: 5,
        credits: 200,
        generatesMorale: 1,
        queueTolerance: 2,
        dockingDaysRequested: 3,
        dockingFeePriceTolerance: 8,
        timeInQueue: 0,
        rarity: 5,
    },
    {
        ...baseVessel,
        name: "Leiden",
        class: "Amsterdam Merchant",
        faction: "New Hague Merchants",
        
        tradesPower: -30,
        tradesPowerForCredits: 10,
        crewForHire: 1,
        crewHireFee: 100,
        generatesMorale: 1,
        queueTolerance: 2,
        dockingDaysRequested: 3,
        dockingFeePriceTolerance: 8,
        timeInQueue: 0,
        rarity: 5,
    },
    {
        ...baseVessel,
        name: "Overijssel",
        class: "Amsterdam Merchant",
        faction: "New Hague Merchants",
        generatesAir: 0,
        generatesPower: 0,
        generatesFood: 0,
        tradesAir: 500,
        tradesPower: -30,
        tradesFood: 0,
        tradesAirForCredits: 10,
        tradesPowerForCredits: 10,
        tradesFoodForCredits: 5,
        credits: 500,
        generatesMorale: 1,
        queueTolerance: 2,
        dockingDaysRequested: 5,
        dockingFeePriceTolerance: 8,
        timeInQueue: 0,
        rarity: 5,
    },
    {
        ...baseVessel,
        name: "???",
        class: "Unknown Alien",
        faction: "Elythorum Cabal",
        generatesAir: 0,
        generatesPower: 0,
        generatesFood: 0,
        tradesAir: 0,
        tradesPower: 0,
        tradesFood: 0,
        tradesAirForCredits: 0,
        tradesPowerForCredits: 0,
        tradesFoodForCredits: 0,
        credits: 0,
        generatesMorale: 0,
        queueTolerance: 2,
        dockingDaysRequested: -1,
        dockingFeePriceTolerance: 0,
        timeInQueue: 0,
        rarity: 18,
        respawnWait: -1,
    },
];