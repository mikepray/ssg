import prompts, { Answers } from "prompts";
import chalk from "chalk";
import { builtinModules } from "module";


const log = console.log;

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
  dockRings: [{ vessel: "Shoyu B-9" }, { vessel: "" }],
  funding: 10,
  crewSalary: 2,
  daysWithoutFood: 0,
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
    funding: number,
    crewSalary: number,
    stationModules: StationModule[],
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
    vessel?: string
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
    log(chalk.bold.bgGreen(`\n Space Station ${stationState.stationName} | Stardate: ${stardate} `));
    let moduleString = "";
    stationState.stationModules.forEach(mod => {
        moduleString += (mod.crewApplied >= mod.crewRequired && stationState.power + mod.power >= 0 ? chalk.yellow.bgGreen(`[${mod.name}]`) : chalk.gray(`[${mod.name}]`)) + chalk.bgGreen(' ')
    })
    log(moduleString);
    // print resources
    log(`
        ${chalk.bold.bgBlue(        ` Crew:    ${stationState.crew}   Unassigned: ${getUnassignedCrew(stationState)}   Morale: ${stationState.morale}/100    Salary: ${stationState.crewSalary}c`)} 
        ${chalk.bold.bgYellowBright(` Power:   ${stationState.power}/${powerStorageCeiling}Mah `)} 
        ${chalk.bold.bgWhite(       ` Air:     ${stationState.air}/${airStorageCeiling}L   `)} 
        ${chalk.bold.bgMagenta(     ` Food:    ${stationState.food}/${foodStorageCeiling}u   `)}
        ${chalk.bold.bgCyan(        ` Credits: ${stationState.credits}c `)}      
    `);
    stationState.dockRings.forEach(dockRing => {
        log(`${chalk.bold.bgGrey(` Dock Ring 1: ${dockRing.vessel !== '' ? dockRing.vessel : 'None'} `)}`);
    });
    log(`${chalk.bold.bgGrey(` Vessels in docking queue: None `)}`);
    log(` `);

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
                title: "Docking",
                description: "Manage docked vessels",
                value: "docking"
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
        await dockingMenu();
    } else if (input.value === 'crew') {
        const moduleWithReassignedCrew = await assignCrew(stationState);
        if (moduleWithReassignedCrew !== undefined) {
            const index = stationState.stationModules.findIndex(mod => {
                mod.name === moduleWithReassignedCrew?.name;
            });
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

function dockingMenu() {
    throw new Error("Function not implemented.");
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
                title: `${chalk.bgGreen(module.name)}: ${module.crewApplied}/${module.crewRequired}`,
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

