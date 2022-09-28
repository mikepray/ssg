import prompts, { Answers } from "prompts";
import chalk from "chalk";
import { Log, StationModule, StationState, Vessel, VesselDockingStatus } from "./types";
import { addWithCeilingAndFloor, addWithFloor, calculateStorageCeilings, d100, d20, dN, getStationDockingPorts, getUnassignedCrew, getVesselColor, progressBar, subtractWithFloor } from "./utils";
import { assignCrewMenu } from "./menus/assignCrewMenu";
import { dockingMenu } from "./menus/dockingMenu";
import { moduleMenu } from "./menus/moduleMenu";
import { vesselsNearbyMenu } from "./menus/vesselsNearbyMenu";
import { vessels } from "./data/vessels";
import { baseModule } from "./data/stationModules";
import { factions } from "./data/factions";
import { problemMenu } from "./menus/problemMenu";
import { problems } from "./data/problems";

export async function gameLoop(stationState: StationState, log: Log, clear: () => void): Promise<StationState> {
    if (stationState.crew === 0) {
        throw new Error("Game Over - you have no crew left!")
    }
    printStationStatus(stationState, log, clear);
    const ceilings = calculateStorageCeilings(stationState);
    
    // wait for input
    const input = await prompts({
        type: "select",
        name: "value",
        message: "Main Menu",
        choices: [
            {
                title: "Wait",
                description: "Let the station run",
                value: "wait"
            },
            {
                title: "Docked Vessels",
                description: "Manage docked vessels",
                value: "docking"
            },
            {
                title: "Nearby Vessels",
                description: "Examine nearby vessels passing or waiting to dock",
                value: "vessels"
            },
            {
                title: "Assign Crew",
                description: "Assign station crew to modules",
                value: "crew"
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
        moduleMenu(stationState.stationModules, log, clear);
        await prompts({
            type: 'confirm',
            name: 'value',
            message: 'Continue...',
            initial: true
          });
    } else if (input.value === 'docking') {
        stationState = await dockingMenu(stationState, log, clear);
    } else if (input.value === 'vessels') {
        await vesselsNearbyMenu(stationState, clear);
    } else if (input.value === 'crew') {
        stationState = await assignCrewMenu(stationState, clear);
    } else if (input.value === 'wait') {
        stationState = stationState
          .foldAndCombine(incrementStardate)
          .foldAndCombine(addFunding)
          .foldAndCombine(spendResourcesPerCrew)
          .foldAndCombine(reduceMoraleWithoutFood)
          .foldAndCombine(reduceCrewWithoutFood)
          // if there's no credits, reduce morale
          .foldAndCombine((station) =>
            station.credits <= 0
              ? { morale: subtractWithFloor(station.morale, 2, 0) }
              : station
          )
          // if there's no air, reduce crew!
          .foldAndCombine((station) =>
            station.air === 0
              ? reduceModuleCrew(
                  station.foldAndCombine((stat) => {
                    return { crew: subtractWithFloor(stat.crew, 1, 0) };
                  }),
                  station.stationModules.find((val) => val.crewApplied > 0)
                )
              : station
          ).foldAndCombine((station) => {
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
        }).foldAndCombine(station => {
            let dockingPortsOpen = getStationDockingPorts(station) - station.vessels.filter(v => v.dockingStatus === VesselDockingStatus.Docked).length;
            return { vessels: station.vessels.map(vessel => {
                if (vessel.dockingStatus === VesselDockingStatus.WarpingIn) {
                    // vessels warping in start waiting to dock
                    return vessel.fold({dockingStatus: VesselDockingStatus.NearbyWaitingToDock});
                } else if (dockingPortsOpen > 0 && vessel.dockingStatus === VesselDockingStatus.NearbyWaitingToDock && vessel.dockingDaysRequested > 0) {
                    // take vessels waiting to dock and dock them, if possible, and if they want to dock
                    dockingPortsOpen--;
                    return vessel.fold({dockingStatus: VesselDockingStatus.Docked});
                } else if (dockingPortsOpen === 0 && vessel.dockingStatus === VesselDockingStatus.NearbyWaitingToDock && vessel.dockingDaysRequested > 0) {
                    // vessel can't dock because no ports were open. increment time-in-queue
                    return vessel.foldAndCombine(v => {return {timeInQueue: v.timeInQueue + 1}});
                } else if (vessel.dockingStatus === VesselDockingStatus.NearbyWaitingToDock && vessel.timeInQueue > vessel.queueTolerance) {
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
            // remove all vessels with no docking status from the station state
            return { vessels: station.vessels.filter(value => value.dockingStatus !== undefined) }
        }).foldAndCombine(station => {
            // player loses favor with the factions of vessels that reached their time in queue and had to warp out 
            const vessel = station.vessels.find(v => v.timeInQueue > v.queueTolerance);
            return {factions: factions.map(faction => 
                faction.name === vessel?.faction && faction.favor !== -1 // player cannot gain or lose factions with -1 favor 
                ? { ...faction, favor: faction.favor - 1}
                : faction
            )};
        }).foldAndCombine(station => {
            // player loses favor with the factions of vessels that were evicted from dock
            const vessel = station.vessels.find(v => v.dockingStatus === VesselDockingStatus.NearbyWaitingToLeave && v.dockingDaysRequested > 0);
            return {factions: factions.map(faction => 
                faction.name === vessel?.faction && faction.favor !== -1
                ? { ...faction, favor: faction.favor - 1}
                : faction
            )};
        }).foldAndCombine(station => {
            // player gains favor with the factions of vessels that reached their docking days requested and weren't evicted
            const vessel = station.vessels.find(v => v.dockingStatus === VesselDockingStatus.NearbyWaitingToLeave && v.dockingDaysRequested === 0);
            return {factions: factions.map(faction => 
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
                    return vessel && station.stardate < stardateSinceLastVisited + vessel.respawnWait + d20();
                    
                })
            }
        }).foldAndCombine(station => {
            // allow problems that have previously been solved to happen again after their respawn wait
            return {
                previouslySolvedProblems: station.previouslySolvedProblems.filter(problem => {
                    const fullProblem = problems.find(fullProblem => fullProblem.name === problem.name);
                    return fullProblem && station.stardate < problem.stardateSinceLastSolved + fullProblem.respawnWait;
                })
            }
        });
         // an increasing chance that a problem happens
        if (d100() < (20 + (stationState.daysSinceVesselSpawn * .5))) {
            stationState = await stationState.foldAndCombineAsync(station => problemMenu(station, log, clear));
        }
    }
    return stationState;
}

const spendResourcesPerCrew = (stationState: StationState): Partial<StationState> => {
    return { 
        credits: subtractWithFloor(stationState.credits, stationState.crew * stationState.crewSalary, 0),
        air: subtractWithFloor(stationState.air, stationState.crew, 0),
        food: subtractWithFloor(stationState.food, stationState.crew, 0)
    };
}

const reduceMoraleWithoutFood = (stationState: StationState): Partial<StationState> => {
     // if there's no food, reduce morale
     if (stationState.food <= 0) {
        return { 
            morale: subtractWithFloor(stationState.morale, 10, 0),
            daysWithoutFood: stationState.daysWithoutFood + 1
        };
        
    }
    return { daysWithoutFood: 0 };
}

const reduceCrewWithoutFood = (stationState: StationState): Partial<StationState> => {
    if (stationState.daysWithoutFood > 5) {
        // if it's been too long without food, reduce crew!
        return reduceModuleCrew(
            stationState.foldAndCombine(station => { return { crew: station.crew - 1} }),
            stationState.stationModules.find(val => val.crewApplied > 0)
        );
    }
    return stationState;
}

const reduceModuleCrew = (stationState: StationState, module: StationModule | undefined): StationState => {
    if (module) {
        return stationState.foldAndCombine(state => {
            return { 
                stationModules: state.stationModules.map(mod => 
                mod.name === module.name
                ? module.foldAndCombine(m => {return { crewApplied: m.crewApplied - 1 }}) 
                : mod)
            };
        });
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

function spawnVessel(stationState: StationState): Vessel | undefined {
    let vessel: Vessel | undefined = undefined;
    // an increasing chance that a vessel spawns
    if (d100() <= (30 + (stationState.daysSinceVesselSpawn * 2))) {
        const rarity = d20();
        // find vessels according to rarity. don't consider vessels that have visited previously
        const candidateVesselsToSpawn = vessels.filter(vessel => 
            vessel.rarity > 0 && vessel.rarity < rarity &&
            !vesselPreviouslyVisited(vessel.name, stationState.previouslyVisitedVesselNames) );
        vessel = candidateVesselsToSpawn[dN(candidateVesselsToSpawn.length) - 1];
    }
    return vessel;
}

function vesselPreviouslyVisited(name: string, 
    previouslyVisitedVesselNames: {name: string, stardateSinceLastVisited: number}[]) {
    return previouslyVisitedVesselNames.find(vessel => vessel.name == name) !== undefined;
}
