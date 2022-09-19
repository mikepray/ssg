"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prompts_1 = __importDefault(require("prompts"));
const chalk_1 = __importDefault(require("chalk"));
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
function askStartingOptions() {
    return __awaiter(this, void 0, void 0, function* () {
        return {
            stationName: yield (0, prompts_1.default)({
                type: "text",
                name: "value",
                message: "What is the name of your space station?",
                validate: (value) => (value === "" ? `Enter a name` : true),
            }),
            baseStation: yield (0, prompts_1.default)({
                type: "select",
                name: "value",
                message: "Choose a starting station. This determines your starting modules, credits, and funding",
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
            location: yield (0, prompts_1.default)({
                type: "select",
                name: "value",
                message: "Choose a location. Your station is immobile and will remain at this place",
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
    });
}
function gameLoop(stardate, stationState) {
    return __awaiter(this, void 0, void 0, function* () {
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
        log(chalk_1.default.bold.bgGreen(`\n Space Station ${stationState.stationName} | Stardate: ${stardate} `));
        let moduleString = "";
        stationState.stationModules.forEach(mod => {
            moduleString += (mod.crewApplied >= mod.crewRequired && stationState.power + mod.power >= 0 ? chalk_1.default.yellow.bgGreen(`[${mod.name}]`) : chalk_1.default.gray(`[${mod.name}]`)) + chalk_1.default.bgGreen(' ');
        });
        log(moduleString);
        // print resources
        log(`
        ${chalk_1.default.bold.bgBlue(` Crew:    ${stationState.crew}   Unassigned: ${getUnassignedCrew(stationState)}   Morale: ${stationState.morale}/100    Salary: ${stationState.crewSalary}c`)} 
        ${chalk_1.default.bold.bgYellowBright(` Power:   ${stationState.power}/${powerStorageCeiling}Mah `)} 
        ${chalk_1.default.bold.bgWhite(` Air:     ${stationState.air}/${airStorageCeiling}L   `)} 
        ${chalk_1.default.bold.bgMagenta(` Food:    ${stationState.food}/${foodStorageCeiling}u   `)}
        ${chalk_1.default.bold.bgCyan(` Credits: ${stationState.credits}c `)}      
    `);
        stationState.dockRings.forEach(dockRing => {
            log(`${chalk_1.default.bold.bgGrey(` Dock Ring 1: ${dockRing.vessel !== '' ? dockRing.vessel : 'None'} `)}`);
        });
        log(`${chalk_1.default.bold.bgGrey(` Vessels in docking queue: None `)}`);
        log(` `);
        // wait for input
        const input = yield (0, prompts_1.default)({
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
            yield moduleMenu(stationState);
        }
        else if (input.value === 'docking') {
            yield dockingMenu();
        }
        else if (input.value === 'crew') {
            const moduleWithReassignedCrew = yield assignCrew(stationState);
            if (moduleWithReassignedCrew !== undefined) {
                const index = stationState.stationModules.findIndex(mod => {
                    mod.name === (moduleWithReassignedCrew === null || moduleWithReassignedCrew === void 0 ? void 0 : moduleWithReassignedCrew.name);
                });
                stationState.stationModules[index] = moduleWithReassignedCrew;
            }
        }
        else if (input.value === 'wait') {
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
                stationState.crew = subtractWithFloor(stationState.crew, 1, 0);
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
                throw new Error("Game Over - you have no crew left!");
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
            });
            // roll for input resources
            // roll for trade
            // roll for problems
            // problem loop
        }
        gameLoop(stardate, stationState);
    });
}
function moduleMenu(stationState) {
    return __awaiter(this, void 0, void 0, function* () {
        console.clear();
        stationState.stationModules.forEach(module => {
            const op = module.crewApplied >= module.crewRequired && module.wasPowered ?
                chalk_1.default.yellow(`Operational`) :
                chalk_1.default.grey(`Not Operational `);
            log(`
        ${chalk_1.default.bold.white.bgGreen(module.name)} - ${chalk_1.default.gray(module.description)} - ${op}`);
            log(`            ${chalk_1.default.bgBlue(`Crew:    ${module.crewApplied} / ${module.crewRequired}`)}`);
            log(`            ${chalk_1.default.bgWhite(`Air:     ${module.air}L`)}`);
            log(`            ${chalk_1.default.bgYellow(`Power:   ${module.power}Mah`)}`);
            log(`            ${chalk_1.default.bgMagenta(`Food:    ${module.food}u`)}`);
            log(`            ${chalk_1.default.bold.bgGray('Storage')}`);
            if (module.powerStorage) {
                log(`                ${chalk_1.default.bgYellow(`${module.powerStorage}Mah Power`)}`);
            }
            if (module.airStorage) {
                log(`               ${chalk_1.default.bgWhite(`${module.airStorage}L Air`)}`);
            }
            if (module.foodStorage) {
                log(`               ${chalk_1.default.bgMagenta(`${module.foodStorage}u Food`)}`);
            }
        });
        const cont = yield (0, prompts_1.default)({
            type: 'confirm',
            name: 'value',
            message: 'Continue...',
            initial: true
        });
    });
}
function subtractWithFloor(n, i, floor) {
    if (n - i < floor) {
        n = floor;
    }
    else {
        n -= i;
    }
    return n;
}
function addWithCeiling(n, i, ceiling) {
    if (n + i > ceiling) {
        n = ceiling;
    }
    else {
        n += i;
    }
    return n;
}
function addWithFloor(n, i, floor) {
    if (n + i < floor) {
        n = floor;
    }
    else {
        n += i;
    }
    return n;
}
function addWithCeilingAndFloor(n, i, floor, ceiling) {
    if (n + i > ceiling) {
        n = ceiling;
    }
    else if (n + i < floor) {
        n = floor;
    }
    else {
        n += i;
    }
    return n;
}
function dockingMenu() {
    throw new Error("Function not implemented.");
}
function getUnassignedCrew(stationState) {
    return stationState.crew - getAssignedCrew(stationState);
}
function getAssignedCrew(stationState) {
    let crewAssigned = 0;
    stationState.stationModules.forEach(module => {
        crewAssigned += module.crewApplied;
    });
    return crewAssigned;
}
function assignCrew(stationState) {
    return __awaiter(this, void 0, void 0, function* () {
        console.clear();
        const unassignedCrew = getUnassignedCrew(stationState);
        const moduleName = yield (0, prompts_1.default)({
            type: "select",
            name: "value",
            message: `Crew: ${stationState.crew}  Unassigned: ${unassignedCrew} \n Choose a module to assign crew`,
            choices: stationState.stationModules.map(module => {
                return {
                    title: `${chalk_1.default.bgGreen(module.name)}: ${module.crewApplied}/${module.crewRequired}`,
                    value: module.name
                };
            }),
        });
        const moduleToAssign = stationState.stationModules.find(value => moduleName.value === value.name);
        if ((moduleToAssign === null || moduleToAssign === void 0 ? void 0 : moduleToAssign.crewRequired) === 0) {
            log(chalk_1.default.gray(` This module requires no crew. Assigning crew will have no effect`));
        }
        else if ((moduleToAssign === null || moduleToAssign === void 0 ? void 0 : moduleToAssign.crewApplied) === (moduleToAssign === null || moduleToAssign === void 0 ? void 0 : moduleToAssign.crewRequired)) {
            log(chalk_1.default.gray(` This module is fully staffed and operational`));
        }
        if (moduleToAssign !== undefined) {
            const crewApplied = moduleToAssign === null || moduleToAssign === void 0 ? void 0 : moduleToAssign.crewApplied;
            const crewAssignmentForModule = yield (0, prompts_1.default)({
                type: "number",
                name: "value",
                message: "Crew Assignment",
                initial: moduleToAssign.crewApplied,
                validate: value => {
                    return value >= 0 && getAssignedCrew(stationState) - crewApplied + value <= stationState.crew;
                }
            });
            // set the crew assignment to the module
            log(`crewAssignementForModule.value ${crewAssignmentForModule.value}`);
            if (crewAssignmentForModule.value >= 0) {
                moduleToAssign.crewApplied = crewAssignmentForModule.value;
            }
        }
        return moduleToAssign;
    });
}
