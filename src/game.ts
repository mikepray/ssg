import prompts, { Answers } from "prompts";
import chalk from "chalk";
import { Log, StationState, Vessel } from "./types";
import { addWithCeilingAndFloor, addWithFloor, calculateStorageCeilings, d100, d20, dN, getUnassignedCrew, getVesselColor, progressBar, subtractWithFloor } from "./utils";
import { assignCrewMenu } from "./menus/assignCrewMenu";
import { dockingMenu } from "./menus/dockingMenu";
import { moduleMenu } from "./menus/moduleMenu";
import { vesselsNearbyMenu } from "./menus/vesselsNearbyMenu";
import { vessels } from "./data/vessels";
import { testingStationState } from "./data/testStartingState";

export async function gameLoop(stardate: number, stationState: StationState, log: Log) {
    printStationStatus(stationState, log);
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
        return;
    }
    if (input.value === 'modules') {
        await moduleMenu(stationState);
    } else if (input.value === 'docking') {
        await dockingMenu(stationState, log);
    } else if (input.value === 'vessels') {
        await vesselsNearbyMenu(stationState);
    } else if (input.value === 'crew') {
        const moduleWithReassignedCrew = await assignCrewMenu(stationState);
        if (moduleWithReassignedCrew !== undefined) {
            const index = stationState.stationModules.findIndex(mod => mod.name === moduleWithReassignedCrew?.name);
            stationState.stationModules[index] = moduleWithReassignedCrew;
        }
    } else if (input.value === 'wait') {
        // let newState = incrementStardate(stationState);
        // newState = addFunding(newState);
        // newState = spendResourcesPerCrew(newState);
        // newState = reduceMoraleWithoutFood(newState);
        // newState = reduceCrewWithoutFood(newState);

        new StationBuilder(stationState)
        .incrementStardate()
        .addFunding()
        .spendResourcesPerCrew()
        .reduceMoraleWithoutFood()
        .reduceCrewWithoutFood();

        new StationBuilder(stationState)
            .mutate(station => {
                return { ...station,
                    stardate: station.stardate + 1 };
            }).mutate(station => {
            return { ...station, 
                    credits: station.credits + station.funding };
            })

        // if there's no credits, reduce morale
        if (stationState.credits <= 0) {
            stationState.morale = subtractWithFloor(stationState.morale, 2, 0);
        }

        // if there's no air, reduce crew!
        if (stationState.air === 0) {
            stationState.crew = subtractWithFloor(stationState.crew, 1, 0) 
            // unassign crew from a module
            const module = stationState.stationModules.find(val => val.crewApplied > 0);
                if (module !== undefined) {
                    module.crewApplied -= 1;
                    const index = stationState.stationModules.findIndex(mod => {
                        mod.name === module.name;
                    });
                    stationState.stationModules[index] = module;

                }     
        }
        if (stationState.crew === 0) {
            throw new Error("Game Over - you have no crew left!")
        }

        // iterate through station modules and gain/spend resources
        stationState.stationModules.forEach(module => {
            if (module.crewApplied >= module.crewRequired && stationState.power + module.power >= 0) {
                stationState.power = addWithCeilingAndFloor(stationState.power, module.power, 0, ceilings.powerStorageCeiling);
                stationState.air = addWithCeilingAndFloor(stationState.air, module.air, 0, ceilings.airStorageCeiling);
                stationState.food = addWithCeilingAndFloor(stationState.food, module.food, 0, ceilings.foodStorageCeiling);
                // morale has a ceiling of 100
                stationState.morale = addWithCeilingAndFloor(stationState.morale, module.morale, 0, 100);
                // there is no ceiling to credits
                stationState.credits = addWithFloor(stationState.credits, module.credits, 0);
            }
        })

        // iterate through vessels in the docking queue. vessels with negative timeInQueue increment until zero. -2 is in the queue and leaving, and -1 is warping out
        // +1 is warping in, +2 is joining the queue
        
        // Warping In & Docking
        // timeInQueue = 1 == Warping In
        // timeInQueue = 2 == Nearby
        // timeInQueue > 2 == Waiting to dock
        
        // Undocking and Warping Out
        // timeInQueue = -2 == Undocked and nearby
        // timeInQueue = -1 == Warping out

        stationState.vesselQueue.forEach((vessel) => {
          if (vessel.timeInQueue === -1) {
            // un-dock the vessel
            stationState.vesselQueue = stationState.vesselQueue.filter(
              (filter) => filter.name !== vessel.name
            );
          }
          if (vessel.timeInQueue >= 2) {
              // attempt to dock at an available docking ring
            let dockRing = stationState.dockRings.find(
                (dock) => dock.vessel === undefined
            );
            // vessels with dockingDaysRequested = -1 never want to dock (e.g. aliens)
            if (dockRing && vessel.dockingDaysRequested > 0) {
              dockRing.vessel = vessel;
              stationState.vesselQueue = stationState.vesselQueue.filter(
                (filter) => filter.name !== vessel.name
              );
            } else {
              // the vessel can't find a docking ring
              if (vessel.queueTolerance == 0) {
                // if the vessel's queue tolerance reaches zero, it will warp out and the player loses favor with the vessel's faction
                let vesselFaction = stationState.factions.find(
                  (faction) => faction.name === vessel.faction
                );
                if (vesselFaction) {
                  subtractWithFloor(vesselFaction.favor, 1, 0);
                }
                vessel.timeInQueue = -2;
              }
              vessel.queueTolerance--;
            }
          }
          vessel.timeInQueue++;
        });

        //iterate through docked vessels and decrement their dockingDaysRequested. if any get to zero, they depart
        stationState.dockRings.forEach(dockRing => {
            if (dockRing.vessel !== undefined) {
                let vessel = dockRing.vessel;

                if (vessel?.dockingDaysRequested === 0) {
                    dockRing.vessel = undefined;
                    vessel.timeInQueue = -2;
                    stationState.vesselQueue.push(vessel)
                } else {
                    vessel.dockingDaysRequested--;
                }
            }
        })

        // // incoming vessels
        // if (stardate == 2) {
        //     let bigFred = vessels.find(vessel => vessel.name === 'Big Fred');
        //     if (bigFred) {
        //         bigFred.timeInQueue = 1;
        //         stationState.vesselQueue.push(bigFred);
        //     }
        // }

        // if (stardate == 6) {
        //     let alien = vessels.find(vessel => vessel.name === '∆');
        //     if (alien) {
        //         alien.timeInQueue = 1;
        //         stationState.vesselQueue.push(alien);
        //     }
        // }        

        const incomingVessel = spawnVessel(stationState);
        if (incomingVessel) {
            incomingVessel.timeInQueue = 1;
            stationState.vesselQueue.push(incomingVessel);
        }

        // allow previously visited vessels to revisit the station after at least 11 days
        stationState.previouslyVisitedVesselNames = stationState.previouslyVisitedVesselNames.filter(vessel => 
            vessel.stardateSinceLastVisited + 10 + d20() >= stationState.stardate);
        
        // problem loop
        
        stationState.stardate++;
    }
    gameLoop(stardate, stationState, log);
}

