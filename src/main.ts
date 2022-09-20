import prompts, { Answers } from "prompts";
import chalk from "chalk";
import { builtinModules } from "module";


const { log } = console;

let stardate = 1000;
/*
askStartingOptions().then((opts) => {
       gameLoop(stardate, opts);
    }
);*/
gameLoop(1, {
  stationName: "DS-10",
  baseStation: "defense",
  location: "frontier",
  crew: 5,
  morale: 100,
  power: 100,
  air: 100,
  food: 100,
  credits: 1000,
  dockRings: [{ 
    vessel: {
    name: "Zeelandia",
    class: "Space Station Crew Transport",
    faction: "New Hague Merchants",
    generatesAir: 0,
    generatesPower: 1,
    generatesFood: 0,
    tradesAir: 0,
    tradesPower: 0,
    tradesFood: 0,
    credits: 0,
    tradesAirForCredits: 0,
    tradesPowerForCredits: 0,
    tradesFoodForCredits: 0,
    morale: 0,
    queueTolerance: 1,
    dockingDaysRequested: 5,
    dockingFeePriceElasticity: .5,
    timeInQueue: 0,
  } }, {  }],
  vesselQueue: [],
  funding: 10,
  crewSalary: 2,
  daysWithoutFood: 0,
  belongsToFaction: "New Hague Merchants",
  factions: [
    {
        name: "New Hague Merchants",
        description: "Interstellar trade guild",
        favor: 10,
        hexColor: 'F5A623',
    },
    {
        name: "Elythorum Cabal",
        description: "Mysterious aliens",
        favor: 0,
        hexColor: '3EE766',
    },
    {
        name: "Space Freighter Union",
        description: "Union of independent space freighters",
        favor: 10,
        hexColor: '3E76E7',
    },
    {
        name: "Earth Defense Cabinet",
        description: "Military space defense administration",
        favor: 10,
        hexColor: '2CB36F',
    },
    { 
        name: "Unaligned",
        description: "Ships not aligned with any faction",
        favor: 0,
        hexColor: '828282'
    },
  ],
  stationModules: [{
    name: "Command Module",
    description: "The command center of the station",
    power: -2,
    air: 0,
    food: 0,
    credits: 0,
    morale: 0,
    crewRequired: 3,
    crewApplied: 3,
    powerStorage: 20,
    airStorage: 20,
    foodStorage: 20,
    powerPurchaseCost: -1,
    airPurchaseCost: -1,
    foodPurchaseCost: -1,
    creditPurchaseCost: -1,
    wasPowered: true,
  },
  {
    name: "Reactor",
    description: "Fusion reactor",
    power: 10,
    air: 0,
    food: 0,
    credits: 0,
    morale: 0,
    crewRequired: 2,
    crewApplied: 2,
    powerStorage: 0,
    airStorage: 0,
    foodStorage: 0,
    powerPurchaseCost: -1,
    airPurchaseCost: -1,
    foodPurchaseCost: -1,
    creditPurchaseCost: -1,
    wasPowered: true,
  },
  {
    name: "Crew Quarters",
    description: "Barracks, mess hall, gravity ring, food and air storage",
    power: -5,
    air: 0,
    food: 0,
    credits: 0,
    morale: 2,
    crewRequired: 0,
    crewApplied: 0,
    powerStorage: 0,
    airStorage: 100,
    foodStorage: 100,
    powerPurchaseCost: -1,
    airPurchaseCost: -1,
    foodPurchaseCost: -1,
    creditPurchaseCost: -1,
    wasPowered: true,
  },
  {
    name: "Battery Bank",
    description: "Batteries",
    power: 0,
    air: 0,
    food: 0,
    credits: 0,
    morale: 0,
    crewRequired: 0,
    crewApplied: 0,
    powerStorage: 100,
    airStorage: 0,
    foodStorage: 0,
    powerPurchaseCost: -1,
    airPurchaseCost: -1,
    foodPurchaseCost: -1,
    creditPurchaseCost: -1,
    wasPowered: true,
  },
  {
    name: "Air Recycler",
    description: "Recycles air",
    power: -3,
    air: 5,
    food: 0,
    credits: 0,
    morale: 0,
    crewRequired: 0,
    crewApplied: 0,
    powerStorage: 0,
    airStorage: 0,
    foodStorage: 0,
    powerPurchaseCost: -1,
    airPurchaseCost: -1,
    foodPurchaseCost: -1,
    creditPurchaseCost: -1,
    wasPowered: true,
  }
]
});

