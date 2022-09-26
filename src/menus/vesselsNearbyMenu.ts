import chalk from "chalk";
import { log } from "console";
import prompts, { Answers, Choice } from "prompts";
import { StationState, VesselDockingStatus } from "../types";
import { getVesselColor } from "../utils";

export async function vesselsNearbyMenu(stationState: StationState) {
  console.clear();

  const choices: Choice[] = stationState.vessels
    .filter((v) => v.dockingStatus !== VesselDockingStatus.Docked)
    .map((vessel) => {
      return {
        title:
          vessel.dockingStatus === VesselDockingStatus.WarpingIn ||
          vessel.dockingStatus === VesselDockingStatus.WarpingOut
            ? chalk.cyan.italic(`<Warp Signature Detected>`)
            : chalk.hex(getVesselColor(vessel, stationState.factions))(
                vessel.name
              ),
        value: vessel.name,
      };
    });

  if (choices.length === 0) {
    choices.push({ title: `There's nothing out there...` });
  }

  const chooseVesselAnswer: Answers<string> = await prompts({
    type: "select",
    name: "value",
    message: `Choose a nearby vessel to examine`,
    choices: choices,
  });

  if (chooseVesselAnswer.value === undefined) {
    return;
  }
  const vessel = stationState.vessels.find(
    (vessel) => vessel.name === chooseVesselAnswer.value
  );

  if (vessel === undefined) {
    log(` There's nothing here... `);
    return;
  }

  if (
    vessel.dockingStatus === VesselDockingStatus.WarpingIn ||
    vessel.dockingStatus === VesselDockingStatus.WarpingOut
  ) {
    log(` Scanners indicate a warp signature of a ${vessel.class} starship`);
  } else {
    log(
      `This is the ${vessel?.name}, a ${
        vessel?.class
      } starship. It's affiliated with the ${
        stationState.factions.find(
          (faction) => faction.name === vessel?.faction
        )?.name
      } `
    );
    if (vessel.dockingDaysRequested >= 0) {
      log(
        `Scanners indicate that this vessel is${
          vessel.dockingStatus === VesselDockingStatus.NearbyWaitingToLeave
            ? ` leaving the area `
            : ` waiting to dock with the station `
        }`
      );
    } else {
      log(`This vessel's intentions are unknown`);
    }
  }

  const cont = await prompts({
    type: "confirm",
    name: "value",
    message: "Continue...",
    initial: true,
  });
}
