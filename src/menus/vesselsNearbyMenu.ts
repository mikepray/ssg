import chalk from "chalk";
import { log } from "console";
import prompts, { Answers } from "prompts";
import { StationState } from "../types";
import { getVesselColor } from "../utils";

export async function vesselsNearbyMenu(stationState: StationState) {
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
            if (vessel.dockingDaysRequested >= 0) {
                log(`Scanners indicate that this vessel is${vessel.timeInQueue <= 0 ? ` leaving the area ` : ` waiting to dock with the station `}`);
            } else {
                log(`This vessel's intentions are unknown`);
            }
        }
    }
    const cont = await prompts({
        type: 'confirm',
        name: 'value',
        message: 'Continue...',
        initial: true
      });
}