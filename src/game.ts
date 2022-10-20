import prompts, { Answers } from "prompts";
import chalk from "chalk";
import { Log, StationModule, StationMutation, StationState, Vessel, VesselDockingStatus } from "./types";
import { addWithCeiling, addWithCeilingAndFloor, addWithFloor, calculateStorageCeilings, logWithCeiling as logWithCeiling, getStationDockingPorts, getUnassignedCrew, getVesselColor, isCommandModuleOperational, progressBar, subtractWithFloor } from "./utils";
import { assignCrewMenu } from "./menus/assignCrewMenu";
import { dockingMenu } from "./menus/dockingMenu";
import { moduleMenu } from "./menus/moduleMenu";
import { vesselsNearbyMenu } from "./menus/vesselsNearbyMenu";
import { baseVessel, vessels } from "./data/vessels";
import { baseModule } from "./data/stationModules";
import { problemMenu } from "./menus/problemMenu";
import { problems } from "./data/problems";
import { policyMenu } from "./menus/policyMenu";
import { isModuleNamespaceObject } from "util/types";
import { baseStation } from "./data/station";
import { d100, d20, dN } from "./dice";
import { diffieHellman } from "crypto";

export async function gameLoop(stationState: StationState, log: Log, clear: () => void): Promise<StationState> {
    if (stationState.crew === 0) {
        return Promise.reject('Game')
    }
    printStationStatus(stationState, log, clear);
    const ceilings = calculateStorageCeilings(stationState);
    
    // wait for input
    const input = await prompts({
        type: "select",
        name: "value",
        message: "Main Menu",
        warn: "Command Module is not operational!",
        choices: [
            {
                title: "Wait",
                description: "Let the station run",
                value: "wait"
            },
            {
                title: "Docked Vessels",
                description: "Manage docked vessels",
                value: "docking",
                disabled: !isCommandModuleOperational(stationState)
            },
            {
                title: "Nearby Vessels",
                description: "Examine nearby vessels passing or waiting to dock",
                value: "vessels",
                disabled: !isCommandModuleOperational(stationState),
            },
            {
                title: "Assign Crew",
                description: "Assign station crew to modules",
                value: "crew"
            },
            {
                title: "Station Policies",
                description: "Set station policies",
                value: "policy"
            },
            {
                title: "List Modules",
                description: "Examine, repair, build station modules",
                value: "modules"
            },
            {
                title: "Quit",
                description: "Quit",
                value: "quit"
            },
        ],
        initial: 0
    });
    if (input.value === 'quit') {
        return Promise.reject('Player Quit');
    }
    if (input.value === 'modules') {
        clear();
        stationState = await moduleMenu(stationState, log, clear);
    } else if (input.value === 'docking') {
        stationState = await dockingMenu(stationState, log, clear);
    } else if (input.value === 'vessels') {
        await vesselsNearbyMenu(stationState, clear);
    } else if (input.value === 'crew') {
        stationState = await assignCrewMenu(stationState, clear);
    } else if (input.value === 'policy') {
        stationState = await policyMenu(stationState, log, clear);
    } else if (input.value === 'wait') {
        stationState = stationState
          .foldAndCombine(incrementStardate)
          .foldAndCombine(addFunding)
          .foldAndCombine(spendResourcesPerCrew)
          .foldAndCombine(reduceMorale)
          .foldAndCombine(addMorale)
          .foldAndCombine((station) => {
            if (station.daysWithoutFood > 5) {
                // if it's been too long without food, reduce crew!
                const red = reduceModuleCrew(
                    station.foldAndCombine(({crew}) => { return { crew: crew - 1} }),
                    station.stationModules.find(({crewApplied}) => crewApplied > 0)
                );
                return red;
            }
            return station;
          })
          // if there's no credits, reduce morale
          .foldAndCombine((station) =>
            station.credits <= 0
              ? { morale: subtractWithFloor(station.morale, station.crew * 2, 0) }
              : station
          )
          // if there's no air, reduce crew!
          .foldAndCombine((station) => {
            if (station.air <= 0) {
                return reduceModuleCrew(
                    station.foldAndCombine(({crew}) => { return { crew: crew - 1 } }),
                    station.stationModules.find(({crewApplied}) => crewApplied > 0)
                  )
            } 
            return station;
            })
          .foldAndCombine((station) => {
            const reducedModuleResources = station.stationModules.reduce((previousValue, module) => {
                // reduce the modules' resource generation/consumption
                if (module.crewApplied >= module.crewRequired && station.power + module.power >= 0) {
                    return {
                        ...baseModule,
                        power: previousValue.power + module.power,
                        air: previousValue.air + module.air,
                        food: previousValue.food + module.food,
                        morale: previousValue.morale + module.morale,
                        credits: previousValue.credits + module.credits,
                    };
                } 
                return previousValue;
            }, baseModule);
            return {
                // apply the reduced values to the station
                power: addWithCeilingAndFloor(station.power, reducedModuleResources.power, 0, ceilings.powerStorageCeiling),
                air: addWithCeilingAndFloor(station.air, reducedModuleResources.air, 0, ceilings.airStorageCeiling),
                food: addWithCeilingAndFloor(station.food, reducedModuleResources.food, 0, ceilings.foodStorageCeiling),
                morale: addWithCeilingAndFloor(station.morale, reducedModuleResources.morale, 0, 100),
                credits: addWithFloor(station.credits, reducedModuleResources.credits, 0),
            }
        }).foldAndCombine((station) => {
                let state: StationState = {...station};
                    station.stationModules.forEach((module) => {
                    if (module.crewApplied >= module.crewRequired && station.power + module.power >= 0) {
                        state = { ...state, ...module.mutateStation(station) };
                    }
                })

                return state;
        }).foldAndCombine(station => {
            const reducedVesselResources = station.vessels.reduce((previousValue, vessel) => {
                if (vessel.dockingStatus === VesselDockingStatus.Docked) {
                    return { ...baseVessel,
                        generatesPower: previousValue.generatesPower + vessel.generatesPower,
                        generatesAir: previousValue.generatesAir + vessel.generatesAir,
                        generatesFood: previousValue.generatesFood + vessel.generatesFood,
                        generatesMorale: previousValue.generatesMorale + vessel.generatesMorale,
                    }
                }
                return previousValue;
            }, baseVessel);
            return {
                // apply the reduced values to the station
                power: addWithCeilingAndFloor(station.power, reducedVesselResources.generatesPower, 0, ceilings.powerStorageCeiling),
                air: addWithCeilingAndFloor(station.air, reducedVesselResources.generatesAir, 0, ceilings.airStorageCeiling),
                food: addWithCeilingAndFloor(station.food, reducedVesselResources.generatesFood, 0, ceilings.foodStorageCeiling),
                morale: addWithCeilingAndFloor(station.morale, reducedVesselResources.generatesMorale, 0, 100),
            }
        }).foldAndCombine(station => {
            // charge a docking fee to vessels
            // vessels pay the fee, but only if they have money. it's up to the player to evict non-paying vessels
            return {
                credits: station.credits + station.vessels.filter(({dockingStatus}) => dockingStatus === VesselDockingStatus.Docked).length * station.dockingFee,
                vessels: station.vessels.map(v => {
                    return v.dockingStatus === VesselDockingStatus.Docked ? { ...v, credits: subtractWithFloor(v.credits, station.dockingFee, 0) } : v;
                })
            }
        }).foldAndCombine(station => {
            let dockingPortsOpen = getStationDockingPorts(station) - station.vessels.filter(v => v.dockingStatus === VesselDockingStatus.Docked).length;
            return { vessels: station.vessels.map(vessel => {
                if (vessel.dockingStatus === VesselDockingStatus.WarpingIn) {
                    // vessels warping in start waiting to dock
                    return vessel.fold({dockingStatus: VesselDockingStatus.NearbyWaitingToDock});
                } else if (dockingPortsOpen > 0 && 
                    vessel.dockingStatus === VesselDockingStatus.NearbyWaitingToDock && 
                    vessel.dockingDaysRequested > 0 &&
                    vessel.dockingFeePriceTolerance >= station.dockingFee) {
                    // take vessels waiting to dock and dock them, if possible, and if they want to dock
                    dockingPortsOpen--;
                    return vessel.fold({dockingStatus: VesselDockingStatus.Docked});
                } else if (dockingPortsOpen === 0 && 
                    vessel.dockingStatus === VesselDockingStatus.NearbyWaitingToDock && 
                    vessel.timeInQueue <= vessel.queueTolerance) {
                    // vessel can't dock because no ports were open. increment time-in-queue
                    return vessel.foldAndCombine(v => {return {timeInQueue: v.timeInQueue + 1}});
                } else if (vessel.dockingStatus === VesselDockingStatus.NearbyWaitingToDock
                    && vessel.timeInQueue > vessel.queueTolerance) {
                    // vessels which cant dock after a number of turns that equal their queue tolerance must leave
                    return vessel.fold({dockingStatus: VesselDockingStatus.NearbyWaitingToLeave});
                } else if (vessel.dockingStatus === VesselDockingStatus.Docked && vessel.dockingDaysRequested > 0) {
                    // vessels which are docked decrement their dockingDaysRequested, which tracks how long they've been docked
                    return vessel.foldAndCombine(v => {return {dockingDaysRequested: v.dockingDaysRequested - 1}});
                } else if (vessel.dockingStatus === VesselDockingStatus.Docked && vessel.dockingDaysRequested === 0) {
                    // un-dock vessels that have been docked as long as they want to
                    dockingPortsOpen++;
                    return vessel.fold({dockingStatus: VesselDockingStatus.NearbyWaitingToLeave});
                } else if (vessel.dockingStatus === VesselDockingStatus.NearbyWaitingToLeave) {
                    // vessels that have waited one turn to leave warp out
                    return vessel.fold({dockingStatus: VesselDockingStatus.WarpingOut})
                } else if (vessel.dockingStatus === VesselDockingStatus.WarpingOut) {
                    // vessels that have warped out are gone (removed from station state elsewhere)
                    return vessel.fold({dockingStatus: undefined});
                }
                return vessel;
            })};
        }).foldAndCombine(station => {
            // there's an increasing chance that crew will leave the station on undocking vessels if morale is low enough
            if (station.vessels.some(v => v.dockingDaysRequested === 0 && v.dockingStatus === VesselDockingStatus.NearbyWaitingToLeave)
            && station.morale <= 75 && d100() > station.morale) {
                return reduceModuleCrew(station.foldAndCombine(s => { return { crew: s.crew - 1}}),
                    station.stationModules.find(({crewApplied}) => crewApplied > 0)
                  )
            }
            return station;
        }).foldAndCombine(station => {
            // remove all vessels with no docking status from the station state
            return { vessels: station.vessels.filter(value => value.dockingStatus !== undefined) }
        }).foldAndCombine(station => {
            // player loses favor with the factions of vessels that reached their time in queue and had to warp out 
            const vessel = station.vessels.find(v => v.timeInQueue > v.queueTolerance);
            return {factions: station.factions.map(faction => 
                faction.name === vessel?.faction && faction.favor !== -1 // player cannot gain or lose factions with -1 favor 
                ? { ...faction, favor: faction.favor - 1}
                : faction
            )};
        }).foldAndCombine(station => {
            // player loses favor with the factions of vessels that were evicted from dock
            const vessel = station.vessels.find(
              (v) =>
                v.dockingStatus === VesselDockingStatus.WarpingOut &&
                v.dockingDaysRequested > 0 &&
                v.timeInQueue <= v.queueTolerance
            );
            return {
              factions: station.factions.map((faction) =>
                faction.name === vessel?.faction && faction.favor !== -1
                  ? { ...faction, favor: faction.favor - 1 }
                  : faction
              ),
            };
        }).foldAndCombine(station => {
            // player gains favor with the factions of vessels that reached their docking days requested and weren't evicted
            const vessel = station.vessels.find(v => v.dockingStatus === VesselDockingStatus.NearbyWaitingToLeave && v.dockingDaysRequested === 0);
            return {factions: station.factions.map(faction => 
                faction.name === vessel?.faction && faction.favor !== -1
                ? { ...faction, favor: faction.favor + 1}
                : faction
            )};
        }).foldAndCombine(station => {
            // add spawned vessels
            const incomingVessel = spawnVessel(station);
            if (incomingVessel) {
                return {
                    previouslyVisitedVesselNames: station.previouslyVisitedVesselNames.concat({
                        name: incomingVessel.name, 
                        stardateSinceLastVisited: station.stardate}),
                    daysSinceVesselSpawn: 0,
                    vessels: station.vessels.concat(incomingVessel.fold({timeInQueue: 0, dockingStatus: VesselDockingStatus.WarpingIn}))
                }
            }
            return {  };
        }).foldAndCombine(station => {
            // allow previously visited vessels to revisit the station after at least the vessel's respawn wait
            return {
                previouslyVisitedVesselNames: station.previouslyVisitedVesselNames.filter(({name, stardateSinceLastVisited}) => {
                    const vessel = vessels.find(vessel => vessel.name === name);
                    console.log(`vessel was ${vessel}`);
                    console.log(vessel && station.stardate < stardateSinceLastVisited + vessel.respawnWait + d20());
                    return vessel && station.stardate < stardateSinceLastVisited + vessel.respawnWait + d20();

                })
            }
        }).foldAndCombine(station => {
            // allow problems that have previously been solved to happen again after their respawn wait
            return {
                previouslySolvedProblems: station.previouslySolvedProblems.filter(problem => {
                    const fullProblem = problems.find(fullProblem => fullProblem.name === problem.name);
                    // keep problems that 
                    return fullProblem && 
                    // keep only problems with a non -1 respawn wait and...
                    fullProblem.respawnWait > -1 && 
                    // keep problems that have not reached their respawn wait time
                    station.stardate < problem.stardateSinceLastSolved + fullProblem.respawnWait;
                })
            }
        }).foldAndCombine(station => {
            // clear problems out from the problemsSequenceInProgress state if they have reached their last sequence
            return {
                problemSequencesInProgress: station.problemSequencesInProgress.filter(problem => {
                    const fullProblem = problems.find(p => p.name === problem.name);
                    return fullProblem && problem.indexOfLastSequenceSolved < fullProblem.narrativeSequence.length - 1;
                })
            }
        });
         // problems shouldn't happen on the first or second turn (for sanity, and testing)
        if (stationState.stardate > 1 && d100() < 20) {
            stationState = await stationState.foldAndCombineAsync(station => problemMenu(station, log, clear));
        }
    }
    return stationState;
}

