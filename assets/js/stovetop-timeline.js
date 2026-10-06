// Static drawing of a finished (or paused) two-sided cook, in the same visual language as the live simulator
// (stovetop-outcome-extended.html): side and center temperatures with the center target band, flip and removal
// marks, and outcome strips underneath on the same time axis: Side A / Side B browning in crust color, center
// doneness, and a thin "ready" strip. Used by the diagnosis cards and the strategy finder.
//   StovetopTimeline.draw(svgElement, simState, { id, width, compact, ghostCenter, endLabels })
// Colors come from CSS custom properties on an ancestor: --stl-surface, --stl-center, --stl-good, --stl-bad.
window.StovetopTimeline = (() => {
  const OUT = window.StovetopOutcome;
  const STATE_TEXT = { under: 'under-browned', good: 'good', burnt: 'burnt', underdone: 'underdone', target: 'target', overdone: 'overdone' };
  const fmtT = (t) => `${Math.round(t)}°F`;

  // Cooking-time series [minutes, value] for one history key, plus the live point
  function series(s, key, live) {
    const h = s.history, pts = [];
    for (let i = 0; i < h.time.length; i++) if (h.time[i] > s.foodAddedAt && h[key][i] !== null) pts.push([(h.time[i] - s.foodAddedAt) / 60, h[key][i]]);
    pts.unshift([0, key === 'sideA' ? s.foodStart.sideA : key === 'sideB' ? s.foodStart.sideB : key === 'center' ? s.foodStart.center : 0]);
    pts.push([(s.time - s.foodAddedAt) / 60, live]);
    return pts;
  }

  // Runs of the same state per strip, from stored history (browning level, hottest center so far)
  function runs(s) {
    const out = { A: [], B: [], center: [], ready: [] }, a = series(s, 'brownA', s.outcome.browning.A), b = series(s, 'brownB', s.outcome.browning.B), c = series(s, 'center', s.centerTemp);
    let centerMax = -Infinity;
    const push = (k, t, state) => {
      const r = out[k], last = r[r.length - 1];
      if (last) last.to = t;
      if (!last || last.state !== state) r.push({ from: t, to: t, state });
    };
    a.forEach(([t, levelA], i) => {
      centerMax = Math.max(centerMax, c[i][1]);
      const o = { sideA: OUT.getBrowningLevelStatus(levelA), sideB: OUT.getBrowningLevelStatus(b[i][1]), center: OUT.getCenterStatus(centerMax, s.centerTarget) };
      push('A', t, o.sideA); push('B', t, o.sideB); push('center', t, o.center);
      push('ready', t, OUT.sidedTargetsMet(o) ? 'ready' : 'none');
    });
    return out;
  }

  function draw(svg, s, { id = 'stl', width = 320, compact = true, ghostCenter = null, endLabels = !compact } = {}) {
    const fs = compact ? 9.5 : 11.5;
    const M = { top: 8, right: endLabels ? 96 : 8, left: compact ? 40 : 52 };
    const plotH = compact ? 92 : 220, rowH = compact ? 9 : 14, rowGap = compact ? 3 : 5, readyH = compact ? 5 : 7, gap = compact ? 7 : 12;
    const W = width, pw = W - M.left - M.right;
    const span = Math.max(0.5, (s.time - s.foodAddedAt) / 60);
    const A = series(s, 'sideA', s.sideATemp), B = series(s, 'sideB', s.sideBTemp), C = series(s, 'center', s.centerTemp);
    const yMax = Math.max(400, Math.ceil((Math.max(...A.map((p) => p[1]), ...B.map((p) => p[1])) + 20) / 100) * 100);
    const sx = (m) => M.left + (m / span) * pw, sy = (v) => M.top + (1 - v / yMax) * plotH, yBase = M.top + plotH;
    const stripTop = yBase + gap, rowY = (i) => stripTop + i * (rowH + rowGap), yReady = rowY(3), axisY = yReady + readyH + (compact ? 12 : 16);
    const H = axisY + (compact ? 4 : 18);
    const x0 = M.left, x1 = W - M.right;
    const path = (pts) => pts.map(([m, v], i) => `${i ? 'L' : 'M'}${sx(m).toFixed(1)} ${sy(v).toFixed(1)}`).join('');
    let out = '', defs = '';

    // grid, band, axis
    for (let v = 100; v < yMax; v += 100) out += `<line x1="${x0}" x2="${x1}" y1="${sy(v)}" y2="${sy(v)}" stroke="var(--border)" />`;
    for (let v = 0; v <= yMax; v += compact ? 200 : 100) out += `<text x="${x0 - 5}" y="${sy(v)}" dy="0.32em" text-anchor="end" font-size="${fs}" fill="var(--secondary)">${v}°F</text>`;
    const yT = sy(s.centerTarget.max), yB = sy(s.centerTarget.min);
    out += `<rect x="${x0}" y="${yT}" width="${pw}" height="${Math.max(1.5, yB - yT)}" fill="var(--stl-good)" fill-opacity=".22" />`;
    out += `<line x1="${x0}" x2="${x1}" y1="${yBase}" y2="${yBase}" stroke="var(--tertiary)" />`;

    // flips and removal, through the strips
    const markBottom = yReady + readyH;
    for (const e of s.flipEvents) out += `<line x1="${sx(e.cookingTime / 60)}" x2="${sx(e.cookingTime / 60)}" y1="${M.top}" y2="${markBottom}" stroke="var(--secondary)" stroke-dasharray="1 3" />`;
    if (s.foodRemovedAt !== null) {
      const xr = sx((s.foodRemovedAt - s.foodAddedAt) / 60);
      out += `<line x1="${xr}" x2="${xr}" y1="${M.top}" y2="${markBottom}" stroke="var(--primary)" stroke-dasharray="3 3" />`;
      out += `<text x="${xr + 3}" y="${M.top + fs}" font-size="${fs}" fill="var(--primary)">removed</text>`;
    }

    // curves: an optional ghost (another run's center, for comparison), then the sides and the center
    if (ghostCenter) out += `<path d="${ghostCenter.filter(([m]) => m <= span).map(([m, v], i) => `${i ? 'L' : 'M'}${sx(m).toFixed(1)} ${sy(v).toFixed(1)}`).join('')}" fill="none" stroke="var(--secondary)" stroke-opacity=".55" stroke-width="1.5" stroke-dasharray="2 3" />`;
    out += `<path d="${path(B)}" fill="none" stroke="var(--stl-surface)" stroke-width="${compact ? 1.4 : 2}" stroke-dasharray="${compact ? '4 3' : '6 4'}" />`;
    out += `<path d="${path(A)}" fill="none" stroke="var(--stl-surface)" stroke-width="${compact ? 1.4 : 2}" />`;
    out += `<path d="${path(C)}" fill="none" stroke="var(--stl-center)" stroke-width="${compact ? 1.8 : 2.4}" />`;
    if (endLabels) {
      const ends = [['Side A', A], ['Side B', B], ['Center', C]].map(([name, pts]) => ({ name, v: pts[pts.length - 1][1], y: sy(pts[pts.length - 1][1]) })).sort((p, q) => p.y - q.y);
      for (let i = 1; i < ends.length; i++) ends[i].y = Math.max(ends[i].y, ends[i - 1].y + 13);
      out += ends.map((e) => `<text x="${x1 + 6}" y="${e.y}" dy="0.32em" font-size="${fs}" font-weight="600" fill="var(--primary)">${e.name} ${fmtT(e.v)}</text>`).join('');
    }

    // strips: crust-color browning for each side, doneness for the center, then "ready"
    const R = runs(s);
    [['A', 'Side A'], ['B', 'Side B'], ['center', 'Center']].forEach(([key, label], i) => {
      const y = rowY(i), mid = y + rowH / 2;
      out += `<rect x="${x0}" y="${y}" width="${pw}" height="${rowH}" fill="var(--code-bg, rgba(127,127,127,.1))" />`;
      out += `<text x="${x0 - 5}" y="${mid}" dy="0.35em" text-anchor="end" font-size="${fs}" fill="var(--secondary)">${compact ? label.replace('Side ', '') : label}</text>`;
      if (key !== 'center') {
        const lv = series(s, `brown${key}`, s.outcome.browning[key]), gid = `${id}-${key}`;
        let stops = '', lastX = -Infinity;
        lv.forEach(([m, level], k) => {
          const x = sx(m);
          if (x - lastX < 2 && k < lv.length - 1) return;
          lastX = x;
          stops += `<stop offset="${((x - x0) / pw).toFixed(4)}" stop-color="${OUT.browningColor(level)}" />`;
        });
        defs += `<linearGradient id="${gid}" gradientUnits="userSpaceOnUse" x1="${x0}" x2="${x1}" y1="0" y2="0">${stops}</linearGradient>`;
        out += `<rect x="${x0}" y="${y}" width="${pw}" height="${rowH}" fill="url(#${gid})" />`;
      }
      R[key].forEach((r, k) => {
        const a = sx(r.from), w = Math.max(1, sx(r.to) - a), text = STATE_TEXT[r.state];
        if (key === 'center') {
          const fill = r.state === 'target' ? 'var(--stl-good)' : r.state === 'overdone' ? 'var(--stl-bad)' : 'var(--tertiary)';
          out += `<rect x="${a.toFixed(1)}" y="${y}" width="${w.toFixed(1)}" height="${rowH}" fill="${fill}" fill-opacity=".38" />`;
        } else if (k > 0) out += `<line x1="${a}" x2="${a}" y1="${y}" y2="${y + rowH}" stroke="var(--entry)" stroke-width="1.2" />`;
        if (!compact && w > text.length * 6 + 10) {
          const ink = key === 'center' ? 'var(--primary)' : r.state === 'burnt' ? '#fff' : '#2b1d12';
          out += `<text x="${a + 4}" y="${mid}" dy="0.35em" font-size="10" fill="${ink}">${text}</text>`;
        }
      });
    });
    out += `<text x="${x0 - 5}" y="${yReady + readyH / 2}" dy="0.35em" text-anchor="end" font-size="${fs}" fill="var(--secondary)">${compact ? '✓' : 'Ready'}</text>`;
    out += `<rect x="${x0}" y="${yReady}" width="${pw}" height="${readyH}" fill="var(--code-bg, rgba(127,127,127,.1))" />`;
    for (const r of R.ready) if (r.state === 'ready') out += `<rect x="${sx(r.from)}" y="${yReady}" width="${Math.max(2, sx(r.to) - sx(r.from))}" height="${readyH}" fill="var(--stl-good)" fill-opacity=".75" />`;

    // time axis (cooking minutes)
    const step = span <= 4 ? 1 : span <= 8 ? 2 : span <= 16 ? 4 : 5;
    for (let m = 0; m <= span + 1e-9; m += step) out += `<text x="${sx(m)}" y="${axisY}" text-anchor="middle" font-size="${fs}" fill="var(--secondary)">${m}</text>`;
    if (!compact) out += `<text x="${(x0 + x1) / 2}" y="${H - 2}" text-anchor="middle" font-size="${fs}" fill="var(--secondary)">Cooking time (minutes)</text>`;

    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.innerHTML = `<defs>${defs}</defs>${out}`;
  }

  // One-line verdict for a run: each target with ✓/✗, the center's peak, and whether all three were met together
  function verdict(s) {
    const o = s.outcome, ok = (cond) => (cond ? '✓' : '✗');
    const center = o.removedAt !== null ? `${fmtT(o.centerAtRemoval)} at removal → ${fmtT(o.centerMax)} peak` : fmtT(s.centerTemp);
    return {
      ok: o.sideA === 'good' && o.sideB === 'good' && o.center === 'target',
      parts: [
        [o.sideA === 'good', `Side A ${STATE_TEXT[o.sideA]}`],
        [o.sideB === 'good', `Side B ${STATE_TEXT[o.sideB]}`],
        [o.center === 'target', `Center ${STATE_TEXT[o.center]} (${center})`],
      ].map(([good, text]) => ({ good, text: `${ok(good)} ${text}` })),
    };
  }

  return { draw, verdict, series };
})();
