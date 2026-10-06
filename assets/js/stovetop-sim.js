// The two-sided cooking simulator behind stovetop-outcome-extended.html: state plus the actions a reader can take
// (set the burner, set the food's thickness and starting temperature, add, flip, remove) and one physics step.
// No DOM. The scenario presets (stovetop-presets.js) drive the simulator through these same actions, and use
// them to precompute their card thumbnails, so a preset can never do anything a reader couldn't.
window.StovetopSim = (() => {
  const { MODEL, DT, FOOD, FOOD_EXTRA, stepFoodSided, otherSide } = window.StovetopModel;
  const OUT = window.StovetopOutcome;
  const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

  const SAMPLE_STEPS = 20;  // history sample every 20 steps (1 simulated second)
  const MAX_SAMPLES = 2400; // past this, history is thinned to every other sample
  const INITIAL_BURNER = 70;
  const THICKNESS = { min: 0.5, max: 2.5, step: 0.25, initial: FOOD_EXTRA.referenceThickness }; // in
  const START_TEMP = { min: 35, max: 70, step: 1, initial: FOOD.startTemp };                       // °F

  // foodState: 'waiting' (beside the pan) → 'inPan' → 'removed'. Thickness and the initial food temperature
  // are properties of the food, set only while it's waiting. Food history is null until it's added.
  // Side A and Side B are the food's two physical faces and keep their names for good. panContactSide says which
  // one is on the pan (B to start; drawn at the bottom). A flip only changes panContactSide: no temperature moves.
  // centerTarget ({ min, max } °F) defaults to the outcome model's CENTER_TARGET
  const freshState = ({ burner = INITIAL_BURNER, speed = 15, centerTarget = OUT.CENTER_TARGET } = {}) => ({
    time: 0, steps: 0, running: false, burner, speed,
    panTemp: MODEL.roomTemp,
    sideATemp: START_TEMP.initial, sideBTemp: START_TEMP.initial, centerTemp: START_TEMP.initial,
    thickness: THICKNESS.initial, initialFoodTemp: START_TEMP.initial,
    thicknessScale: THICKNESS.initial / FOOD_EXTRA.referenceThickness, // for the schematic
    foodState: 'waiting', panContactSide: 'B', flipEvents: [],
    foodAddedAt: null, foodRemovedAt: null, foodStart: null, browningAtRemoval: null,
    sampleEvery: SAMPLE_STEPS,
    history: { time: [0], pan: [MODEL.roomTemp], sideA: [null], sideB: [null], center: [null], brownA: [null], brownB: [null] },
    centerTarget,
    outcome: OUT.createSidedTracker({ centerTarget }),
  });
  const added = (s) => s.foodState !== 'waiting';
  const cookingTime = (s) => (added(s) ? s.time - s.foodAddedAt : 0);                  // since added
  const panTime = (s) => (added(s) ? (s.foodRemovedAt ?? s.time) - s.foodAddedAt : 0); // time in the pan

  function recordHistory(s) {
    const h = s.history, on = added(s);
    h.time.push(s.time);
    h.pan.push(s.panTemp);
    h.sideA.push(on ? s.sideATemp : null);
    h.sideB.push(on ? s.sideBTemp : null);
    h.center.push(on ? s.centerTemp : null);
    h.brownA.push(on ? s.outcome.browning.A : null);
    h.brownB.push(on ? s.outcome.browning.B : null);
    if (h.time.length > MAX_SAMPLES) {
      for (const k of Object.keys(h)) h[k] = h[k].filter((_, i) => i % 2 === 0);
      s.sampleEvery *= 2;
    }
  }

  function step(s, dt = DT) {
    stepFoodSided(s, dt);
    s.steps += 1;
    s.time = s.steps * dt;
    if (added(s)) s.outcome.update(s, cookingTime(s), dt, s.foodState === 'inPan');
    if (s.steps % s.sampleEvery === 0) recordHistory(s);
  }

  // ---- Actions (each returns whether it did anything) ----

  // Changes heat input only; every temperature carries on from where it is
  function setBurner(s, pct) {
    s.burner = clamp(Math.round(pct), 0, 100);
    return true;
  }
  // Before the food goes in: its properties (and starting temperatures) can still change
  function setThickness(s, inches) {
    if (added(s)) return false;
    s.thickness = clamp(inches, THICKNESS.min, THICKNESS.max);
    s.thicknessScale = s.thickness / FOOD_EXTRA.referenceThickness;
    return true;
  }
  function setInitialFoodTemp(s, temp) {
    if (added(s)) return false;
    s.initialFoodTemp = clamp(Math.round(temp), START_TEMP.min, START_TEMP.max);
    s.sideATemp = s.sideBTemp = s.centerTemp = s.initialFoodTemp;
    return true;
  }
  // No temperature changes here: from the next step on, the pan → Side B → center flows do that
  function addFood(s) {
    if (s.foodState !== 'waiting') return false;
    s.foodState = 'inPan';
    s.panContactSide = 'B';
    s.foodAddedAt = s.time;
    s.foodStart = { sideA: s.sideATemp, sideB: s.sideBTemp, center: s.centerTemp };
    s.outcome.update(s, 0, 0, true);
    return true;
  }
  // Orientation only: the other face now touches the pan. Temperatures, browning and the clock carry on.
  function flipFood(s) {
    if (s.foodState !== 'inPan') return false;
    s.panContactSide = otherSide(s.panContactSide);
    s.flipEvents.push({ time: s.time, cookingTime: cookingTime(s), newPanContactSide: s.panContactSide });
    return true;
  }
  // Cuts the pan → food flow; browning stops here, but both faces keep heating the center if they're hotter.
  // panContactSide keeps the side that was last on the pan.
  function removeFood(s) {
    if (s.foodState !== 'inPan') return false;
    s.foodState = 'removed';
    s.foodRemovedAt = s.time;
    s.outcome.update(s, cookingTime(s), 0, false);
    s.browningAtRemoval = { ...s.outcome.browning };
    return true;
  }

  return {
    DT, THICKNESS, START_TEMP, INITIAL_BURNER,
    freshState, added, cookingTime, panTime, step,
    setBurner, setThickness, setInitialFoodTemp, addFood, flipFood, removeFood,
  };
})();
