import prompts from "prompts";
import { problems } from "../data/problems";
import { StationState, Log } from "../types";
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
      !problemPreviouslySolved(name, stationState.previouslySolvedProblems)
  );

  const problem = candidateProblems[dN(candidateProblems.length) - 1];
  clear();
  log(problem.narrative);
  const answer = await prompts(problem.questions);
  if (answer) {
    const result = problem.results.find((result) => result.answer === answer.answer)
    if (result) {
        const mutation = result.mutation(stationState);
        log(mutation.narrative);
        await prompts({
            type: "confirm",
            name: "value",
            message: "Continue...",
            initial: true,
          });
        return stationState.fold({...mutation.mutateStation})
    }
}
  return stationState;
}

function problemPreviouslySolved(
  name: string,
  previouslySolvedProblems: { name: string; stardateSinceLastSolved: number }[]
) {
  return (
    previouslySolvedProblems.find(problem => problem.name == name) !== undefined
  );
}
