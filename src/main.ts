import prompts, { Answers } from "prompts";
import chalk from "chalk";
import { builtinModules } from "module";
import { Vessel, StartingOptions, StationState, StationModule, Faction } from "./types";
import { newVessel, testingStationState } from "./data/test";
import { addWithCeilingAndFloor, addWithFloor, calculateStorageCeilings, subtractWithFloor } from "./utils";

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
            newVessel.timeInQueue = 1;
            stationState.vesselQueue.push(newVessel);
        }
        // roll for input resources
        // roll for trade
        // roll for problems
        // problem loop
    }
    gameLoop(stardate, stationState);
}

function printStationStatus(stationState: StationState) {
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

async function moduleMenu(stationState: StationState) {
    console.clear();
    stationState.stationModules.forEach(module => {
        const op = module.crewApplied >= module.crewRequired && module.wasPowered ? 
            chalk.yellow(`Operational` ) :
            chalk.grey(`Not Operational `);
        log(`${chalk.bold.white.bgGreen(module.name)} ${op} - ${chalk.gray(module.description)}`)
        
        if (module.crewRequired === 0) {
            log(chalk.gray(` Requires no crew`));
        } else if (module.crewApplied === module.crewRequired) {
            log(chalk.yellow(` Requires ${module.crewRequired} crew (${module.crewApplied} assigned)`));
        } else if (module.crewApplied <= module.crewRequired) {
            log(chalk.red(` Requires ${module.crewRequired} crew (${module.crewApplied} assigned)`));
        }
        const moduleTable: string[][] = 
        [
            [`Generation:`, 
            `Power ${module.power > 0 ? chalk.bold.black.bgYellow(module.power) : chalk.gray(0)}`, 
            `Air ${module.air > 0 ? chalk.black.bgWhite(module.air) : chalk.gray(0)}`, 
            `Food ${module.food > 0 ? chalk.bgMagenta(module.food) : chalk.gray(0)}`],
            [`Consumption:`,
            `Power ${module.power < 0 ? chalk.bold.black.bgYellow(module.power) : chalk.gray(0)}`,
            `Air ${module.air < 0 ? chalk.black.bgWhite(module.air) : chalk.gray(0)}`,
            `Food ${module.food < 0 ? chalk.bgMagenta(module.food) : chalk.gray(0)}`],
            [`Storage:`, 
            `Power ${module.powerStorage > 0 ? chalk.bold.black.bgYellow(module.powerStorage) : chalk.gray(0)}`,
            `Air ${module.airStorage > 0 ? chalk.black.bgWhite(module.airStorage) : chalk.gray(0)}`,
            `Food ${module.foodStorage > 0 ? chalk.bgMagenta(module.foodStorage) : chalk.gray(0)}`]
        ];
        log(printTable(moduleTable));

    });

    const cont = await prompts({
        type: 'confirm',
        name: 'value',
        message: 'Continue...',
        initial: true
      });
}

async function dockingMenu(stationState: StationState) {
    console.clear();
    printStationStatus(stationState);
    const chooseVesselAnswer: Answers<string> = await prompts({
        type: "select",
        name: "value",
        message: `Choose a docked vessel to manage`,
        choices: stationState.dockRings.map(dockRing => {
            if (dockRing.vessel === undefined) {
                return {
                    title: 'Dock Ring: None',
                    value: 'none'
                }
            }
            return {
                title: `Dock Ring: ${chalk.hex(getVesselColor(dockRing.vessel, stationState.factions))(dockRing.vessel.name)}`,
                value: dockRing.vessel?.name
            };
        }),
    });

    const dockRing = stationState.dockRings.find(dockRing => dockRing.vessel?.name === chooseVesselAnswer.value);

    if (dockRing === undefined || dockRing.vessel === undefined) {
        log(` There's nothing here... `);
        return;
    } else {
        const tradingVessel = dockRing.vessel;
        console.clear();
        printStationStatus(stationState);
        log(`This is the ${tradingVessel.name}, a ${tradingVessel.class} starship. It's affiliated with the ${ stationState.factions.find(faction => faction.name === tradingVessel?.faction)?.name} `)

        const manageVesselAnswer: Answers<string> = await prompts({
            type: "select",
            name: "value",
            message: `Manage the vessel`,
            choices: [
                {
                    title: 'Trade',
                    value: 'trade',
                },
                {
                    title: 'Evict',
                    description: 'Evict the vessel from your station',
                    value: 'evict',
                },
                {
                    title: 'Seize Cargo',
                    description: `Seize this vessel's cargo`,
                    value: 'seize',
                },
            ],
        });

        if (manageVesselAnswer.value === 'trade') {
            let tradeAnswer: Answers<string>;
            do {    
                const choices: prompts.Choice[] = [ ];

                if (tradingVessel.tradesPower > 0) {
                    choices.push({
                        title: ` Buy Power for ${tradingVessel.tradesPowerForCredits}`,
                        value: `buyPower`,
                    });
                } 
                if (tradingVessel.tradesPower < 0) {
                    choices.push({
                        title: ` Sell Power for ${tradingVessel.tradesPowerForCredits}`,
                        value: `sellPower`,
                    });
                }
                if (tradingVessel.tradesAir > 0) {
                    choices.push({
                        title: ` Buy Air for ${tradingVessel.tradesAirForCredits}`,
                        value: `buyAir`,
                    });
                }     
                if (tradingVessel.tradesAir < 0) {
                    choices.push({
                        title: ` Sell Air for ${tradingVessel.tradesAirForCredits}`,
                        value: `sellAir`,
                    });
                }
                if (tradingVessel.tradesFood > 0) {
                    choices.push({
                        title: ` Buy Food for ${tradingVessel.tradesFoodForCredits}`,
                        value: `buyFood`,
                    });
                }
                if (tradingVessel.tradesFood < 0) {
                    choices.push({
                        title: ` Sell Food for ${tradingVessel.tradesFoodForCredits}`,
                        value: `sellFood`,
                    });
                }

                choices.push({
                    title: `Back`,
                    value: `back`,
                })

                let airStorageCeiling: number = 0;
                let powerStorageCeiling: number = 0;
                let foodStorageCeiling: number = 0;

                stationState.stationModules.forEach(module => {
                    airStorageCeiling += module.airStorage;
                    powerStorageCeiling += module.powerStorage;
                    foodStorageCeiling += module.foodStorage;
                });
                printStationStatus(stationState);
                log(` Credits: ${stationState.credits} Power: ${stationState.power} / ${powerStorageCeiling} | Air: ${stationState.air} / ${airStorageCeiling} | Food: ${stationState.food} / ${foodStorageCeiling}`)

                // trade menu
                tradeAnswer = await prompts({
                    type: "select",
                    name: "value",
                    message: `Trade with the ${tradingVessel.name}`,
                    choices: choices,
                });

                if (tradeAnswer.value !== 'back') {
                    if (tradeAnswer.value === 'buyPower') {
                        await buyResourceMenu(stationState, tradingVessel, powerStorageCeiling, 'power', () => tradingVessel.tradesPower, () => tradingVessel.tradesPowerForCredits, () => stationState.power);
                    }
                    if (tradeAnswer.value === 'buyAir') {
                        await buyResourceMenu(stationState, tradingVessel, airStorageCeiling, 'air', () => tradingVessel.tradesAir, () => tradingVessel.tradesAirForCredits, () => stationState.air);
                    }
                    if (tradeAnswer.value === 'buyFood') {
                        await buyResourceMenu(stationState, tradingVessel, foodStorageCeiling, 'food', () => tradingVessel.tradesFood, () => tradingVessel.tradesFoodForCredits, () => stationState.food);
                    }
                    if (tradeAnswer.value === 'sellPower') {
                        await sellResourceMenu(stationState, tradingVessel, powerStorageCeiling, 'power', () => tradingVessel.tradesPower, () => tradingVessel.tradesPowerForCredits, () => stationState.power);
                    }
                    if (tradeAnswer.value === 'sellAir') {
                        await sellResourceMenu(stationState, tradingVessel, airStorageCeiling, 'air', () => tradingVessel.tradesAir, () => tradingVessel.tradesAirForCredits, () => stationState.air);
                    }
                    if (tradeAnswer.value === 'sellFood') {
                        await sellResourceMenu(stationState, tradingVessel, foodStorageCeiling, 'food', () => tradingVessel.tradesFood, () => tradingVessel.tradesFoodForCredits, () => stationState.food);
                    }
                }
            } while (tradeAnswer?.value !== 'back' );
        }
    }
}

async function buyResourceMenu(stationState: StationState, tradingVessel: Vessel, resourceStorageCeiling: number, resource: string, tradesResource: () => number, tradesResourceForCredits: () => number, stationResource: () => number) {
    let amount = await prompts({
        type: "number",
        name: "valueToBuy",
        message: `Buy ${resource} for ${tradesResourceForCredits()} credits. Vessel has ${tradesResource()} to sell`,
        initial: 1,
        validate: value => {
            return value >= 0 && 
                // can't take more than the vessel has to trade
                tradesResource() - value >= 0 &&
                // can't take more than the station can store
                value + stationResource() <= resourceStorageCeiling &&
                // can't take more than the station can afford
                stationState.credits - (value * tradesResourceForCredits()) >= 0
        }

    });
    if (amount.valueToBuy > 0) {
        const cont = await prompts({
            type: 'confirm',
            name: 'value',
            message: `Buy ${amount.valueToBuy} ${resource} from ${tradingVessel.name} for ${amount.valueToBuy * tradesResourceForCredits()} credits?`,
            initial: true
        });
        if (cont.value === true) {
            // deduct resource from vessel and add resource to station
            if (resource === 'power') {
                tradingVessel.tradesPower -= amount.valueToBuy;
                stationState.power += amount.valueToBuy;
            } else if (resource === 'air') {
                tradingVessel.tradesAir -= amount.valueToBuy;
                stationState.air += amount.valueToBuy;
            } else if (resource === 'food') {
                tradingVessel.tradesFood -= amount.valueToBuy;
                stationState.food += amount.valueToBuy;
            }

            // deduct credits from station
            stationState.credits -= amount.valueToBuy * tradesResourceForCredits();
        }
    }
}

async function sellResourceMenu(stationState: StationState, tradingVessel: Vessel, resourceStorageCeiling: number, resource: string, tradesResource: () => number, tradesResourceForCredits: () => number, stationResource: () => number) {
    let amount = await prompts({
        type: "number",
        name: "valueToSell",
        message: `Sell ${resource} for ${tradesResourceForCredits()} credits. Vessel can buy ${Math.abs(tradesResource())}`,
        initial: 1,
        validate: value => {
            return value >= 0 && 
                // can't sell more than the vessel can buy
                tradesResource() + value <= 0 &&
                // can't sell more than the station has
                stationResource() - value >= 0 &&
                // can't take more than the vessel can afford
                stationState.credits - (value * tradesResourceForCredits()) >= 0
        }

    });
    if (amount.valueToSell > 0) {
        const cont = await prompts({
            type: 'confirm',
            name: 'value',
            message: `Sell ${amount.valueToSell} ${resource} to ${tradingVessel.name} for ${amount.valueToSell * tradesResourceForCredits()} credits?`,
            initial: true
        });
        if (cont.value === true) {
            // add resource to vessel and deduct resource from station
            if (resource === 'power') {
                tradingVessel.tradesPower += amount.valueToSell;
                stationState.power -= amount.valueToSell;
            } else if (resource === 'air') {
                tradingVessel.tradesAir += amount.valueToSell;
                stationState.air -= amount.valueToSell;
            } else if (resource === 'food') {
                tradingVessel.tradesFood += amount.valueToSell;
                stationState.food -= amount.valueToSell;
            }

            // add credits to station
            stationState.credits += amount.valueToSell * tradesResourceForCredits();
            // deduct credits from vessel
            tradingVessel.credits -= amount.valueToSell * tradesResourceForCredits();
        }
    }
}

async function vesselsNearbyMenu(stationState: StationState) {
    console.clear();
    if (stationState.vesselQueue.length === 0) {
        log(`There's nothing out there...`);
        } else {
        const chooseVesselAnswer: Answers<string> = await prompts({
            type: "select",
            name: "value",
            message: `Choose a nearby vessel to examine`,
            choices: stationState.vesselQueue.map(vessel => {
                return {
                    title: vessel.timeInQueue === 1 || vessel.timeInQueue === -1  ? chalk.cyan.italic(`<Warp Signature Detected>`) : chalk.hex(getVesselColor(vessel, stationState.factions))(vessel.name),
                    value: vessel.name
                };
            }),
        });

        if (chooseVesselAnswer.value === undefined) {
            return;
        }
        const vessel = stationState.vesselQueue.find(vessel => vessel.name === chooseVesselAnswer.value);

        if (vessel === undefined) {
            log(` There's nothing here... `);
            return;
        }

        if (vessel.timeInQueue === -1 || vessel.timeInQueue === 1) {
            log(` Scanners indicate a warp signature of a ${vessel.class} starship`);
        } else {
            log(`This is the ${vessel?.name}, a ${vessel?.class} starship. It's affiliated with the ${ stationState.factions.find(faction => faction.name === vessel?.faction)?.name} `)
            log(`Scanners indicate that this vessel is${vessel.timeInQueue <= 0 ? ` leaving the area ` : ` waiting to dock with the station `}`);
        }
    }
    const cont = await prompts({
        type: 'confirm',
        name: 'value',
        message: 'Continue...',
        initial: true
      });
}

function getUnassignedCrew(stationState: StationState) {
    return stationState.crew - getAssignedCrew(stationState);
}

function getAssignedCrew(stationState: StationState) {
    let crewAssigned = 0;
    stationState.stationModules.forEach(module => {
        crewAssigned += module.crewApplied;
    })
    return crewAssigned;
}

async function assignCrewMenu(stationState: StationState): Promise<StationModule | undefined> {
    console.clear();
    const unassignedCrew = getUnassignedCrew(stationState);
    const moduleName: Answers<string> = await prompts({
        type: "select",
        name: "value",
        message: `Crew: ${stationState.crew}  Unassigned: ${unassignedCrew} \n Choose a module to assign crew`,
        choices: stationState.stationModules.map(module => {
            return {
                title: `${chalk.white.bold.bgGreen(module.name)}: ${module.crewApplied}/${module.crewRequired}`,
                value: module.name
            };
        }),
    });

    const moduleToAssign = stationState.stationModules.find(value => moduleName.value === value.name);
    if (moduleToAssign?.crewRequired === 0) { 
        log(chalk.gray(` This module requires no crew. Assigning crew will have no effect`));
    } else if (moduleToAssign?.crewApplied === moduleToAssign?.crewRequired) {
        log(chalk.gray(` This module is fully staffed and operational`));
    }
    if (moduleToAssign !== undefined) {
        const crewApplied = moduleToAssign?.crewApplied;
        const crewAssignmentForModule = await prompts({
            type: "number",
            name: "value",
            message: "Crew Assignment",
            initial: moduleToAssign.crewApplied,
            validate: value => {
                return value >= 0 && getAssignedCrew(stationState) - crewApplied + value <= stationState.crew               
            }
        })
        // set the crew assignment to the module
        log(`crewAssignementForModule.value ${crewAssignmentForModule.value}`)
        if (crewAssignmentForModule.value >= 0) {
            moduleToAssign.crewApplied = crewAssignmentForModule.value;
        }
    }
    return moduleToAssign;
}

function progressBar(stops:number, value:number, max:number, filled:chalk.Chalk, unfilled:chalk.Chalk) {
    let string = '[';
    const filledTo = stops * value / max;
    for (let i = 0; i < stops; i++) {
        if (i < filledTo) {
            string += filled(' ');
        } else {
            string += unfilled(' ');
        }
    }
    string += ']';
    return string;
}

function getVesselColor(vessel: Vessel | undefined, factions: Faction[]): string {
    const vesselFaction = factions.find(faction => faction.name === vessel?.faction);
    return vesselFaction !== undefined ? vesselFaction.hexColor : 'FFFFFF';
}

function printTable(moduleTable: string[][]): any {
    moduleTable.forEach(row => {
        let cells = '';
        for(let i = 0; i < row.length; i++) {
            cells = cells + row[i] + ' | ';
        }   
        log(cells);
    });
}