class StationBuilder {
    stationState: StationState
    constructor(stationState: StationState) {
        this.stationState = stationState;
    }

    mutate(func: (stationState: StationState) => StationState): StationBuilder {
        return new StationBuilder(this.stationState);
    }

    incrementStardate(): StationBuilder {
        return new StationBuilder({ ...this.stationState,
             stardate: this.stationState.stardate + 1 });
    }
    
    addFunding(): StationBuilder {
        return new StationBuilder({ ...this.stationState, 
            credits: this.stationState.credits + this.stationState.funding });
    }
    
    spendResourcesPerCrew(): StationBuilder {
        return new StationBuilder({ ...this.stationState,
            credits: subtractWithFloor(this.stationState.credits, this.stationState.crew * this.stationState.crewSalary, 0),
            air: subtractWithFloor(this.stationState.air, this.stationState.crew, 0),
            food: subtractWithFloor(this.stationState.food, this.stationState.crew, 0)
        });
    }

    reduceMoraleWithoutFood(): StationBuilder {
        // if there's no food, reduce morale
        if (this.stationState.food <= 0) {
            return new StationBuilder({ ...this.stationState, 
                morale: subtractWithFloor(this.stationState.morale, 10, 0),
                daysWithoutFood: this.stationState.daysWithoutFood + 1
            });
            
        }
        return new StationBuilder({ ...this.stationState, 
            daysWithoutFood: 0 });
    }
    
