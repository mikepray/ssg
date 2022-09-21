import chalk from "chalk";
import prompts, { Answers } from "prompts";
import { printStationStatus } from "./main";
import { StationState, Vessel } from "./types";
import { getVesselColor } from "./utils";

const { log } = console;

export async function dockingMenu(stationState: StationState) {
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