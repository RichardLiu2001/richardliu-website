// Shared pan + food schematic for the stovetop simulators (stovetop-food.html, stovetop-outcome.html,
// stovetop-outcome-extended.html): a gas burner, a cutaway pan, and a steak cross-section (thin surface layer
// around the center) that starts on a cutting board, is carried into the pan, and can be taken back out.
// Fills show temperature, not doneness.
//   const scene = StovetopScene(svgElement, { foodStartTemp: 40, heatArrows: false, sides: false, note: (s) => '...' });
//   scene.render({ burner, panTemp, surfaceTemp, centerTemp, foodInPan, running,
//                  foodState, thicknessScale });  // optional: 'waiting' | 'inPan' | 'removed'; 1 = default
//   With sides: true the food has two faces, Side A and Side B, and render() reads
//   { sideATemp, sideBTemp, panContactSide } instead of surfaceTemp. The face on the pan is drawn at the bottom.
//   scene.carryIn();   // animate the food into the pan (visual only)
//   scene.carryOut();  // animate it back onto the board
//   scene.flip();      // with sides: animate a flip (the faces swap places halfway through)
//   scene.cancel();    // stop any animation, e.g. on reset
window.StovetopScene = (() => {
  const SVGNS = 'http://www.w3.org/2000/svg';
  const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
  const PAN = 'M222 146 L240 210 L420 210 L438 146 L431 146 L414 200 L246 200 L229 146 Z';
  // Steak (150 × 42, flat bottom at y = 42): outer band = food surface, inset region = food center
  const OUTER = 'M7.5 42 L142.5 42 Q148.8 42 148.8 34 C150 25.9 146.2 17.9 137.5 14.4 C126.2 9.8 115 12.1 105 8.7 C90 4.1 75 7.5 60 6.4 C42.5 5.2 25 7.5 13.8 13.3 C5 17.9 1.2 29.4 2.5 35.1 Q3.8 42 7.5 42 Z';
  const INNER = 'M17.5 34 L132.5 34 Q138.8 34 138.8 29.4 C138.8 24.8 135 22.5 128.8 21.3 C120 19 111.2 20.2 102.5 16.7 C88.8 13.3 75 15.6 60 14.4 C45 13.3 30 15.6 21.2 20.2 C15 23.6 12.5 28.2 13.8 30.5 Q15 34 17.5 34 Z';
  const MARBLING = ['M20 27.1 q5 -3.4 10 -1.1 t10 -2.3', 'M25 31.6 q3.8 1.1 7.5 0', 'M110 24.8 q5 2.3 10 0 t7.5 2.3', 'M116.2 30.5 q3.8 -1.7 7.5 0', 'M55 19 q3.8 -1.7 7.5 0'];
  const FOOD_OUT = [13, 208], FOOD_IN = [255, 158]; // where the steak's local (0, 0) sits on the board / in the pan

  // Map every absolute coordinate pair of a path through (x, y) → (x, fy(y))
  const mapPath = (d, fy) => d.replace(/(-?[\d.]+) (-?[\d.]+)/g, (_, x, y) => `${x} ${fy(+y).toFixed(2)}`);
  // The steak at thickness scale k (1 = as drawn), still sitting on y = 42. The outline stretches vertically;
  // the surface layer keeps roughly the same thickness, so a thin steak is mostly surface layer.
  function steakGeometry(k) {
    const outerY = (y) => 42 - (42 - y) * k;
    const top = outerY(5), inset = clamp(0.21 * (42 - top), 2.5, 8);
    const iTop = top + inset, iBot = 42 - inset, m = (iBot - iTop) / (34 - 13.3);
    const innerY = (y) => iBot - (34 - y) * m;
    const marbling = MARBLING.map((d) => d.replace(/^M(-?[\d.]+) (-?[\d.]+)/, (_, x, y) => `M${x} ${innerY(+y).toFixed(2)}`));
    return { outer: mapPath(OUTER, outerY), inner: mapPath(INNER, innerY), marbling, top, iTop, iBot, outerY, m };
  }

  const CSS = `
    .sts-scene {
      --sts-flame: #2a78d6; --sts-flame-core: #a9cdf9;
      --sts-steel-hi: #f3f4f6; --sts-steel-lo: #a4a9b1; --sts-metal: #50555e; --sts-warm: #d9822b;
      --sts-surface: #4a3aa7; --sts-center: #1baf7a;
      display: block; overflow: visible;
    }
    :root[data-theme="dark"] .sts-scene {
      --sts-flame: #3987e5; --sts-flame-core: #b9d7fb;
      --sts-steel-hi: #c9ccd2; --sts-steel-lo: #6b717b; --sts-metal: #8a8f98;
      --sts-surface: #9085e9; --sts-center: #199e70;
    }
    .sts-scene text { font-family: inherit; }
    /* Flames scale about their base with burner power (--sts-fx / --sts-fy) */
    .sts-flame { transform: scale(var(--sts-fx, 0), var(--sts-fy, 0)); transition: transform .3s ease; }
    .sts-flicker { animation: sts-flicker .55s ease-in-out infinite alternate paused; }
    .sts-running .sts-flicker { animation-play-state: running; }
    @keyframes sts-flicker { from { transform: scale(1, 1); } to { transform: scale(.9, .84); } }
    .sts-label { font-size: 12px; fill: var(--primary); }
    .sts-note { font-size: 12px; fill: var(--secondary); }
    .sts-arrow { fill: none; stroke: var(--primary); stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
    .sts-arrow-halo { fill: none; stroke: var(--entry); stroke-width: 4.5; stroke-linecap: round; opacity: .8; }
    .sts-arrows { transition: opacity .3s; }
    .sts-badge circle { fill: var(--primary); }
    .sts-badge text { fill: var(--entry); font-size: 8px; font-weight: 700; font-family: inherit; }
    @media (prefers-reduced-motion: reduce) { .sts-flicker { animation: none; } .sts-flame { transition: none; } }`;
  let styled = false, count = 0;

  // Cool blue-gray at fridge temperature → warm orange when hot
  const dark = () => document.documentElement.dataset.theme === 'dark';
  function foodColor(temp, startTemp) {
    const u = clamp((temp - startTemp) / 460, 0, 1);
    const [a, b] = dark() ? [[84, 110, 140], [214, 110, 50]] : [[184, 203, 224], [240, 146, 82]];
    return `rgb(${a.map((c, i) => Math.round(c + (b[i] - c) * u)).join(',')})`;
  }

  return function StovetopScene(svg, { foodStartTemp, heatArrows = false, sides = false, note: noteFor = () => 'steak from the fridge' }) {
    if (!styled) {
      const style = document.createElement('style');
      style.textContent = CSS;
      document.head.appendChild(style);
      styled = true;
    }
    const gid = `sts-steel-${++count}`;
    svg.classList.add('sts-scene');
    svg.setAttribute('viewBox', '0 92 520 180');
    let flames = '';
    for (let i = 0; i < 9; i++) {
      flames +=
        `<g transform="translate(${286 + i * 11} 244) rotate(${(i - 4) * 3})"><g class="sts-flame">` +
        `<g class="sts-flicker" style="animation-duration:${(0.45 + ((i * 37) % 23) / 100).toFixed(2)}s;animation-delay:-${((i * 0.13) % 0.5).toFixed(2)}s">` +
        '<path d="M-5 0 C-5.5 -14 -1.5 -30 0 -46 C1.5 -30 5.5 -14 5 0 Z" fill="var(--sts-flame)" opacity=".85" />' +
        '<path d="M-2.5 0 C-2.8 -7 -0.8 -14 0 -20 C0.8 -14 2.8 -7 2.5 0 Z" fill="var(--sts-flame-core)" />' +
        '</g></g></g>';
    }
    svg.innerHTML = `
      <defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="var(--sts-steel-lo)" /><stop offset=".35" stop-color="var(--sts-steel-hi)" /><stop offset="1" stop-color="var(--sts-steel-lo)" />
      </linearGradient></defs>
      <rect x="0" y="258" width="520" height="10" rx="2" fill="var(--border)" />
      <rect x="4" y="250" width="168" height="8" rx="2" fill="var(--tertiary)" />
      <rect x="176" y="210" width="308" height="4" rx="2" fill="var(--sts-metal)" opacity=".55" />
      <rect x="180" y="210" width="5" height="48" fill="var(--sts-metal)" opacity=".55" />
      <rect x="475" y="210" width="5" height="48" fill="var(--sts-metal)" opacity=".55" />
      <rect x="300" y="251" width="60" height="7" fill="var(--sts-metal)" />
      <rect x="280" y="244" width="100" height="7" rx="2" fill="var(--sts-metal)" />
      ${flames}
      <line x1="436" y1="152" x2="512" y2="141" stroke="var(--sts-steel-lo)" stroke-width="8" stroke-linecap="round" />
      <path d="${PAN}" fill="url(#${gid})" stroke="var(--sts-steel-lo)" />
      <path class="sts-tint" d="${PAN}" fill="var(--sts-warm)" opacity="0" />
      <text x="224" y="184" font-size="13" text-anchor="end" fill="var(--secondary)">pan</text>
      <g class="sts-food" transform="translate(${FOOD_OUT[0]} ${FOOD_OUT[1]})"></g>`;
    const $ = (sel) => svg.querySelector(sel);
    const tint = $('.sts-tint'), food = $('.sts-food');
    let surface, center, note, panArrows, bottomArrows, topArrows, drawnK = null;
    let faces, badges, faceLabel, body, bodyMid = 21; // two-sided food only
    let last = null, tween = null, flipTween = null, shownContact = 'B';
    const place = ([x, y]) => food.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`);

    // Short arrows (with a halo so they read over the food fill), all pointing from y0 to y1
    const arrows = (xs, y0, y1) => xs.map((x) => {
      const dir = Math.sign(y1 - y0);
      return `<path class="sts-arrow-halo" d="M${x} ${y0} L${x} ${y1}" />` +
        `<path class="sts-arrow" d="M${x} ${y0} L${x} ${y1} M${x - 3.2} ${y1 - dir * 4} L${x} ${y1} L${x + 3.2} ${y1 - dir * 4}" />`;
    }).join('');

    // (Re)build the steak for thickness scale k: outline, center, marbling, labels and heat-flow arrows
    function drawFood(k) {
      drawnK = k;
      const g = steakGeometry(k), XS = [40, 75, 110];
      const topAt = { 40: 7, 75: 7.5, 110: 10 }; // the outline's top edge (unscaled) above each arrow
      const labelY = g.top - 13;
      const mid = (g.iTop + g.iBot) / 2, cid = `${gid}-k${String(k).replace('.', '_')}`;
      bodyMid = (g.top + 42) / 2;
      // Two-sided: the outer layer is split at the middle into a top face and a bottom face
      const surfaceMarkup = sides ? `
        <defs><clipPath id="${cid}-top"><rect x="-10" y="-200" width="170" height="${mid + 200}" /></clipPath>
          <clipPath id="${cid}-bot"><rect x="-10" y="${mid}" width="170" height="200" /></clipPath></defs>
        <path class="sts-face sts-face-top" clip-path="url(#${cid}-top)" d="${g.outer}" stroke="var(--sts-surface)" stroke-width="2" stroke-linejoin="round" />
        <path class="sts-face sts-face-bot" clip-path="url(#${cid}-bot)" d="${g.outer}" stroke="var(--sts-surface)" stroke-width="2" stroke-linejoin="round" />`
        : `<path class="sts-food-surface" d="${g.outer}" stroke="var(--sts-surface)" stroke-width="2" stroke-linejoin="round" />`;
      const badge = (cls, y) => `<g class="sts-badge ${cls}" transform="translate(24 ${y.toFixed(1)})"><circle r="5.5" /><text dy="0.35em" text-anchor="middle"></text></g>`;
      food.innerHTML = `<g class="sts-food-body">
        ${surfaceMarkup}
        <path class="sts-food-center" d="${g.inner}" stroke="var(--sts-center)" stroke-width="1.5" stroke-dasharray="4 3" />
        <g fill="none" stroke="#fff" stroke-opacity=".9" stroke-width="1.6" stroke-linecap="round">${g.marbling.map((d) => `<path d="${d}" />`).join('')}</g>
        ${sides ? badge('sts-badge-top', (g.outerY(9) + g.iTop) / 2) + badge('sts-badge-bot', (42 + g.iBot) / 2) : ''}
        </g>
        ${heatArrows ? `
        <g class="sts-arrows sts-arrows-pan" opacity="0">${arrows(XS, 51, 43.5)}</g>
        <g class="sts-arrows sts-arrows-bottom" opacity="0">${arrows(XS, 41, Math.max(g.iBot - 3, 30))}</g>
        <g class="sts-arrows sts-arrows-top" opacity="0">${XS.map((x) => arrows([x], g.outerY(topAt[x]) + 1, Math.min(g.iTop + 3, 30))).join('')}</g>` : ''}
        <g stroke="var(--secondary)"><line x1="56" y1="${labelY + 3}" x2="62" y2="${g.outerY(6.4) + 1.5}" /><line x1="98" y1="${labelY + 3}" x2="96" y2="${(g.iTop + g.iBot) / 2}" /></g>
        <text class="sts-label sts-face-label" x="58" y="${labelY}" text-anchor="end">food surface</text>
        <text class="sts-label" x="96" y="${labelY}">food center</text>
        <text class="sts-note" x="75" y="${labelY - 16}" text-anchor="middle"></text>`;
      surface = food.querySelector('.sts-food-surface');
      faces = { top: food.querySelector('.sts-face-top'), bot: food.querySelector('.sts-face-bot') };
      badges = { top: food.querySelector('.sts-badge-top text'), bot: food.querySelector('.sts-badge-bot text') };
      faceLabel = food.querySelector('.sts-face-label');
      body = food.querySelector('.sts-food-body');
      center = food.querySelector('.sts-food-center');
      note = food.querySelector('.sts-note');
      panArrows = food.querySelector('.sts-arrows-pan');
      bottomArrows = food.querySelector('.sts-arrows-bottom');
      topArrows = food.querySelector('.sts-arrows-top');
    }

    function render(s) {
      last = s;
      const k = s.thicknessScale ?? 1;
      const state = s.foodState ?? (s.foodInPan ? 'inPan' : 'waiting');
      if (k !== drawnK) drawFood(k);
      const p = s.burner / 100;
      svg.style.setProperty('--sts-fx', p ? 0.75 + 0.35 * p : 0);
      svg.style.setProperty('--sts-fy', p ? (0.3 + 0.7 * p) * 0.72 : 0);
      svg.classList.toggle('sts-running', !!s.running);
      tint.setAttribute('opacity', (0.22 * clamp((s.panTemp - 150) / 450, 0, 1)).toFixed(3));
      // Two-sided: whichever face is on the pan is drawn at the bottom (it swaps halfway through a flip)
      if (!flipTween) shownContact = s.panContactSide ?? 'B';
      const bottomSide = shownContact, topSide = bottomSide === 'A' ? 'B' : 'A';
      const faceTemp = (side) => (side === 'A' ? s.sideATemp : s.sideBTemp);
      const topTemp = sides ? faceTemp(topSide) : s.surfaceTemp, bottomTemp = sides ? faceTemp(bottomSide) : s.surfaceTemp;
      if (sides) {
        for (const [pos, side] of [['top', topSide], ['bot', bottomSide]]) {
          faces[pos].setAttribute('fill', foodColor(faceTemp(side), foodStartTemp));
          faces[pos].setAttribute('stroke-dasharray', side === 'B' ? '6 4' : 'none'); // Side B is dashed, as on the graphs
          badges[pos].textContent = side;
        }
        faceLabel.textContent = `Side ${topSide} (up)`;
      } else {
        surface.setAttribute('fill', foodColor(s.surfaceTemp, foodStartTemp));
      }
      center.setAttribute('fill', foodColor(s.centerTemp, foodStartTemp));
      note.textContent = noteFor(s);
      note.style.display = state === 'inPan' ? 'none' : '';
      if (heatArrows) {
        // Heat flowing in: from the pan into the bottom while cooking; inward from both faces once removed
        // (two-sided food: each face heats the center whenever it's hotter than the center)
        const inward = (temp) => (state === 'waiting' ? 0 : clamp((temp - s.centerTemp) / 120, 0, 1));
        const fromPan = state === 'inPan' ? clamp((s.panTemp - bottomTemp) / 120, 0, 1) : 0;
        const show = (el, v) => el.setAttribute('opacity', v > 0.02 ? (0.25 + 0.75 * v).toFixed(2) : 0);
        show(panArrows, fromPan);
        show(bottomArrows, inward(bottomTemp));
        show(topArrows, sides || state === 'removed' ? inward(topTemp) : 0);
      }
      if (!tween) place(state === 'inPan' ? FOOD_IN : FOOD_OUT);
    }

    // Carry the food between the board and the pan along a short arc.
    // Visual only: the physics already counts it as moved.
    function carry(from, to) {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      tween = { start: performance.now() };
      const tick = (now) => {
        if (!tween) return;
        const u = clamp((now - tween.start) / 900, 0, 1), e = u < 0.5 ? 2 * u * u : 1 - 2 * (1 - u) * (1 - u);
        place([from[0] + (to[0] - from[0]) * e, from[1] + (to[1] - from[1]) * e - 70 * Math.sin(Math.PI * e)]);
        if (u < 1) requestAnimationFrame(tick);
        else { tween = null; if (last) render(last); }
      };
      requestAnimationFrame(tick);
    }
    const carryIn = () => carry(FOOD_OUT, FOOD_IN);
    const carryOut = () => carry(FOOD_IN, FOOD_OUT);

    // Flip: squash the food flat and back (about 0.4 s); the faces swap places at the halfway point.
    // Visual only: the physics has already switched which side touches the pan.
    function flip() {
      const squash = (v) => body.setAttribute('transform', `translate(0 ${bodyMid}) scale(1 ${v.toFixed(3)}) translate(0 ${-bodyMid})`);
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) { flipTween = null; if (last) render(last); return; }
      flipTween = { start: performance.now() };
      const tick = (now) => {
        if (!flipTween) return;
        const u = clamp((now - flipTween.start) / 400, 0, 1);
        if (u >= 0.5 && last) shownContact = last.panContactSide ?? 'B';
        squash(Math.abs(Math.cos(Math.PI * u)));
        if (last) render(last);
        if (u < 1) requestAnimationFrame(tick);
        else { flipTween = null; squash(1); if (last) render(last); }
      };
      requestAnimationFrame(tick);
    }
    const cancel = () => { tween = null; flipTween = null; if (body) body.removeAttribute('transform'); };

    // Food colors are computed per theme, so repaint when the theme toggle flips
    new MutationObserver(() => last && render(last)).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return { render, carryIn, carryOut, flip, cancel };
  };
})();