const newVessel: Vessel = {
    name: "Big Fred",
    class: "Space Truck",
    faction: "Space Freighter Union",
    generatesAir: 0,
    generatesPower: 0,
    generatesFood: 0,
    tradesAir: 0,
    tradesPower: -20,
    tradesFood: 100,
    tradesAirForCredits: 0,
    tradesPowerForCredits: 10,
    tradesFoodForCredits: 5,
    credits: 200,
    morale: 1,
    queueTolerance: 2,
    dockingDaysRequested: 3,
    dockingFeePriceElasticity: .5,
    timeInQueue: 0,
}

interface StationState {
    stationName: string,
    baseStation: string,
    location: string,
    crew: number,
    morale: number,
    power: number,
    air: number,
    food: number,
    credits: number,
    daysWithoutFood: number,
    dockRings: DockRing[],
    vesselQueue: Vessel[],
    funding: number,
    crewSalary: number,
    stationModules: StationModule[],
    belongsToFaction: string,
    factions: Faction[],
}

interface StationModule {
    name: string,
    description: string,
    /* resource cost per day. positive gains resource, negative spends resource */
    power: number,
    air: number,
    food: number,
    credits: number,
    morale: number,
    crewRequired: number,
    crewApplied: number,
    powerStorage: number,
    airStorage: number,
    foodStorage: number,
    powerPurchaseCost: number,
    airPurchaseCost: number,
    foodPurchaseCost: number,
    creditPurchaseCost: number,
    wasPowered: boolean, // true if the module was operational the last turn
}

interface DockRing {
    vessel?: Vessel
}

interface Vessel {
    name: string,
    class: string,
    faction: string,
    /* the amount of air, power, and food the vessel or its crew consumes or generates when docked with the station */
    generatesAir: number,
    generatesPower: number,
    generatesFood: number,
    /* the amount of air, power, or food the vessel has to trade. negative means the vessel wants a resource, positive means it will sell */
    tradesAir: number,
    tradesPower: number,
    tradesFood: number,
    /* the amount of credits a vessel will trade a resource for. negative means it is selling, positive it is buying */
    tradesAirForCredits: number,
    tradesPowerForCredits: number,
    tradesFoodForCredits: number,
    credits: number,
    morale: number, // the morale boost (or penalty) to the stations' crew while the vessel is docked
    queueTolerance: number, // the amount in days the vessel will tolerate staying in the docking queue before leaving the area
    dockingDaysRequested: number, // the number of days the vessel wants to stay docked
    /* the vessel's sensitivity to docking fees. 1 = fully elastic, 0 = inelastic. The more elastic, the less likely the vessel will
    be willing to dock with the station if it charges higher docking fees */
    dockingFeePriceElasticity: number, 
    timeInQueue: number, // Positive if the vessel is warping in, negative if it's warping out
}

interface Faction {
    name: string,
    description: string,
    favor: number,
    hexColor: string,
}

interface StartingOptions {
  stationName?: Answers<string>;
  baseStation?: Answers<string>;
  location?: Answers<string>;
}

async function askStartingOptions(): Promise<StartingOptions> {
  return {
    stationName: await prompts({
      type: "text",
      name: "value",
      message: "What is the name of your space station?",
      validate: (value) => (value === "" ? `Enter a name` : true),
    }),

    baseStation: await prompts({
      type: "select",
      name: "value",
      message:
        "Choose a starting station. This determines your starting modules, credits, and funding",
      choices: [
        {
          title: "Jeitai-47 Defense Platform",
          description: "Good starting credits, good funding",
          value: "defense",
        },
        {
          title: "New Hague Market",
          description: "Great starting credits, terrible funding",
          value: "trade",
        },
        {
          title: "Babel 6 Science Outpost",
          description: "Low starting credits, low funding",
          value: "science",
        },
      ],
      initial: 0,
    }),

    location: await prompts({
      type: "select",
      name: "value",
      message:
        "Choose a location. Your station is immobile and will remain at this place",
      choices: [
        {
          title: "Frontier",
          description: "Orbiting a star at edge of civilized space",
          value: "frontier",
        },
        {
          title: "Gate Nexus",
          description: "Parked in a nexus of FTL gates",
          value: "nexus",
        },
        {
          title: "Wormhole",
          description: "Orbiting a mysterious wormhole",
          value: "wormhole",
        },
      ],
      initial: 0,
    }),
  };
}

