import { StationModule } from "../types";

export const baseModule: StationModule = {
    name: "Prototype Module",
    description: "Module defaults",
    rarity: -1,
    power: 0,
    air: 0,
    food: 0,
    credits: 0,
    morale: 0,
    crewRequired: 0,
    crewApplied: 0,
    powerStorage: 0,
    airStorage: 0,
    foodStorage: 0,
    creditPurchaseCost: -1,
    dockingPorts: 0,
    fold: function (props: Partial<StationModule>): StationModule {
      return { ...this, ...props };
    },
    foldAndCombine: function (fn: (state: StationModule) => Partial<StationModule>): StationModule {
      return { ...this, ...fn(this)};
    },
    foldAndCombineAsync: function (fn: (state: StationModule) => Partial<StationModule>): StationModule {
      return { ...this, ...fn(this)};
    },
}

export const stationModules: StationModule[] = [
    {
      ...baseModule,
      name: "Command Module",
      description: "The command center of the station",
      rarity: -1,
      power: -2,
      crewRequired: 3,
      crewApplied: 3,
      powerStorage: 20,
      airStorage: 20,
      foodStorage: 20,
      creditPurchaseCost: -1,
      dockingPorts: 2,
    },
    {
      ...baseModule,
      name: "Reactor",
      description: "Fusion reactor",
      rarity: .3,
      power: 10,
      crewRequired: 2,
      crewApplied: 2,
      creditPurchaseCost: 10000,
    },
    {
      ...baseModule,
      name: "Crew Quarters",
      description: "Barracks, mess hall, gravity ring, food and air storage",
      power: -5,
      rarity: .3,
      morale: 2,
      airStorage: 100,
      foodStorage: 100,
      creditPurchaseCost: 5000,
    },
    {
      ...baseModule,
      name: "Battery Bank",
      description: "Batteries",
      power: 0,
      rarity: .3,
      powerStorage: 100,
      creditPurchaseCost: 2000,
    },
    {
      ...baseModule,
      name: "Air Recycler",
      description: "Recycles air",
      power: -3,
      rarity: .3,
      air: 5,
      creditPurchaseCost: 2000,
    },
  ];