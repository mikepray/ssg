import prompts, { Answers } from "prompts";
import chalk from "chalk";
import { StationState } from "./types";
import { testingStationState } from "./data/testStartingState";
import { addWithCeilingAndFloor, addWithFloor, calculateStorageCeilings, getUnassignedCrew, getVesselColor, progressBar, subtractWithFloor } from "./utils";
import { assignCrewMenu } from "./assignCrewMenu";
import { dockingMenu } from "./sellResourceMenu";
import { moduleMenu } from "./moduleMenu";
import { vesselsNearbyMenu } from "./vesselsNearbyMenu";
import { vessels } from "./data/vessels";

const { log } = console;

let stardate = 1000;
/*
askStartingOptions().then((opts) => {
       gameLoop(stardate, opts);
    }
);*/
gameLoop(1, testingStationState);

async function gameLoop(stardate: number, stationState: StationState) {
    printStationStatus(stationState);
    const ceilings = calculateStorageCeilings(stationState);
    // wait for input
    const input = await prompts({
        type: "select",
        name: "value",
        message: "Enter Command",
        choices: [
            {
                title: "Wait",
                description: "Let the station run",
                value: "wait"
            },
            {
                title: "List Modules",
                description: "Examine, repair, build station modules",
                value: "modules"
            },
            {
                title: "Assign Crew",
                description: "Assign station crew to modules",
                value: "crew"
            },
            {
                title: "Docked Vessels",
                description: "Manage docked vessels",
                value: "docking"
            },
            {
                title: "Vessels Nearby",
                description: "Examine nearby vessels passing or waiting to dock",
                value: "vessels"
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
        await dockingMenu(stationState);
    } else if (input.value === 'vessels') {
        await vesselsNearbyMenu(stationState);
    } else if (input.value === 'crew') {
        const moduleWithReassignedCrew = await assignCrewMenu(stationState);
        if (moduleWithReassignedCrew !== undefined) {
            const index = stationState.stationModules.findIndex(mod => mod.name === moduleWithReassignedCrew?.name);
            stationState.stationModules[index] = moduleWithReassignedCrew;
        }
    } else if (input.value === 'wait') {
        stardate++;
        // gain/spend resources
        stationState.credits += stationState.funding;
        // for every crew, spend 1 air and 1 food and spend their salary in credits
        stationState.credits = subtractWithFloor(stationState.credits, stationState.crew * stationState.crewSalary, 0);
        stationState.air = subtractWithFloor(stationState.air, stationState.crew, 0);
        stationState.food = subtractWithFloor(stationState.food, stationState.crew, 0);

        // if there's no food, reduce morale
        if (stationState.food <= 0) {
            stationState.morale = subtractWithFloor(stationState.morale, 10, 0);
            stationState.daysWithoutFood++;
            if (stationState.daysWithoutFood > 5) {
                // if it's been too long without food, reduce crew!
                stationState.crew = subtractWithFloor(stationState.crew, 1, 0);
                // unassign a crew from a module
                const module = stationState.stationModules.find(val => val.crewApplied > 0);
                if (module !== undefined) {
                    module.crewApplied -= 1;
                    const index = stationState.stationModules.findIndex(mod => {
                        mod.name === module.name;
                    });
                    stationState.stationModules[index] = module;

                }                
            }
        }

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
        stationState.vesselQueue.forEach(vessel => {
            if (vessel.timeInQueue === -1) {
                stationState.vesselQueue = stationState.vesselQueue.filter(filter => filter.name !== vessel.name);
            }
            if (vessel.timeInQueue >= 2) {
                // attempt to dock at an available docking ring
                let dockRing = stationState.dockRings.find(dock => dock.vessel === undefined);
                if (dockRing !== undefined) {
                    dockRing.vessel = vessel;
                    stationState.vesselQueue = stationState.vesselQueue.filter(filter => filter.name !== vessel.name);
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

        // incoming vessels
        if (stardate == 4) {
            let bigFred = vessels.find(vessel => vessel.name === 'Big Fred');
            if (bigFred) {
                bigFred.timeInQueue = 1;
                stationState.vesselQueue.push(bigFred);
            }
        }
        // roll for input resources
        // roll for trade
        // roll for problems
        // problem loop
    }
    gameLoop(stardate, stationState);
}

export function printStationStatus(stationState: StationState) {
    console.clear();

    const ceilings = calculateStorageCeilings(stationState);
    // print stardate
    log(chalk.bold.bgGreen(`\n Space Station ${stationState.stationName} | Stardate: ${stardate} | ${stationState.crew} Crew (${getUnassignedCrew(stationState)} idle) ${chalk.bgRedBright.bold(` Credits: ${stationState.credits}`)}`));
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

    log(`\n${chalk.bold.bgGrey(` Vessels docked: `)}`);

    let vesselString = '';
    stationState.dockRings.forEach(dockRing => {
        vesselString += ` ${dockRing.vessel === undefined ? chalk.gray(`None`) : chalk.hex(getVesselColor(dockRing.vessel, stationState.factions))(`${dockRing.vessel.name} \n`)}`;
    });
    log(vesselString)
    let nearbyVesselString = '';
    stationState.vesselQueue.forEach(vessel => {
        if (vessel.timeInQueue == -1 || vessel.timeInQueue == 1) {
            nearbyVesselString += chalk.italic.cyan('<Warp Signature Detected>\n')
        } else {
            nearbyVesselString += chalk.hex(getVesselColor(vessel, stationState.factions))(`${vessel.name} \n`);
        }
    })
    log(' ');
    log(`${chalk.bold.bgGrey(` Vessels nearby: `)}`);
    log(nearbyVesselString !== '' ? nearbyVesselString : chalk.gray(' None\n'));

}
