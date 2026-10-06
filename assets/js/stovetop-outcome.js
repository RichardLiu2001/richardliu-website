// Cooking-outcome model for stovetop-outcome.html and stovetop-outcome-extended.html. It never touches the thermal equations
// (assets/js/stovetop-model.js); it only interprets the temperatures the physics produces.
//
// Two kinds of target:
//   CENTER  - a temperature range (doneness depends on how hot the center is).
//   SURFACE - a region of temperature AND time (browning needs enough heat for long enough).
// The browning boundaries are a simplified conceptual model, not Maillard chemistry: holding the surface at a
// steady temperature, it reaches good browning after some time, and burns some time later. Every 50°F hotter
// halves those times, so each boundary falls by 50°F per doubling of cooking time, down to a floor
// (below ~230°F it never browns; below ~320°F it never burns).
window.StovetopOutcome = (() => {
  const CENTER_TARGET = { min: 130, max: 140 }; // °F, illustrative

  const BROWNING = {
    refTime: 120,        // s: the reference cooking time for the two temperatures below
    goodAtRef: 340,      // °F: holding this surface temperature, browning is good after refTime
    burntAtRef: 425,     // °F: holding this surface temperature, the surface burns after refTime
    perDoubling: 50,     // °F: how much lower each boundary is per doubling of cooking time
    goodFloor: 230,      // °F: below this the surface never browns, however long
    burntFloor: 320,     // °F: below this the surface never burns, however long
  };

  const fallsWithTime = (atRef, floor) => (t) =>
    t <= 0 ? Infinity : Math.max(floor, atRef - BROWNING.perDoubling * Math.log2(t / BROWNING.refTime));
  // Surface temperature at cooking time t (s) above which browning is good / the surface is burnt
  const lowerBrowningBoundary = fallsWithTime(BROWNING.goodAtRef, BROWNING.goodFloor);
  const upperBrowningBoundary = fallsWithTime(BROWNING.burntAtRef, BROWNING.burntFloor);

  function getCenterStatus(centerTemp, range = CENTER_TARGET) {
    if (centerTemp < range.min) return 'underdone';
    if (centerTemp <= range.max) return 'target';
    return 'overdone';
  }

  // Where the current (cooking time, surface temperature) point sits among the browning regions
  function getBrowningStatus(surfaceTemp, cookingTime) {
    if (surfaceTemp < lowerBrowningBoundary(cookingTime)) return 'under';
    if (surfaceTemp <= upperBrowningBoundary(cookingTime)) return 'good';
    return 'burnt';
  }


  // ---- Accumulated browning (stovetop-outcome.html and stovetop-outcome-extended.html) -----------------
  // Browning depends on a face's whole temperature history, not its current temperature (350°F just reached
  // vs. held for minutes are different), so each face accumulates it:
  //   dB/dt = browningRate(T_side),  B never decreases (a face never "un-browns" as it cools)
  // A simplified conceptual model, not Maillard chemistry. The rate is chosen so that holding a face at a steady
  // temperature T reaches "good" and "burnt" at exactly the region boundaries above:
  //   good after refTime · 2^((goodAtRef − T) / perDoubling)  →  rate(T) = 1 / that time  (0 below goodFloor)
  //   good at B = 1, burnt at B = 2^((burntAtRef − goodAtRef) / perDoubling)   (the thresholds: BROWNING_LEVEL)
  // (Simplification: burnt is a multiple of good, so burntFloor isn't used here.)
  const BROWNING_LEVEL = { good: 1, burnt: 2 ** ((BROWNING.burntAtRef - BROWNING.goodAtRef) / BROWNING.perDoubling) };
  const browningRate = (temp) =>
    temp <= BROWNING.goodFloor ? 0 : 2 ** ((temp - BROWNING.goodAtRef) / BROWNING.perDoubling) / BROWNING.refTime;
  // The steady surface temperature that reaches browning `level` after t seconds (for drawing the regions
  // the accumulated model implies: level 1 → start of good browning, BROWNING_LEVEL.burnt → burnt)
  const steadyTempFor = (level, t) =>
    t <= 0 ? Infinity : Math.max(BROWNING.goodFloor, BROWNING.goodAtRef - BROWNING.perDoubling * Math.log2(t / (level * BROWNING.refTime)));
  function getBrowningLevelStatus(level) {
    if (level < BROWNING_LEVEL.good) return 'under';
    if (level < BROWNING_LEVEL.burnt) return 'good';
    return 'burnt';
  }

  // The success criteria, in one place so they can be tuned
  const sidedTargetsMet = (o) => o.sideA === 'good' && o.sideB === 'good' && o.center === 'target';
  const surfaceTargetsMet = (o) => o.surface === 'good' && o.center === 'target';

  // Follows one cook as it happens (cookingTime = seconds since the food was added). update(state, cookingTime,
  // dt, inPan) reads the face temperatures and the center temperature from the simulator state.
  //   - each face accumulates browning, dB/dt = browningRate(T_face), whenever the food is cooking; it never decreases,
  //     so it levels off once the food is out of the pan and the faces cool below browning range
  //   - doneness follows the hottest the center has been: cooling doesn't uncook it
  //   - after removal, once the center passes its peak the outcome is settled
  // Records when the targets were met (windows) and when each state was first reached.
  function createBrowningTracker(faces, targetsMet, centerTarget = CENTER_TARGET) {
    const keyed = (v) => Object.fromEntries(faces.map((f) => [f.key, v]));
    const t = {
      browning: keyed(0), center: null, aligned: false, windows: [],
      goodAt: keyed(null), burntAt: keyed(null), targetAt: null, overdoneAt: null,
      centerMax: -Infinity, centerMaxAt: null, removedAt: null, centerAtRemoval: null, settledAt: null,
    };
    for (const f of faces) t[f.status] = 'under';
    t.update = (state, cookingTime, dt, inPan = true) => {
      const centerTemp = state.centerTemp;
      for (const f of faces) {
        t.browning[f.key] += browningRate(f.temp(state)) * dt;
        const status = getBrowningLevelStatus(t.browning[f.key]);
        t[f.status] = status;
        if (status !== 'under' && t.goodAt[f.key] === null) t.goodAt[f.key] = cookingTime;
        if (status === 'burnt' && t.burntAt[f.key] === null) t.burntAt[f.key] = cookingTime;
      }
      if (!inPan && t.removedAt === null) { t.removedAt = cookingTime; t.centerAtRemoval = centerTemp; }
      if (!inPan && t.settledAt === null && centerTemp < t.centerMax) t.settledAt = cookingTime;
      if (centerTemp > t.centerMax) { t.centerMax = centerTemp; t.centerMaxAt = cookingTime; }
      t.center = getCenterStatus(t.centerMax, centerTarget);
      if (t.center === 'overdone' && t.overdoneAt === null) t.overdoneAt = cookingTime;
      if (t.center !== 'underdone' && t.targetAt === null) t.targetAt = cookingTime;
      const aligned = targetsMet(t);
      if (t.settledAt === null) {
        if (aligned && !t.aligned) t.windows.push({ from: cookingTime, to: cookingTime });
        if (aligned) t.windows[t.windows.length - 1].to = cookingTime;
      }
      t.aligned = aligned;
    };
    return t;
  }
  // Two-sided food (stovetop-outcome-extended.html): browning.A / .B, statuses sideA / sideB
  const createSidedTracker = ({ targetsMet = sidedTargetsMet, centerTarget = CENTER_TARGET } = {}) => createBrowningTracker([
    { key: 'A', status: 'sideA', temp: (s) => s.sideATemp },
    { key: 'B', status: 'sideB', temp: (s) => s.sideBTemp },
  ], targetsMet, centerTarget);
  // One-surface food (stovetop-outcome.html): browning.surface, status surface
  const createSurfaceTracker = ({ targetsMet = surfaceTargetsMet } = {}) => createBrowningTracker([
    { key: 'surface', status: 'surface', temp: (s) => s.surfaceTemp },
  ], targetsMet);

  // For drawing: the crust's color at a browning level. Pale when raw, golden around "good",
  // deep brown as it nears "burnt", black past it.
  const BROWNING_COLORS = [
    [0, [233, 211, 193]], [0.5, [220, 178, 127]], [BROWNING_LEVEL.good, [192, 135, 74]],
    [(BROWNING_LEVEL.good + BROWNING_LEVEL.burnt) / 2, [128, 74, 36]], [BROWNING_LEVEL.burnt, [48, 30, 18]], [BROWNING_LEVEL.burnt + 1.25, [14, 12, 10]],
  ];
  function browningColor(level) {
    const stops = BROWNING_COLORS, last = stops[stops.length - 1];
    if (level >= last[0]) return `rgb(${last[1].join(',')})`;
    let i = 0;
    while (level > stops[i + 1][0]) i++;
    const [l0, c0] = stops[i], [l1, c1] = stops[i + 1], u = (level - l0) / (l1 - l0);
    return `rgb(${c0.map((c, k) => Math.round(c + (c1[k] - c) * u)).join(',')})`;
  }
  // Text drawn over that color stays readable
  const browningInk = (level) => (level < BROWNING_LEVEL.good + 0.7 ? '#2b1d12' : '#fff');

  const LABELS = {
    surface: { under: 'Under-browned', good: 'Good', burnt: 'Burnt' },
    center: { underdone: 'Underdone', target: 'Target', overdone: 'Overdone' },
  };

  return {
    CENTER_TARGET, BROWNING, lowerBrowningBoundary, upperBrowningBoundary, getCenterStatus, getBrowningStatus, LABELS,
    BROWNING_LEVEL, browningRate, steadyTempFor, getBrowningLevelStatus, sidedTargetsMet, surfaceTargetsMet,
    createSidedTracker, createSurfaceTracker, browningColor, browningInk,
  };
})();