    reduceCrewWithoutFood(): StationBuilder {
        if (this.stationState.daysWithoutFood > 5) {
            // if it's been too long without food, reduce crew!
            const crew = subtractWithFloor(this.stationState.crew, 1, 0);
            // unassign a crew from a module TODO
            const module = this.stationState.stationModules.find(val => val.crewApplied > 0);
            if (module !== undefined) {
                module.crewApplied -= 1;
                const index = this.stationState.stationModules.findIndex(mod => {
                    mod.name === module.name;
                });
                this.stationState.stationModules[index] = module;
    
            }                
        }
        return new StationBuilder(this.stationState);
    }
}




export function printStationStatus(stationState: StationState, log: Log) {
    console.clear();

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
    log(`\n${chalk.bold.bgGrey(` Vessels docked: `)}`);

    let vesselString = '';
    stationState.dockRings.forEach(dockRing => {
        vesselString += ` > ${dockRing.vessel === undefined ? chalk.gray(`None`) : chalk.hex(getVesselColor(dockRing.vessel, stationState.factions))(`${dockRing.vessel.name}`)}\n`;
    });
    log(vesselString)
    let nearbyVesselString = '';
    stationState.vesselQueue.forEach(vessel => {
        if (vessel.timeInQueue == -1) {
            nearbyVesselString += chalk.italic.cyan('<Outgoing Warp Signature>\n')
        } else if (vessel.timeInQueue == 1) {
            nearbyVesselString += chalk.italic.cyan('<Incoming Warp Signature>\n')
        } else {
            nearbyVesselString += chalk.hex(getVesselColor(vessel, stationState.factions))(`${vessel.name} \n`);
        }
    })
    log(' ');
    log(`${chalk.bold.bgGrey(` Vessels nearby: `)}`);
    log(nearbyVesselString !== '' ? nearbyVesselString : chalk.gray(' None\n'));

}

function spawnVessel(stationState: StationState): Vessel | undefined {
    let vessel: Vessel | undefined = undefined;
    // an increasing chance that a vessel spawns
    if (d100() < (25 + (stationState.daysSinceVesselSpawn * 2))) {
        const rarity = d20();
        // find vessels according to rarity. don't consider vessels that have visited previously
        const candidateVesselsToSpawn = vessels.filter(vessel => 
            vessel.rarity > 0 && vessel.rarity < rarity &&
            !vesselPreviouslyVisited(vessel.name, stationState.previouslyVisitedVesselNames) );

        vessel = candidateVesselsToSpawn[dN(candidateVesselsToSpawn.length) - 1];
    
        if (vessel) {
            stationState.previouslyVisitedVesselNames.push(
                {name: vessel.name, stardateSinceLastVisited: stationState.stardate});
            stationState.daysSinceVesselSpawn = 0;
        }
    }
    return vessel;
}

function vesselPreviouslyVisited(name: string, 
    previouslyVisitedVesselNames: {name: string, stardateSinceLastVisited: number}[]) {
    return previouslyVisitedVesselNames.find(vessel => vessel.name == name) !== undefined;
}
