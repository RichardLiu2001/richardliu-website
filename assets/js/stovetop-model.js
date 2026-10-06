// Shared thermal model for the stovetop diagrams (stovetop-heating.html, stovetop-curves.html).
// One lumped body: burner → pan → room.
//     dT_pan/dt = (P_burner − k_loss · (T_pan − T_room)) / C_pan
// Conceptual numbers, not a particular stove: a ~1.2 kg stainless pan, and a burner that
// delivers up to 1.5 kW to it. Heat loss is linear in (T_pan − T_room) to keep the model simple.
window.StovetopModel = (() => {
  const MODEL = {
    roomTemp: 70,           // T_room, °F
    heatCapacity: 300,      // C_pan, J/°F
    lossCoeff: 1500 / 505,  // k_loss, W/°F: chosen so full power settles at 575°F
    maxPower: 1500,         // P_burner at 100%, W
  };
  const DT = 0.05;          // simulated seconds per physics step
  const PRESETS = [['Off', 0], ['Low', 40], ['Medium', 70], ['High', 100]];

  const burnerWatts = (pct) => (MODEL.maxPower * pct) / 100;
  const equilibriumTemp = (pct) => MODEL.roomTemp + burnerWatts(pct) / MODEL.lossCoeff;

  function heatFlows(panTemp, burnerPct) {
    const heatIn = burnerWatts(burnerPct);
    const heatOut = MODEL.lossCoeff * (panTemp - MODEL.roomTemp);
    return { heatIn, heatOut, net: heatIn - heatOut };
  }

  // One explicit Euler step of the equation above.
  // More bodies (e.g. food) would add their own temperatures and heat flows here.
  const stepPanTemp = (panTemp, burnerPct, dt) => panTemp + (heatFlows(panTemp, burnerPct).net / MODEL.heatCapacity) * dt;

  // A whole run at a fixed burner setting from room temperature: [{ time, temp }] every sampleSec seconds
  function simulate(burnerPct, seconds, sampleSec = 1) {
    const every = Math.round(sampleSec / DT), steps = Math.round(seconds / DT);
    let temp = MODEL.roomTemp;
    const out = [{ time: 0, temp }];
    for (let i = 1; i <= steps; i++) {
      temp = stepPanTemp(temp, burnerPct, DT);
      if (i % every === 0) out.push({ time: i * DT, temp });
    }
    return out;
  }

  // ---- Food (stovetop-food.html): two lumped nodes heated only through the pan
  //     pan → food surface → food center
  //     Q_pan_food       = k_contact · (T_pan − T_surface)      (0 until the food is in the pan)
  //     Q_surface_center = k_food · (T_surface − T_center)
  //     dT_pan/dt     = (P_burner − Q_pan_room − Q_pan_food) / C_pan
  //     dT_surface/dt = (Q_pan_food − Q_surface_center) / C_surface
  //     dT_center/dt  = Q_surface_center / C_center
  // Roughly a 200 g piece of food: a thin outer layer and a much larger center.
  const FOOD = {
    startTemp: 40,          // °F, straight from the fridge
    contactCoeff: 4,        // k_contact, W/°F: pan → food surface
    conductCoeff: 0.6,      // k_food, W/°F: surface → center (slow: food conducts heat poorly)
    surfaceCapacity: 70,    // C_surface, J/°F
    centerCapacity: 320,    // C_center, J/°F
  };

  // s: { panTemp, surfaceTemp, centerTemp, burner, foodInPan }
  function foodHeatFlows(s) {
    const { heatIn, heatOut } = heatFlows(s.panTemp, s.burner);
    const panToFood = s.foodInPan ? FOOD.contactCoeff * (s.panTemp - s.surfaceTemp) : 0;
    const surfaceToCenter = s.foodInPan ? FOOD.conductCoeff * (s.surfaceTemp - s.centerTemp) : 0;
    return { heatIn, panToRoom: heatOut, panToFood, surfaceToCenter };
  }

  // One explicit Euler step for all three temperatures (every flow uses the temperatures before the step)
  function stepWithFood(s, dt) {
    const f = foodHeatFlows(s);
    s.panTemp += ((f.heatIn - f.panToRoom - f.panToFood) / MODEL.heatCapacity) * dt;
    s.surfaceTemp += ((f.panToFood - f.surfaceToCenter) / FOOD.surfaceCapacity) * dt;
    s.centerTemp += (f.surfaceToCenter / FOOD.centerCapacity) * dt;
  }

  // ---- Food with thickness, a starting temperature, and removal (stovetop-outcome-extended.html)
  // Same equations as above, plus:
  //   - thickness sets the surface → center conductance. Heating time through a slab grows like
  //     thickness², so k_food_effective = k_food · (referenceThickness / thickness)². A conceptual
  //     approximation, not a detailed model of real meat. At the reference thickness it matches stepWithFood.
  //   - after the food is removed, there is no pan → surface flow; the surface keeps feeding the center and
  //     also loses heat to the room:  Q_surface_room = k_food_air · (T_surface − T_room)
  //     dT_surface/dt = (−Q_surface_center − Q_surface_room) / C_surface
  //     dT_center/dt  = Q_surface_center / C_center
  // foodState: 'waiting' (beside the pan, no heat flows) | 'inPan' | 'removed'
  const FOOD_EXTRA = {
    referenceThickness: 1.5, // in
    airCoeff: 0.8,           // k_food_air, W/°F: food surface → room once out of the pan
  };
  const conductFor = (thickness) => FOOD.conductCoeff * (FOOD_EXTRA.referenceThickness / thickness) ** 2;

  // s: { panTemp, surfaceTemp, centerTemp, burner, foodState, thickness }
  function lifecycleHeatFlows(s) {
    const { heatIn, heatOut } = heatFlows(s.panTemp, s.burner);
    const inPan = s.foodState === 'inPan', removed = s.foodState === 'removed';
    return {
      heatIn,
      panToRoom: heatOut,
      panToFood: inPan ? FOOD.contactCoeff * (s.panTemp - s.surfaceTemp) : 0,
      surfaceToCenter: inPan || removed ? conductFor(s.thickness) * (s.surfaceTemp - s.centerTemp) : 0,
      surfaceToRoom: removed ? FOOD_EXTRA.airCoeff * (s.surfaceTemp - MODEL.roomTemp) : 0,
    };
  }

  // One explicit Euler step for all three temperatures (every flow uses the temperatures before the step)
  function stepFoodLifecycle(s, dt) {
    const f = lifecycleHeatFlows(s);
    s.panTemp += ((f.heatIn - f.panToRoom - f.panToFood) / MODEL.heatCapacity) * dt;
    s.surfaceTemp += ((f.panToFood - f.surfaceToCenter - f.surfaceToRoom) / FOOD.surfaceCapacity) * dt;
    s.centerTemp += (f.surfaceToCenter / FOOD.centerCapacity) * dt;
  }

  // ---- Two-sided food (stovetop-outcome-extended.html): Side A ↔ Center ↔ Side B
  // A and B are physical faces of the food; they keep their names (and temperatures) when it's flipped.
  // In the pan, the side named by panContactSide touches the pan and the other faces the air:
  //     Q_pan_contact = k_contact · (T_pan − T_contact)
  //     Q_air_loss    = k_food_air · (T_exposed − T_room)
  // Once removed, both sides face the air. Each side exchanges heat with the center:
  //     Q_side_center = k_side · (T_side − T_center),  k_side = k_side_ref · (referenceThickness / thickness)²
  //     dT_side/dt   = (heat in − Q_side_center − heat lost to air) / C_side
  //     dT_center/dt = (Q_A_center + Q_B_center) / C_center
  // foodState: 'waiting' (beside the pan, no heat flows) | 'inPan' | 'removed'
  const SIDED = {
    sideCapacity: 70,   // C_side, J/°F: each face's layer (the same as the one-surface model's surface layer)
    // k_side_ref, W/°F at the reference thickness. Lower than the one-surface model's 0.6 because the center now
    // takes heat through both faces; tuned so one well-timed flip on Medium can line up both sides and the center.
    sideConduct: 0.35,
  };
  const sideConductFor = (thickness) => SIDED.sideConduct * (FOOD_EXTRA.referenceThickness / thickness) ** 2;
  const otherSide = (side) => (side === 'A' ? 'B' : 'A');

  // s: { panTemp, sideATemp, sideBTemp, centerTemp, burner, foodState, panContactSide, thickness }
  function sidedHeatFlows(s) {
    const { heatIn, heatOut } = heatFlows(s.panTemp, s.burner);
    const inPan = s.foodState === 'inPan', cooking = s.foodState !== 'waiting';
    const temp = { A: s.sideATemp, B: s.sideBTemp }, k = sideConductFor(s.thickness);
    const f = { heatIn, panToRoom: heatOut, panToFood: 0, toCenter: { A: 0, B: 0 }, toAir: { A: 0, B: 0 }, fromPan: { A: 0, B: 0 } };
    if (!cooking) return f;
    for (const side of ['A', 'B']) {
      f.toCenter[side] = k * (temp[side] - s.centerTemp);
      const onPan = inPan && side === s.panContactSide;
      if (onPan) f.fromPan[side] = f.panToFood = FOOD.contactCoeff * (s.panTemp - temp[side]);
      else f.toAir[side] = FOOD_EXTRA.airCoeff * (temp[side] - MODEL.roomTemp);
    }
    return f;
  }

  // One explicit Euler step for all four temperatures (every flow uses the temperatures before the step)
  function stepFoodSided(s, dt) {
    const f = sidedHeatFlows(s);
    s.panTemp += ((f.heatIn - f.panToRoom - f.panToFood) / MODEL.heatCapacity) * dt;
    s.sideATemp += ((f.fromPan.A - f.toCenter.A - f.toAir.A) / SIDED.sideCapacity) * dt;
    s.sideBTemp += ((f.fromPan.B - f.toCenter.B - f.toAir.B) / SIDED.sideCapacity) * dt;
    s.centerTemp += ((f.toCenter.A + f.toCenter.B) / FOOD.centerCapacity) * dt;
  }

  return {
    MODEL, DT, PRESETS, burnerWatts, equilibriumTemp, heatFlows, stepPanTemp, simulate,
    FOOD, foodHeatFlows, stepWithFood,
    FOOD_EXTRA, conductFor, lifecycleHeatFlows, stepFoodLifecycle,
    SIDED, sideConductFor, otherSide, sidedHeatFlows, stepFoodSided,
  };
})();
