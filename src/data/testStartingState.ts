/* Station State for testing */

import { StationState, Vessel } from "../types";
import { factions } from "./factions";
import { stationModules } from "./stationModules";
import { vessels } from "./vessels";

export const testingStationState: StationState = {
  stationName: "DS-10",
  baseStation: "defense",
  location: "frontier",
  stardate: 1,
  crew: 5,
  morale: 100,
  power: 100,
  air: 100,
  food: 100,
  credits: 1000,
  dockRings: [
    { vessel: vessels.find(vessel => vessel.name === 'Zeelandia') },
    { },
    // { vessel: vessels.find(vessel => vessel.name === 'Overijssel') },
  ],
  vesselQueue: [],
  funding: 10,
  crewSalary: 2,
  daysWithoutFood: 0,
  daysSinceVesselSpawn: 0,
  belongsToFaction: "New Hague Merchants",
  factions: factions,
  stationModules: stationModules.filter(mod => 
    mod.name === 'Command Module' || mod.name === 'Reactor' || 
    mod.name === 'Crew Quarters'|| mod.name === 'Battery Bank' || 
    mod.name === 'Air Recycler'),
  previouslyVisitedVesselNames: [],
};