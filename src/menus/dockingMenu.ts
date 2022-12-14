import chalk from "chalk";
import prompts, { Answers, Choice } from "prompts";
import { vessels } from "../data/vessels";
import { printStationStatus } from "../game";
import { Log, StationModule, StationState, Vessel, VesselDockingStatus } from "../types";
import { getVesselColor, addWithCeiling, getStationDockingPorts } from "../utils";
import { getModuleShortCodes, moduleMenu, printModule } from "./moduleMenu";

export async function dockingMenu(stationState: StationState, log: Log, clear: () => void): Promise<StationState> {
    clear();
    printStationStatus(stationState, log, clear);

    const choices: Choice[] = stationState.vessels.filter(v => v.dockingStatus === VesselDockingStatus.Docked).map(vessel => {
        return {
            title: `${chalk.hex(getVesselColor(vessel, stationState.factions))(vessel.name)}`,
            value: vessel.name
        };
    });

    if (choices.length < getStationDockingPorts(stationState)) {
        for (let i = 0; i < getStationDockingPorts(stationState) - choices.length; i++) {
            choices.push({
                title: 'Nothing docked'
            });
        }
    }

    const chooseVesselAnswer: Answers<string> = await prompts({
        type: "select",
        name: "value",
        message: `Choose a docked vessel to manage`,
        choices: choices,
    });

    const vessel = stationState.vessels.find(v => v.name === chooseVesselAnswer.value)
    if (vessel !== undefined) {
        clear();
        printStationStatus(stationState, log, clear);
        log(`This is the ${vessel.name}, class ${vessel.class}. It's affiliated with the ${ stationState.factions.find(faction => faction.name === vessel.faction)?.name} `)

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
            return stationState.foldAndCombineAsync(async station => {
                const tradeMutation = await trade(station, vessel, log, clear)
                if (tradeMutation !== undefined) {
                    return {
                        ...tradeMutation.mutateStation,
                        vessels: station.vessels.map(v => v.name === tradeMutation.mutateVessel.name ? tradeMutation.mutateVessel : v)
                    }
                }
                return { }
            })
        } else if (manageVesselAnswer.value === 'evict') {
            const cont = await prompts({
                type: 'toggle',
                name: 'value',
                active: 'yes',
                inactive: 'no',
                message: `Really evict ${vessel.name} from the station? Your station will lose favor with the ${vessel.faction} `,
                initial: false
            });
            if (cont.value === true) {
                return stationState.foldAndCombine(station => {
                    return { vessels: station.vessels.map(v => v.name === vessel.name
                        ? vessel.fold({dockingStatus: VesselDockingStatus.NearbyWaitingToLeave})
                        : vessel) }
                })
            }
        } else if (manageVesselAnswer.value === 'seize') {
            const cont = await prompts({
                type: 'toggle',
                name: 'value',
                active: 'yes',
                inactive: 'no',
                message: `Really seize the cargo of ${vessel.name}? NB: Modules for sale cannot be seized and your station will lose significant favor with the ${vessel.faction} `,
                initial: false
            });
            if (cont.value === true) {
                return stationState.foldAndCombine(({air, power, food, vessels, factions}) => {
                    let airStorageCeiling: number = 0;
                    let powerStorageCeiling: number = 0;
                    let foodStorageCeiling: number = 0;

                    stationState.stationModules.forEach(module => {
                        airStorageCeiling += module.airStorage;
                        powerStorageCeiling += module.powerStorage;
                        foodStorageCeiling += module.foodStorage;
                    });
                    return { 
                        air: air + vessel.tradesAir > air ? addWithCeiling(air, vessel.tradesAir, airStorageCeiling) : air,
                        power: power + vessel.tradesPower > power ? addWithCeiling(power, vessel.tradesPower, powerStorageCeiling) : power,
                        food: food + vessel.tradesFood > food ? addWithCeiling(food, vessel.tradesFood, foodStorageCeiling) : food,
                        factions: factions.map(faction => 
                            faction.name === vessel?.faction && faction.favor !== -5
                            ? { ...faction, favor: faction.favor + 1}
                            : faction
                        ),
                        vessels: vessels.map(v => v.name === vessel.name
                        ? v.fold({tradesAir: 0, tradesFood: 0, tradesPower: 0, modulesForSale: []})
                        : v) }
                })
            }
        }
    }
    return stationState;
}

