import chalk from "chalk";
import { log } from "console";
import prompts, { Answers } from "prompts";
import { StationState, StationModule } from "./types";
import { getUnassignedCrew, getAssignedCrew } from "./utils";

export async function assignCrewMenu(stationState: StationState): Promise<StationModule | undefined> {
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