async function gameLoop(stardate: number, stationState: StationState) {
    
    // iterate through station modules to determine storage ceilings
    let airStorageCeiling = 0;
    let powerStorageCeiling = 0;
    let foodStorageCeiling = 0;
    stationState.stationModules.forEach(module => {
        airStorageCeiling += module.airStorage;
        powerStorageCeiling += module.powerStorage;
        foodStorageCeiling += module.foodStorage;
    });

    console.clear();

    // print stardate
    log(chalk.bold.bgGreen(`\n Space Station ${stationState.stationName} | Stardate: ${stardate} | ${stationState.crew} Crew (${getUnassignedCrew(stationState)} idle) ${chalk.bgRedBright.bold(` Credits: ${stationState.credits}`)}`));
    let moduleString = "";
    stationState.stationModules.forEach(mod => {
        moduleString += (mod.crewApplied >= mod.crewRequired && stationState.power + mod.power >= 0 ? chalk.green(`[${mod.name}]`) : chalk.gray(`[${mod.name}]`)) + (' ')
    })
    log(moduleString + '\n');
    // print resources
    const crewString =  ` Morale: ${progressBar(10, stationState.morale, 100, chalk.bgRedBright, chalk.grey)} `
    const powerString = ` Power:  ${progressBar(powerStorageCeiling / 10, stationState.power, powerStorageCeiling, chalk.bgYellow.yellowBright, chalk)} - ${stationState.power}/${powerStorageCeiling}Mwh `
    const airString =   ` Air:    ${progressBar(airStorageCeiling / 10, stationState.air, airStorageCeiling, chalk.bgWhite, chalk)} - ${stationState.air}/${airStorageCeiling}Kl `
    const foodString =  ` Food:   ${progressBar(foodStorageCeiling / 10, stationState.food, foodStorageCeiling, chalk.bgMagenta, chalk)} - ${stationState.food}/${foodStorageCeiling}k `
    
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
        const moduleWithReassignedCrew = await assignCrew(stationState);
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
                stationState.power = addWithCeilingAndFloor(stationState.power, module.power, 0, powerStorageCeiling);
                stationState.air = addWithCeilingAndFloor(stationState.air, module.air, 0, airStorageCeiling);
                stationState.food = addWithCeilingAndFloor(stationState.food, module.food, 0, foodStorageCeiling);
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

async function moduleMenu(stationState: StationState) {
    console.clear();
    stationState.stationModules.forEach(module => {
        const op = module.crewApplied >= module.crewRequired && module.wasPowered ? 
            chalk.yellow(`Operational` ) :
            chalk.grey(`Not Operational `);
        log(`
        ${chalk.bold.white.bgGreen(module.name)} - ${chalk.gray(module.description)} - ${op}`)
        
        log(`            ${chalk.bgBlue(   `Crew:    ${module.crewApplied} / ${module.crewRequired}`)}`)
        log(`            ${chalk.bgWhite(  `Air:     ${module.air}L`)}`)
        log(`            ${chalk.bgYellow( `Power:   ${module.power}Mah`)}`)
        log(`            ${chalk.bgMagenta(`Food:    ${module.food}u`)}`)
        log(`            ${chalk.bold.bgGray('Storage')}`);

        if (module.powerStorage) {
            log(`                ${chalk.bgYellow(`${module.powerStorage}Mah Power`)}`)
        }
        if (module.airStorage) {
            log(`               ${chalk.bgWhite(`${module.airStorage}L Air`)}`)
        }
        if (module.foodStorage) {
            log(`               ${chalk.bgMagenta(`${module.foodStorage}u Food`)}`)
        }

    });

    const cont = await prompts({
        type: 'confirm',
        name: 'value',
        message: 'Continue...',
        initial: true
      });
}

function subtractWithFloor(n:number, i:number, floor:number) {
    if (n - i < floor) {
        n = floor;
    } else {
        n -= i;
    }
    return n;
}

function addWithCeiling(n:number, i:number, ceiling:number) {
    if (n + i > ceiling) {
        n = ceiling;
    } else {
        n += i;
    }
    return n;
}

function addWithFloor(n:number, i:number, floor:number) {
    if (n + i < floor) {
        n = floor;
    } else {
        n += i;
    }
    return n;
}

function addWithCeilingAndFloor(n:number, i:number, floor:number, ceiling:number) {
    if (n + i > ceiling ) {
        n = ceiling;
    } else if (n + i < floor) {
        n = floor;
    } else {
        n += i;
    }
    return n;
}

async function dockingMenu(stationState: StationState) {
    console.clear();
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
                console.clear();
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

async function assignCrew(stationState: StationState): Promise<StationModule | undefined> {
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