type TradeMutation = {
    mutateStation: Partial<StationState>,
    mutateVessel: Vessel,
}

async function trade(stationState: StationState, vessel: Vessel, log: Log, clear: () => void): Promise<TradeMutation> {
    let tradeAnswer: Answers<string>;
    const choices: prompts.Choice[] = [ ];

    if (vessel.tradesPower > 0) {
        choices.push({
            title: `Buy Power for ${vessel.tradesPowerForCredits}`,
            value: `buyPower`,
        });
    } 
    if (vessel.tradesPower < 0) {
        choices.push({
            title: `Sell Power for ${vessel.tradesPowerForCredits}`,
            value: `sellPower`,
        });
    }
    if (vessel.tradesAir > 0) {
        choices.push({
            title: `Buy Air for ${vessel.tradesAirForCredits}`,
            value: `buyAir`,
        });
    }     
    if (vessel.tradesAir < 0) {
        choices.push({
            title: `Sell Air for ${vessel.tradesAirForCredits}`,
            value: `sellAir`,
        });
    }
    if (vessel.tradesFood > 0) {
        choices.push({
            title: `Buy Food for ${vessel.tradesFoodForCredits}`,
            value: `buyFood`,
        });
    }
    if (vessel.tradesFood < 0) {
        choices.push({
            title: `Sell Food for ${vessel.tradesFoodForCredits}`,
            value: `sellFood`,
        });
    }
    vessel.modulesForSale.forEach(({creditPrice, module}) => {
        choices.push({
            title: `Buy module ${module.name} for ${creditPrice}`,
            value: `buy${module.name}`,
            description: getModuleShortCodes(module)
        })
    })
    for (let i = 0; i < vessel.crewForHire; i++) {        
        choices.push({
            title: `Hire crew for ${vessel.crewHireFee}`,
            description: `Hire crew`,
            value: `hireCrew`,
        })
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
    printStationStatus(stationState, log, clear);

    // trade menu
    tradeAnswer = await prompts({
        type: "select",
        name: "value",
        message: `Trade with the ${vessel.name}`,
        choices: choices,
    });

    if (tradeAnswer.value !== 'back') {
        if (tradeAnswer.value === 'buyPower') {
            return await buyResourceMenu(stationState, vessel, powerStorageCeiling, 'power', () => vessel.tradesPower, () => vessel.tradesPowerForCredits, () => stationState.power);
        }
        if (tradeAnswer.value === 'buyAir') {
            return await buyResourceMenu(stationState, vessel, airStorageCeiling, 'air', () => vessel.tradesAir, () => vessel.tradesAirForCredits, () => stationState.air);
        }
        if (tradeAnswer.value === 'buyFood') {
            return await buyResourceMenu(stationState, vessel, foodStorageCeiling, 'food', () => vessel.tradesFood, () => vessel.tradesFoodForCredits, () => stationState.food);
        }
        if (tradeAnswer.value === 'sellPower') {
            return await sellResourceMenu(stationState, vessel, powerStorageCeiling, 'power', () => vessel.tradesPower, () => vessel.tradesPowerForCredits, () => stationState.power);
        }
        if (tradeAnswer.value === 'sellAir') {
            return await sellResourceMenu(stationState, vessel, airStorageCeiling, 'air', () => vessel.tradesAir, () => vessel.tradesAirForCredits, () => stationState.air);
        }
        if (tradeAnswer.value === 'sellFood') {
            return await sellResourceMenu(stationState, vessel, foodStorageCeiling, 'food', () => vessel.tradesFood, () => vessel.tradesFoodForCredits, () => stationState.food);
        }
        const mod = vessel.modulesForSale.find(async moduleForSale => {
            `buy${moduleForSale.module.name}` === tradeAnswer.value;
        })
        if (mod) {
            return await buyModuleMenu(stationState, vessel, mod, log, clear); 
        }
        if (tradeAnswer.value === 'hireCrew') {
            return await hireCrewMenu(stationState, vessel, log, clear);
        }
    }

    return { mutateStation: stationState, mutateVessel: vessel };
}


async function hireCrewMenu(stationState: StationState, tradingVessel: Vessel, log: Log, clear: () => void): Promise<TradeMutation> {
    if (stationState.credits >= tradingVessel.crewHireFee) {
        const conf = await prompts({
            type: 'toggle',
            name: 'value',
            active: 'yes',
            inactive: 'no',
            message: `Hire crew for ${tradingVessel.crewHireFee} credits?`,
            initial: true
        });
        if (conf.value === true) {
            return {
                mutateStation: { 
                    credits: stationState.credits - tradingVessel.crewHireFee,
                    crew: stationState.crew + 1,
                 },
                mutateVessel: { ...tradingVessel,
                    credits: tradingVessel.credits + tradingVessel.crewHireFee,
                    crewForHire: tradingVessel.crewForHire - 1
                }
            }
        }
    } else {
        log('The station does not have enough credits to hire this crew');
    }
    return {
        mutateStation: { }, mutateVessel: tradingVessel
    }
}


async function buyModuleMenu(stationState: StationState, tradingVessel: Vessel, moduleToBuy: {creditPrice: number, module: StationModule}, log: Log, clear: () => void): Promise<TradeMutation> {
    log('This vessel is selling this module: ' )
    printModule(moduleToBuy.module, log);
    if (stationState.credits >= moduleToBuy.creditPrice) {
        const conf = await prompts({
            type: 'toggle',
            name: 'value',
            active: 'yes',
            inactive: 'no',
            message: `Buy ${moduleToBuy.module.name} for ${moduleToBuy.creditPrice} credits?`,
            initial: true
        });
        if (conf.value === true) {
            return {
                mutateStation: { 
                    credits: stationState.credits - moduleToBuy.creditPrice,
                    stationModules: stationState.stationModules.concat(moduleToBuy.module),
                 },
                mutateVessel: { ...tradingVessel,
                    credits: tradingVessel.credits + moduleToBuy.creditPrice,
                    modulesForSale: tradingVessel.modulesForSale.filter(m => m.module.name !== moduleToBuy.module.name)
                }
            }
        }
    } else {
        log('The station does not have enough credits to afford this module');
    }
    return {
        mutateStation: { }, mutateVessel: tradingVessel
    }
}

async function buyResourceMenu(stationState: StationState, tradingVessel: Vessel, resourceStorageCeiling: number, resource: string, tradesResource: () => number, tradesResourceForCredits: () => number, stationResource: () => number): Promise<TradeMutation> {
    let amount = await prompts({
        type: "number",
        name: "valueToBuy",
        message: `Buy ${resource} for ${tradesResourceForCredits()} credits. Vessel has ${tradesResource()} to sell`,
        initial: 1,
        min: 0,
        max: tradesResource(),
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
            type: 'toggle',
            name: 'value',
            active: 'yes',
            inactive: 'no',
            message: `Buy ${amount.valueToBuy} ${resource} from ${tradingVessel.name} for ${amount.valueToBuy * tradesResourceForCredits()} credits?`,
            initial: true
        });
        if (cont.value === true) {
            // deduct resource from vessel and add resource to station, deduct credits from station, add credits to vessel
            if (resource === 'power') {
                return {
                    mutateStation: {
                        power: stationState.power + amount.valueToBuy,
                        credits: stationState.credits - amount.valueToBuy * tradesResourceForCredits(),
                    },
                    mutateVessel: {
                        ...tradingVessel,
                        tradesPower: tradingVessel.tradesPower - amount.valueToBuy,
                        credits: tradingVessel.credits + amount.valueToBuy * tradesResourceForCredits(),
                    }
                }
            } else if (resource === 'air') {
                return {
                    mutateStation: {
                        air: stationState.air + amount.valueToBuy,
                        credits: stationState.credits - amount.valueToBuy * tradesResourceForCredits(),
                    },
                    mutateVessel: {
                        ...tradingVessel,
                        tradesAir: tradingVessel.tradesAir - amount.valueToBuy,
                        credits: tradingVessel.credits + amount.valueToBuy * tradesResourceForCredits(),
                    }
                }
            } else if (resource === 'food') {
                return {
                    mutateStation: {
                        food: stationState.food + amount.valueToBuy,
                        credits: stationState.credits - amount.valueToBuy * tradesResourceForCredits(),
                    },
                    mutateVessel: {
                        ...tradingVessel,
                        tradesFood: tradingVessel.tradesFood - amount.valueToBuy,
                        credits: tradingVessel.credits + amount.valueToBuy * tradesResourceForCredits(),
                    }
                }
            }
        }
    }
    return { mutateStation: { }, mutateVessel: tradingVessel }
}

