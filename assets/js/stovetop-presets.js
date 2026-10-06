// "Diagnosing a bad cook" for stovetop-outcome-extended.html, and the run machinery the strategy finder reuses.
// Each diagnosis starts from a failed cook, explains it in terms of the model, and offers fixes. The failure and
// every fix are just runs (variants) of the same simulator (stovetop-sim.js), driven through the same actions a
// reader can take, so every curve they produce comes from the model; whether a fix works is whatever the model says.
// A variant: starting settings plus actions at simulated times.
//   action types: addFood | flip | removeFood | setBurner (value: %) | pause (holds the result for reading)
// Times are simulated seconds since reset, so the simulation speed never changes what happens when.
window.StovetopPresets = (() => {
  const Sim = window.StovetopSim;
  const PREHEAT = 300; // every run preheats 5 minutes, then adds the food
  const at = (min) => PREHEAT + min * 60; // cooking minutes → simulated seconds

  // A run described in cooking minutes: { burner, preheatBurner?, thickness?, start?, flips: [min], remove?, pause }
  function cook({ burner, preheatBurner, thickness, start, flips = [], every, remove, pause }) {
    const flipTimes = every ? Array.from({ length: Math.floor((pause - 1e-9) / every) }, (_, i) => (i + 1) * every) : flips;
    const actions = [{ t: PREHEAT, type: 'addFood' }];
    if (preheatBurner !== undefined) actions.push({ t: PREHEAT, type: 'setBurner', value: burner });
    for (const m of flipTimes) actions.push({ t: at(m), type: 'flip' });
    if (remove !== undefined) actions.push({ t: at(remove), type: 'removeFood' });
    actions.push({ t: at(pause), type: 'pause' });
    return { initial: { burner: preheatBurner ?? burner, thickness, initialFoodTemp: start }, actions };
  }

  // Tuned so each failure shows its problem and each fix shows what the model actually does with it
  const DIAGNOSES = [
    {
      id: 'burnt-raw', title: 'Burnt outside, raw inside',
      problem: '“The outside burned before the center was done.”',
      happened: 'The surfaces got too far ahead of the center.',
      diagnosis: 'Surface heating is too fast relative to center heating.',
      change: 'Slow the browning relative to the center, or make the center easier to heat.',
      failure: { label: 'High heat', run: cook({ burner: 100, flips: [2], pause: 3.5 }) },
      fixes: [
        { label: 'Lower heat', run: cook({ burner: 70, flips: [2.75], pause: 6 }) },
        { label: 'Preheat high → lower', run: cook({ preheatBurner: 100, burner: 60, flips: [2], pause: 5.5 }) },
        { label: 'Thinner (1.25 in)', run: cook({ burner: 100, thickness: 1.25, flips: [1.25], pause: 3 }) },
        { label: 'Warmer start (65°F)', run: cook({ burner: 100, start: 65, flips: [1.5], pause: 3 }) },
      ],
      takeaway: 'Burnt outside + raw inside means the outside is winning the race against the center.',
    },
    {
      id: 'pale-done', title: 'Cooked inside, pale outside',
      problem: '“The center is done, but the outside is still pale.”',
      happened: 'The center reached its target before enough browning happened.',
      diagnosis: 'Surface heating is too slow relative to center heating.',
      change: 'Speed up browning relative to the center.',
      failure: { label: 'Low heat', run: cook({ burner: 40, flips: [5], pause: 11.5 }) },
      fixes: [
        { label: 'Hotter pan', run: cook({ burner: 70, flips: [2.75], pause: 6 }) },
        { label: 'Stronger preheat', run: cook({ preheatBurner: 100, burner: 55, flips: [2], pause: 6 }) },
      ],
      takeaway: 'The inverse of burnt-and-raw: here the outside is losing the race.',
    },
    {
      id: 'uneven', title: 'One side dark, one side pale',
      problem: '“One side browned much more than the other.”',
      happened: 'One surface spent much more time on the pan than the other.',
      diagnosis: 'Pan contact was split unevenly between Side A and Side B.',
      change: 'Make the two sides’ heating histories more alike.',
      failure: { label: 'Late flip', run: cook({ burner: 70, flips: [4.5], pause: 6 }) },
      fixes: [
        { label: 'Flip earlier', run: cook({ burner: 70, flips: [2.75], pause: 6 }) },
        { label: 'Flip every minute', run: cook({ burner: 70, every: 1, pause: 5 }) },
        { label: 'Flip often + hotter pan', run: cook({ burner: 90, every: 1, pause: 4 }) },
      ],
      takeaway: 'Flip timing controls how browning is divided between Side A and Side B.',
    },
    {
      id: 'carryover', title: 'Perfect when removed, overdone when served',
      problem: '“It was perfect when I took it off the pan, but it ended up overdone.”',
      happened: 'Cooking continued after it came off the heat.',
      diagnosis: 'Heat already stored in the hotter outer layers kept moving inward.',
      change: 'Stop the direct heating before the center reaches its final temperature.',
      failure: { label: 'Removed in range', run: cook({ burner: 70, flips: [2.5], remove: 6, pause: 9 }) },
      fixes: [
        { label: 'Remove earlier', run: cook({ burner: 70, flips: [2.5], remove: 5.2, pause: 8.5 }) },
      ],
      takeaway: 'Take it off a few degrees early; carryover finishes it.',
    },
  ];

  // Starting settings, applied to a freshly reset simulator state
  function applyInitial(s, initial = {}) {
    if (initial.burner !== undefined) Sim.setBurner(s, initial.burner);
    if (initial.thickness !== undefined) Sim.setThickness(s, initial.thickness);
    if (initial.initialFoodTemp !== undefined) Sim.setInitialFoodTemp(s, initial.initialFoodTemp);
  }

  // Fires a variant's actions in time order, each exactly once, as simulated time passes.
  // run(action) performs it (the live simulator also animates it); cancel() drops whatever hasn't happened yet.
  function createRunner(actions, run) {
    const queue = [...actions].sort((a, b) => a.t - b.t);
    let next = 0;
    return {
      due(time) { while (next < queue.length && queue[next].t <= time + 1e-9) run(queue[next++]); },
      cancel() { next = queue.length; },
      get pending() { return queue.length - next; },
    };
  }

  // The plain effect of an action on the simulator state (no animation)
  function perform(s, a) {
    switch (a.type) {
      case 'addFood': return Sim.addFood(s);
      case 'flip': return Sim.flipFood(s);
      case 'removeFood': return Sim.removeFood(s);
      case 'setBurner': return Sim.setBurner(s, a.value);
      case 'pause': s.running = false; return true;
      default: return false;
    }
  }

  // Run a variant to its pause without drawing anything (card graphs, the strategy finder, testing)
  function simulate(variant, { limit = 3600, centerTarget } = {}) {
    const s = Sim.freshState(centerTarget ? { centerTarget } : {});
    applyInitial(s, variant.initial);
    s.running = true;
    const runner = createRunner(variant.actions, (a) => perform(s, a));
    runner.due(0);
    while (s.running && s.time < limit) { Sim.step(s); runner.due(s.time); }
    return s;
  }

  return { DIAGNOSES, PREHEAT, cook, applyInitial, createRunner, perform, simulate };
})();
