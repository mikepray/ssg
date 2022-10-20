import prompts from "prompts";
import tap from "tap";
import { baseStation } from "../src/data/station";
import { testingStationState } from "../src/data/testStartingState";
import { vessels } from "../src/data/vessels";
import { gameLoop } from "../src/game";
import { noOp, VesselDockingStatus } from "../src/types";

tap.test("Vessel should warp in to being near by", async (t) => {
    const vessel = vessels.find(({ name }) => name === "Big Fred");
    if (vessel) {
      prompts.inject(["wait"]);
  
      const state = await gameLoop(
        testingStationState.fold({
          vessels: [
            vessel.fold({ dockingStatus: VesselDockingStatus.WarpingIn }),
          ],
        }),
        noOp,
        noOp
      );
      t.equal(
        state.vessels.find(({ name }) => name === "Big Fred")?.dockingStatus,
        VesselDockingStatus.NearbyWaitingToDock,
        "Big Fred should be waiting to dock"
      );
    } else {
      t.fail();
    }
    t.end();
  });
  
  tap.test("Vessel should dock while nearby and if ports are open", async (t) => {
    const vessel = vessels.find(({ name }) => name === "Big Fred");
    if (vessel) {
      prompts.inject(["wait"]);
  
      const state = await gameLoop(
        testingStationState.fold({
          vessels: [
            vessel.fold({
              dockingStatus: VesselDockingStatus.NearbyWaitingToDock,
            }),
          ],
        }),
        noOp,
        noOp
      );
      t.equal(
        state.vessels.find(({ name }) => name === "Big Fred")?.dockingStatus,
        VesselDockingStatus.Docked,
        "Big Fred should be docked"
        );
    } else {
      t.fail();
    }
    t.end();
  });
  
  tap.test("Vessel should undock after docking days requested is up", async (t) => {
    const vessel = vessels.find(({ name }) => name === "Big Fred");
    if (vessel) {
      prompts.inject(["wait"]);
  
      const state = await gameLoop(
        testingStationState.fold({
          vessels: [
            vessel.fold({
              dockingStatus: VesselDockingStatus.Docked,
              dockingDaysRequested: 0,
            }),
          ],
        }),
        noOp,
        noOp
      );
      t.equal(
        state.vessels.find(({ name }) => name === "Big Fred")?.dockingStatus,
        VesselDockingStatus.NearbyWaitingToLeave,
        "Big Fred should have undocked"
      );
      t.equal(
        state.factions.find(({name}) => state.vessels.find(({ name }) => name === "Big Fred")?.faction == name)?.favor,
        11,
        "Favor should be increased if a vessel reaches its docking days requested without being evicted"
      );
    } else {
      t.fail();
    }
    t.end();
  });
  
  tap.test("Vessels that were evicted should warp out", async (t) => {
    const vessel = vessels.find(({ name }) => name === "Big Fred");
    if (vessel) {
      prompts.inject(["wait"]);
  
      const state = await gameLoop(
        testingStationState.fold({
          vessels: [
            vessel.fold({
              dockingStatus: VesselDockingStatus.NearbyWaitingToLeave,
              dockingDaysRequested: 1,
            }),
          ],
        }),
        noOp,
        noOp
      );
      t.equal(
        state.vessels.find(({ name }) => name === "Big Fred")?.dockingStatus,
        VesselDockingStatus.WarpingOut,
        "Big Fred should be warping out"
      );
      t.equal(
        state.factions.find(({name}) => state.vessels.find(({ name }) => name === "Big Fred")?.faction == name)?.favor,
        9,
        "Favor should be reduced if a vessel is evicted"
      );
    } else {
      t.fail();
    }
    t.end();
  });

  tap.test("Vessels should warp out after waiting to leave", async (t) => {
    const vessel = vessels.find(({ name }) => name === "Big Fred");
    if (vessel) {
      prompts.inject(["wait"]);
  
      const state = await gameLoop(
        testingStationState.fold({
          vessels: [
            vessel.fold({
              dockingStatus: VesselDockingStatus.NearbyWaitingToLeave,
            }),
          ],
        }),
        noOp,
        noOp
      );
      t.equal(
        state.vessels.find(({ name }) => name === "Big Fred")?.dockingStatus,
        VesselDockingStatus.WarpingOut,
        "Big Fred should have warped out"
      );
    } else {
      t.fail();
    }
    t.end();
  });
  
  tap.test("Vessels that have warped out should be removed from the station's list", async (t) => {
    const vessel = vessels.find(({ name }) => name === "Big Fred");
    if (vessel) {
      prompts.inject(["wait"]);
  
      const state = await gameLoop(
        testingStationState.fold({
          vessels: [
            vessel.fold({
              dockingStatus: VesselDockingStatus.WarpingOut,
            }),
          ],
        }),
        noOp,
        noOp
      );
      t.equal(
        state.vessels.find(({ name }) => name === "Big Fred"),
        undefined,
        "Vessel list should be empty after Big Fred warped out"
      );
    } else {
      t.fail();
    }
    t.end();
  });
  
  tap.test("Vessels that don't want to dock shouldn't dock", async (t) => {
    const vessel = vessels.find(({ name }) => name === "Big Fred");
    if (vessel) {
      prompts.inject(["wait"]);
  
      const state = await gameLoop(
        testingStationState.fold({
          vessels: [
            vessel.fold({
              dockingStatus: VesselDockingStatus.NearbyWaitingToDock,
              dockingDaysRequested: -1,
            }),
          ],
        }),
        noOp,
        noOp
      );
      t.equal(
        state.vessels.find(({ name }) => name === "Big Fred")?.dockingStatus,
        VesselDockingStatus.NearbyWaitingToDock,
        "Big Fred should still be undocked"
      );
    } else {
      t.fail();
    }
    t.end();
  });

  tap.test("Vessels shouldn't dock if there are no ports open", async (t) => {
    const bigFred = vessels.find(({ name }) => name === "Big Fred");
    const alfonso = vessels.find(({ name }) => name === "Alfonso");
    const agnes = vessels.find(({ name }) => name === "Agnes");
    if (bigFred && alfonso && agnes) {
      prompts.inject(["wait"]);
  
      const state = await gameLoop(
        testingStationState.fold({
          
          vessels: [
            bigFred.fold({
              dockingStatus: VesselDockingStatus.NearbyWaitingToDock,
            }),
            alfonso.fold({
              dockingStatus: VesselDockingStatus.Docked,
            }),
            agnes.fold({
              dockingStatus: VesselDockingStatus.Docked,
            })
          ],
        }),
        noOp,
        noOp
      );
      t.equal(
        state.vessels.find(({ name }) => name === "Big Fred")?.dockingStatus,
        VesselDockingStatus.NearbyWaitingToDock
      );
      t.equal(
        state.vessels.find(({ name }) => name === "Big Fred")?.timeInQueue,
        bigFred.timeInQueue + 1, "time in queue should be incremented"
      );
    } else {
      t.fail();
    }
    t.end();
  });

  tap.test("Vessels that can't dock should warp out if they reach their queue tolerance", async (t) => {
    const bigFred = vessels.find(({ name }) => name === "Big Fred");
    const alfonso = vessels.find(({ name }) => name === "Alfonso");
    const agnes = vessels.find(({ name }) => name === "Agnes");
    if (bigFred && alfonso && agnes) {
      prompts.inject(["wait"]);
  
      const state = await gameLoop(
        testingStationState.fold({
          
          vessels: [
            bigFred.fold({
              dockingStatus: VesselDockingStatus.NearbyWaitingToDock,
              timeInQueue: 4,
            }),
            alfonso.fold({
              dockingStatus: VesselDockingStatus.Docked,
            }),
            agnes.fold({
              dockingStatus: VesselDockingStatus.Docked,
            })
          ],
        }),
        noOp,
        noOp
      );
      t.equal(
        state.vessels.find(({ name }) => name === "Big Fred")?.dockingStatus,
        VesselDockingStatus.NearbyWaitingToLeave,
        "Big Fred should be waiting to leave"
      );
      t.equal(
        state.factions.find(({name}) => state.vessels.find(({ name }) => name === "Big Fred")?.faction == name)?.favor,
        9,
        "Favor should be reduced if a vessel hits its queue tolerance without docking"
      );
    } else {
      t.fail();
    }
    t.end();
  });

  tap.test("Spawning Vessels", async (t) => {
   /* const game = t.mock("utils", {
      "../src/dice": {
        d20: () => { return 20; },
        d100: () => { return 1; },
        dN: () => { return 1; },
      }
    })
    t.equal(game.spawnVessel(baseStation).name, "Big Fred", "Big Fred should spawn"); */
    // const game = t.mock("../../../src/game", {})
  });

  tap.test("Respawning Vessels", async (t) => {
    const game = t.mock("../src/game", {
      "../src/dice": {
        d20: () => { return 1; },
        d100: () => { return 1; },
        dN: () => { return 1; },
      }
    });
    prompts.inject(["wait"]);

    const state = await game.gameLoop(testingStationState.fold({
      stardate: 80,
      previouslyVisitedVesselNames: [{
        name: "Big Fred",
        stardateSinceLastVisited: 1
      }]
    }), console.log, noOp);
    // console.log(state)
    t.equal(state.previouslyVisitedVesselNames.length, 0, "Big Fred should be allowed to respawn");
  });

  // tap.test("Previously visited vessels", async (t) => {
  //   const game = t.mock("../src/game", {
  //     "../src/dice": {
  //       d20: () => { return 20; },
  //       d100: () => { return 1; },
  //       dN: () => { return 1; },
  //     }
  //   })
  //   const state = await game.gameLoop(baseStation.fold({
  //     stardate: 6,
  //     previouslyVisitedVesselNames: [{
  //       name: "Big Fred",
  //       stardateSinceLastVisited: 1
  //     }]
  //   }), noOp, noOp);
  //   console.log(state.previouslyVisitedVesselNames)
  //   t.equal(state.previouslyVisitedVesselNames.length, 0, "Big Fred should be allowed to respawn");
  // });