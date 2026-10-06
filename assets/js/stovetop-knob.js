// Shared burner knob for the stovetop diagrams (stovetop-heating.html, stovetop-food.html).
// Off at 7 o'clock, turning clockwise through the preset settings to 100% at 5 o'clock.
// Drag to turn (the knob points at the pointer), click a setting's label to jump to it, or use the keyboard.
//   const knob = StovetopKnob(svgElement, { presets: [['Off', 0], ...], onChange: (pct) => ... });
//   knob.render(pct);  // call whenever the value changes, including after onChange
// The accent color comes from --stk-accent on any ancestor.
window.StovetopKnob = (() => {
  const SVGNS = 'http://www.w3.org/2000/svg';
  const KX = 100, KY = 84, SWEEP = 270; // knob center in its 200 × 164 viewBox; sweep in degrees
  const pctToAngle = (pct) => -SWEEP / 2 + (pct / 100) * SWEEP; // degrees clockwise from 12 o'clock
  const polar = (deg, r) => [KX + r * Math.sin((deg * Math.PI) / 180), KY - r * Math.cos((deg * Math.PI) / 180)];
  const arc = (from, to, r) => {
    const [x0, y0] = polar(from, r), [x1, y1] = polar(to, r);
    return `M${x0.toFixed(2)} ${y0.toFixed(2)} A${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
  };

  const CSS = `
    .stk-knob {
      --stk-hi: #5d626b; --stk-lo: #23262b; --stk-grip: #3b3f46; --stk-mark: #fff;
      width: 188px; height: auto; flex: none; display: block; overflow: visible;
      touch-action: none; cursor: grab; -webkit-tap-highlight-color: transparent;
    }
    :root[data-theme="dark"] .stk-knob { --stk-hi: #9aa0a9; --stk-lo: #4a4f57; --stk-grip: #6c727b; }
    .stk-knob.stk-dragging { cursor: grabbing; }
    .stk-knob:focus { outline: none; }
    .stk-knob:focus-visible .stk-bezel { stroke: var(--stk-accent, #2a78d6); stroke-width: 2.5; }
    .stk-track { fill: none; stroke: var(--tertiary); stroke-width: 4; stroke-linecap: round; }
    .stk-fill { fill: none; stroke: var(--stk-accent, #2a78d6); stroke-width: 4; stroke-linecap: round; }
    .stk-ticks line { stroke: var(--secondary); stroke-width: 1.2; }
    .stk-bezel { fill: var(--code-bg, rgba(127,127,127,.12)); stroke: var(--border); stroke-width: 1; }
    .stk-face { transition: transform .12s ease-out; }
    .stk-dragging .stk-face { transition: none; }
    .stk-preset { cursor: pointer; font-size: 13px; fill: var(--secondary); font-family: inherit; }
    .stk-preset.stk-on { fill: var(--primary); font-weight: 700; }
    @media (prefers-reduced-motion: reduce) { .stk-face { transition: none; } }`;
  let styled = false, count = 0;

  return function StovetopKnob(svg, { presets, onChange }) {
    if (!styled) {
      const style = document.createElement('style');
      style.textContent = CSS;
      document.head.appendChild(style);
      styled = true;
    }
    const gid = `stk-grad-${++count}`;
    svg.classList.add('stk-knob');
    svg.setAttribute('viewBox', '0 0 200 164');
    svg.setAttribute('role', 'slider');
    svg.setAttribute('tabindex', '0');
    svg.setAttribute('aria-valuemin', '0');
    svg.setAttribute('aria-valuemax', '100');

    let ticks = '';
    for (let pct = 0; pct <= 100; pct += 10) {
      const [x0, y0] = polar(pctToAngle(pct), 59), [x1, y1] = polar(pctToAngle(pct), presets.some(([, v]) => v === pct) ? 65 : 62);
      ticks += `<line x1="${x0.toFixed(2)}" y1="${y0.toFixed(2)}" x2="${x1.toFixed(2)}" y2="${y1.toFixed(2)}" />`;
    }
    const labels = presets.map(([name, v]) => {
      const a = pctToAngle(v), [x, y] = polar(a, 71);
      const anchor = Math.abs(a) < 45 ? 'middle' : a < 0 ? 'end' : 'start';
      return `<text class="stk-preset" data-v="${v}" x="${x.toFixed(1)}" y="${y.toFixed(1)}" dy="0.35em" text-anchor="${anchor}">${name}</text>`;
    }).join('');
    svg.innerHTML = `
      <defs><radialGradient id="${gid}" cx=".38" cy=".32" r=".8">
        <stop offset="0" stop-color="var(--stk-hi)" /><stop offset="1" stop-color="var(--stk-lo)" />
      </radialGradient></defs>
      <circle class="stk-bezel" cx="${KX}" cy="${KY}" r="47" />
      <path class="stk-track" d="${arc(pctToAngle(0), pctToAngle(100), 54)}" />
      <path class="stk-fill" />
      <g class="stk-ticks">${ticks}</g>
      <g class="stk-face">
        <circle cx="${KX}" cy="${KY}" r="36" fill="url(#${gid})" stroke="var(--stk-lo)" />
        <rect x="93" y="50" width="14" height="68" rx="7" fill="var(--stk-grip)" />
        <line x1="100" y1="55" x2="100" y2="70" stroke="var(--stk-mark)" stroke-width="3" stroke-linecap="round" />
      </g>
      ${labels}`;
    const face = svg.querySelector('.stk-face'), fill = svg.querySelector('.stk-fill');
    face.style.transformOrigin = `${KX}px ${KY}px`;

    let value = 0;
    const emit = (pct) => onChange(Math.min(100, Math.max(0, Math.round(pct))));

    function pctAt(e) {
      const box = svg.getBoundingClientRect(), scale = box.width / 200;
      const dx = e.clientX - box.left - KX * scale, dy = e.clientY - box.top - KY * scale;
      const deg = (Math.atan2(dx, -dy) * 180) / Math.PI;
      // The gap between 100% and Off at the bottom holds whichever end the knob is nearer
      if (Math.abs(deg) > SWEEP / 2) return value >= 50 ? 100 : 0;
      const pct = ((deg + SWEEP / 2) / SWEEP) * 100;
      const near = presets.find(([, v]) => Math.abs(v - pct) < 2.5); // gentle detent at each setting
      return near ? near[1] : pct;
    }
    let dragging = false;
    svg.addEventListener('pointerdown', (e) => {
      if (e.target.dataset.v) { emit(+e.target.dataset.v); return; }
      dragging = true;
      svg.setPointerCapture(e.pointerId);
      svg.classList.add('stk-dragging');
      emit(pctAt(e));
    });
    svg.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const pct = pctAt(e);
      if (Math.abs(pct - value) < 50) emit(pct); // no jumping straight across the gap
    });
    const endDrag = () => { dragging = false; svg.classList.remove('stk-dragging'); };
    svg.addEventListener('pointerup', endDrag);
    svg.addEventListener('pointercancel', endDrag);
    svg.addEventListener('keydown', (e) => {
      const next = {
        ArrowRight: value + 1, ArrowUp: value + 1, ArrowLeft: value - 1, ArrowDown: value - 1,
        PageUp: value + 10, PageDown: value - 10, Home: 0, End: 100,
      }[e.key];
      if (next === undefined) return;
      e.preventDefault();
      emit(next);
    });

    return {
      render(pct) {
        value = pct;
        const a = pctToAngle(pct), name = (presets.find(([, v]) => v === pct) || [])[0];
        face.style.transform = `rotate(${a}deg)`;
        fill.setAttribute('d', pct ? arc(pctToAngle(0), a, 54) : '');
        svg.setAttribute('aria-valuenow', pct);
        svg.setAttribute('aria-valuetext', `${name ? `${name}, ` : ''}${pct}%`);
        svg.querySelectorAll('.stk-preset').forEach((t) => t.classList.toggle('stk-on', +t.dataset.v === pct));
      },
    };
  };
})();
