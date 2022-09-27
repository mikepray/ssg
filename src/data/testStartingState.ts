import { StationState } from "../types";
import { baseStation } from "./station";
import { vessels } from "./vessels";

/* Station State for testing */

export const testingStationState: StationState = {
  ...baseStation,
  stationName: "DS-10",
  baseStation: "defense",
  location: "frontier",
  crew: 5,
  morale: 100,
  power: 100,
  air: 100,
  food: 100,
  credits: 1000,
  funding: 10,
  crewSalary: 2,
  belongsToFaction: "New Hague Merchants",
};