import chalk from "chalk";
import prompts from "prompts";
import { problems } from "../data/problems";
import { StationState, Log, ProblemNarrative } from "../types";
import { d20, dN } from "../utils";

export async function problemMenu(
  stationState: StationState,
  log: Log,
  clear: () => void
): Promise<StationState> {
  const rarityRoll = d20();

  const candidateProblems = problems.filter(
    ({ name, rarity }) =>
      rarity > 0 &&
      rarity < rarityRoll &&
      stationState.previouslySolvedProblems.find(
        (problem) => problem.name == name
      ) === undefined
  );

  const problem = candidateProblems[dN(candidateProblems.length) - 1];
  if (problem && stationState) {
    return doProblem(stationState, problem, log, clear);
  }
  return stationState;
}

export async function doProblem(
  stationState: StationState,
  problem: ProblemNarrative,
  log: Log,
  clear: () => void
) {
  clear();
  log(chalk.white.bold(problem.name));
  log(problem.narrative);
  const answer = await prompts(problem.questions(stationState));
  if (answer) {
    const result = problem.results.find(
      (result) => result.answer === answer.answer
    );
    if (result) {
      const mutation = result.mutation(stationState);
      log(mutation.narrative);
      await prompts({
        type: "confirm",
        name: "value",
        message: "Continue...",
        initial: true,
      });
      return stationState.fold({
        ...mutation.mutateStation,
        previouslySolvedProblems: stationState.previouslySolvedProblems.concat({
          name: problem.name,
          stardateSinceLastSolved: stationState.stardate,
        }),
      });
    }
  }
  return stationState;
}
