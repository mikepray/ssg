import { StationState } from "../types";
import { factions } from "./factions";
import { stationModules } from "./stationModules";

export const baseStation = {
  stardate: 0,
  stationName: "",
  baseStation: "",
  location: "",
  crew: 0,
  morale: 0,
  power: 0,
  air: 0,
  food: 0,
  credits: 0,
  funding: 0,
  crewSalary: 0,
  daysWithoutFood: 0,
  daysSinceVesselSpawn: 0,
  belongsToFaction: "New Hague Merchants",
  factions: factions,
  stationModules: stationModules.filter(
    (mod) =>
      mod.name === "Command Module" ||
      mod.name === "Reactor" ||
      mod.name === "Crew Quarters" ||
      mod.name === "Battery Bank" ||
      mod.name === "Air Recycler"
  ),
  previouslyVisitedVesselNames: [],
  dockingPorts: 0,
  vessels: [],
  apply: function (props: Partial<StationState>): StationState {
    return { ...this, ...props };
  },
  applyToState: function (fn: (state: StationState) => Partial<StationState>): StationState {
    return { ...this, ...fn(this)};
  },
  applyToStateAsync: async function (fn: (state: StationState) => Promise<Partial<StationState>>): Promise<StationState> {
    return { ...this, ...await fn(this)};
  },
};