const spendResourcesPerCrew = (stationState: StationState): Partial<StationState> => {
    return { 
        credits: subtractWithFloor(stationState.credits, stationState.crew * stationState.crewSalary, 0),
        air: subtractWithFloor(stationState.air, stationState.crew, 0),
        food: subtractWithFloor(stationState.food, stationState.crew * stationState.crewFoodRation, 0),
    };
}

// morale addition (independent of number of crew)
export const reduceMorale = (stationState: StationState): Partial<StationState> => {
    let moraleReduction = 0;
    moraleReduction -= (3 - stationState.crewFoodRation) * 3; // reduce if food ration under 3
    moraleReduction -= stationState.food <= 0 ? 20 : 0; // reduce morale by 10 if no food
    moraleReduction -= stationState.air <= 0 ? 100 : 0; // reduce morale by 100 if no air
    moraleReduction -= 5 - stationState.crewSalary; // reduce by 1 per crew for every value below 5
    moraleReduction -= stationState.credits <= 0 ? 5 : 0 // reduce by 5 if no credits

    return { 
        morale: addWithFloor(stationState.morale, moraleReduction - 1, 0),
        daysWithoutFood: stationState.food <= 0 ? stationState.daysWithoutFood + 1 : 0
    };   
}

export const addMorale = (stationState: StationState): Partial<StationState> => {
    let moraleAddition = stationState.crewFoodRation > 3 
        ? addWithCeiling(0, stationState.crewFoodRation, 6)
        : 0;
    moraleAddition += stationState.credits > 0 && stationState.crewSalary > 5 
        ? addWithCeiling(0, stationState.crewSalary, 15)
        : 0

    return { 
        morale: addWithCeiling(stationState.morale, moraleAddition, 100),
    };   
}