async function sellResourceMenu(stationState: StationState, tradingVessel: Vessel, resourceStorageCeiling: number, resource: string, tradesResource: () => number, tradesResourceForCredits: () => number, stationResource: () => number) {
    let amount = await prompts({
        type: "number",
        name: "valueToSell",
        message: `Sell ${resource} for ${tradesResourceForCredits()} credits. Vessel can buy ${Math.abs(tradesResource())}`,
        initial: 1,
        min: 0,
        max: Math.abs(tradesResource()),
        validate: value => {
            return value >= 0 && 
                // can't sell more than the vessel can buy
                Math.abs(tradesResource()) - value >= 0 &&
                // can't sell more than the station has
                stationResource() - value >= 0 &&
                // can't take more than the vessel can afford
                tradingVessel.credits - (value * tradesResourceForCredits()) >= 0
        }

    });
    if (amount.valueToSell > 0) {
        const cont = await prompts({
            type: 'toggle',
            name: 'value',
            active: 'yes',
            inactive: 'no',
            message: `Sell ${amount.valueToSell} ${resource} to ${tradingVessel.name} for ${amount.valueToSell * tradesResourceForCredits()} credits?`,
            initial: true
        });
        if (cont.value === true) {
            // add resource to vessel and deduct resource from station, subtract credits from vessel
            if (resource === 'power') {
                return {
                    mutateStation: {
                        power: stationState.power - amount.valueToSell,
                        credits: stationState.credits + amount.valueToSell * tradesResourceForCredits(),
                    },
                    mutateVessel: {
                        ...tradingVessel,
                        tradesPower: tradingVessel.tradesPower + amount.valueToSell,
                        credits: tradingVessel.credits - amount.valueToSell * tradesResourceForCredits(),
                    }
                }
            } else if (resource === 'air') {
                return {
                    mutateStation: {
                        air: stationState.air - amount.valueToSell,
                        credits: stationState.credits + amount.valueToSell * tradesResourceForCredits(),
                    },
                    mutateVessel: {
                        ...tradingVessel,
                        tradesAir: tradingVessel.tradesAir + amount.valueToSell,
                        credits: tradingVessel.credits - amount.valueToSell * tradesResourceForCredits(),
                    }
                }
            } else if (resource === 'food') {
                return {
                    mutateStation: {
                        food: stationState.food - amount.valueToSell,
                        credits: stationState.credits + amount.valueToSell * tradesResourceForCredits(),
                    },
                    mutateVessel: {
                        ...tradingVessel,
                        tradesFood: tradingVessel.tradesFood + amount.valueToSell,
                        credits: tradingVessel.credits - amount.valueToSell * tradesResourceForCredits(),
                    }
                }
            }
        }
    }
    return { mutateStation: { }, mutateVessel: tradingVessel }
}