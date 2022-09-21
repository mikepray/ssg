/* Station State for testing */

import { Vessel } from "../types";
import { factions } from "./factions";
import { stationModules } from "./stationModules";
import { vessels } from "./vessels";

export const testingStationState = {
  stationName: "DS-10",
  baseStation: "defense",
  location: "frontier",
  crew: 5,
  morale: 100,
  power: 100,
  air: 100,
  food: 100,
  credits: 1000,
  dockRings: [
    { vessel: vessels.find(vessel => vessel.name === 'Zeelandia') },
    { },
  ],
  vesselQueue: [],
  funding: 10,
  crewSalary: 2,
  daysWithoutFood: 0,
  belongsToFaction: "New Hague Merchants",
  factions: factions,
  stationModules: stationModules.filter(mod => 
    mod.name === 'Command Module' || mod.name === 'Reactor' || 
    mod.name === 'Crew Quarters'|| mod.name === 'Battery Bank' || 
    mod.name === 'Air Recycler')
};