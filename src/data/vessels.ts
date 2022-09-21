import { Vessel } from "../types";

export const vessels: Vessel[] = [
    {
        name: "Big Fred",
        class: "Space Truck",
        faction: "Space Freighter Union",
        generatesAir: 0,
        generatesPower: 0,
        generatesFood: 0,
        tradesAir: 0,
        tradesPower: -20,
        tradesFood: 100,
        tradesAirForCredits: 0,
        tradesPowerForCredits: 10,
        tradesFoodForCredits: 5,
        credits: 200,
        morale: 1,
        queueTolerance: 2,
        dockingDaysRequested: 3,
        dockingFeePriceElasticity: .5,
        timeInQueue: 0,
    },
    {
        name: "Zeelandia",
        class: "Space Station Crew Transport",
        faction: "New Hague Merchants",
        generatesAir: 0,
        generatesPower: 1,
        generatesFood: 0,
        tradesAir: 0,
        tradesPower: 0,
        tradesFood: 0,
        credits: 0,
        tradesAirForCredits: 0,
        tradesPowerForCredits: 0,
        tradesFoodForCredits: 0,
        morale: 0,
        queueTolerance: 1,
        dockingDaysRequested: 5,
        dockingFeePriceElasticity: 0.5,
        timeInQueue: 0,
      },
];