export const reduceModuleCrew = (stationState: StationState, module: StationModule | undefined): StationState => {
    if (module) {
            return { 
                ...stationState,
                stationModules: stationState.stationModules.map(mod => 
                mod.name === module.name
                ? module.foldAndCombine(m => {return { crewApplied: m.crewApplied - 1 }}) 
                : mod)
            };
    }
    return stationState
}

const incrementStardate = (stationState: StationState): Partial<StationState> => {
    return { stardate: stationState.stardate + 1 };
}

const addFunding = (stationState: StationState): Partial<StationState> => {
    return { credits: stationState.credits + stationState.funding };
}

export function printStationStatus(stationState: StationState, log: Log, clear: () => void) {
    clear();

    const ceilings = calculateStorageCeilings(stationState);
    // print stardate
    log(chalk.bold.bgGreen(`\n Space Station ${stationState.stationName} | Stardate: ${stationState.stardate} | ${stationState.crew} Crew (${getUnassignedCrew(stationState)} idle) ${chalk.bgRedBright.bold(` Credits: ${stationState.credits}`)}`));
    let moduleString = "";
    stationState.stationModules.forEach(mod => {
        moduleString += (mod.crewApplied >= mod.crewRequired && stationState.power + mod.power >= 0 ? chalk.green(`[${mod.name}]`) : chalk.gray(`[${mod.name}]`)) + (' ')
    })
    log(moduleString + '\n');
    // print resources
    const crewString =  ` Morale: ${progressBar(10, stationState.morale, 100, chalk.bgRedBright, chalk.grey)} `
    const powerString = ` Power:  ${progressBar(ceilings.powerStorageCeiling / 10, stationState.power, ceilings.powerStorageCeiling, chalk.bgYellow.yellowBright, chalk)} - ${stationState.power}/${ceilings.powerStorageCeiling}Mwh `
    const airString =   ` Air:    ${progressBar(ceilings.airStorageCeiling / 10, stationState.air, ceilings.airStorageCeiling, chalk.bgWhite, chalk)} - ${stationState.air}/${ceilings.airStorageCeiling}Kl `
    const foodString =  ` Food:   ${progressBar(ceilings.foodStorageCeiling / 10, stationState.food, ceilings.foodStorageCeiling, chalk.bgMagenta, chalk)} - ${stationState.food}/${ceilings.foodStorageCeiling}k `
    
    log(crewString);
    log(powerString);
    log(airString);
    log(foodString);

    // print docked vessels
    log(`\n${chalk.bold.bgGrey(` Vessels docked: (${getStationDockingPorts(stationState)} ports)`)}`);

    let vesselString = '';
    stationState.vessels.
        filter(vessel => vessel.dockingStatus === VesselDockingStatus.Docked).
            forEach(vessel => {
            vesselString += ` > ${chalk.hex(getVesselColor(vessel, stationState.factions))(`${vessel.name}`)}\n`;    
    });
    log(vesselString !== '' ? vesselString : chalk.gray(' None\n'));

    let nearbyVesselString = '';
    stationState.vessels.
        filter(vessel => vessel.dockingStatus === VesselDockingStatus.NearbyWaitingToDock || vessel.dockingStatus === VesselDockingStatus.NearbyWaitingToLeave).
        forEach(vessel => {
            nearbyVesselString += chalk.hex(getVesselColor(vessel, stationState.factions))(`${vessel.name} \n`);
    });
    log(`${chalk.bold.bgGrey(` Vessels nearby: `)}`);
    log(nearbyVesselString !== '' ? nearbyVesselString : chalk.gray(' None\n'));
    
    let warpSigsString = '';
    stationState.vessels.
        filter(vessel => vessel.dockingStatus === VesselDockingStatus.WarpingOut).
        forEach(({}) => { warpSigsString += chalk.italic.cyan('<Outgoing Warp Signature>\n') });
    stationState.vessels.
        filter(vessel => vessel.dockingStatus === VesselDockingStatus.WarpingIn).
        forEach(({}) => { warpSigsString += chalk.italic.cyan('<Incoming Warp Signature>\n') });
    log(`${chalk.bold.bgGrey(` Warp signatures detected: `)}`);
    log(warpSigsString !== '' ? warpSigsString : chalk.gray(' None\n'));
}

export function spawnVessel(stationState: StationState): Vessel | undefined {
    let vessel: Vessel | undefined = undefined;
    // an increasing chance that a vessel spawns
    if (
      d100() <=
      stationState.stationModules.reduce((prev, curr) => {
        return {
          ...baseModule,
          vesselAttraction: curr.vesselAttraction + prev.vesselAttraction,
        };
      }, baseModule).vesselAttraction +
        stationState.daysSinceVesselSpawn * 2
    ) {
      const rarity = d20();
      // find vessels according to rarity. don't consider vessels that have visited previously
      const candidateVesselsToSpawn = vessels.filter(
        (vessel) =>
          vessel.rarity > 0 &&
          vessel.rarity < rarity &&
          !vesselPreviouslyVisited(
            vessel.name,
            stationState.previouslyVisitedVesselNames
          )
      );
      vessel = candidateVesselsToSpawn[dN(candidateVesselsToSpawn.length) - 1];
    }
    return vessel;
}

function vesselPreviouslyVisited(name: string, 
    previouslyVisitedVesselNames: {name: string, stardateSinceLastVisited: number}[]) {
    return previouslyVisitedVesselNames.find(vessel => vessel.name == name) !== undefined;
}
