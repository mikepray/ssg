import chalk from "chalk";
import prompts from "prompts";
import { stationModules } from "../data/stationModules";
import { Log, StationState } from "../types";
import { getModuleShortCodes } from "./moduleMenu";

export async function policyMenu(
    stationState: StationState,
    log: Log,
    clear: () => void
  ): Promise<StationState> {
    const policyChoice = await prompts({
      type: "select",
      name: "value",
      choices: [
        {
            title: "Docking Fees",
            description: "Set the fee your station charges to docked vessels per day. Some vessels wont dock if the fee is too high",
            value: "dockingFee"
        },
        {
            title: "Crew Salary",
            description: "Set the salary you pay crew per day. Higher salary will help with morale",
            value: "crewSalary"
        },
        {
            title: "Food Rationing",
            description: "Crew normally consume 3 units of food per day. Lower amounts will hurt morale",
            value: "foodRation"
        },
      ],
      message: "Choose a policy to manage",
    });

    if (policyChoice.value === "dockingFee") {
        const dockingFee = await prompts({
            type: "number",
            name: "value",
            message: "Set Docking Fee",
            initial: stationState.dockingFee,
            validate: value => {
                return value >= 0               
            }
        });
        if (dockingFee.value) {
            return stationState.fold({ dockingFee: dockingFee.value });
        }
    }

    if (policyChoice.value === "crewSalary") {
        const crewSalary = await prompts({
            type: "number",
            name: "value",
            message: "Set Crew Salary",
            initial: stationState.crewSalary,
            validate: value => {
                return value >= 0               
            }
        });
        if (crewSalary.value) {
            return stationState.fold({ crewSalary: crewSalary.value });
        }
    }

    if (policyChoice.value === "foodRation") {
        const foodRation = await prompts({
            type: "number",
            name: "value",
            message: "Set Crew Food Ration",
            initial: stationState.crewFoodRation,
            validate: value => {
                return value >= 0               
            }
        });
        if (foodRation.value) {
            return stationState.fold({ crewFoodRation: foodRation.value });
        }
    }

    return stationState;
}