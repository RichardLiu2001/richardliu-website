// Shared face drawing for the makeup diagrams (makeup-layers.html, makeup-product-map.html).
// Everything is on a 200 x 260 canvas. Each layer's draw(p) returns SVG markup; p is a unique id prefix.
window.MakeupFace = (() => {
  // Face geometry on a 200 x 260 canvas. Left-side features are mirrored for the right side.
  const FACE = 'M100 48 C140 48 162 78 162 122 C162 165 138 206 100 214 C62 206 38 165 38 122 C38 78 60 48 100 48 Z';
  const HAIR = 'M100 28 C152 28 180 70 178 130 C177 190 170 230 164 262 L36 262 C30 230 23 190 22 130 C20 70 48 28 100 28 Z';
  const NECK = 'M78 180 Q80 225 70 262 L130 262 Q120 225 122 180 Z';
  const EYE = 'M60 118 Q76 106 92 118 Q76 128 60 118 Z';
  const BROW = 'M60 104 Q74 95 92 101';
  const NOSE = 'M97 125 Q95 142 91 150 Q94 156 100 155 Q106 156 109 150';
  const LIPS = 'M84 180 Q92 172 100 176 Q108 172 116 180 Q108 194 100 194 Q92 194 84 180 Z';
  const MOUTH = 'M84 180 Q100 184 116 180';
  const both = (s) => s + `<g transform="translate(200 0) scale(-1 1)">${s}</g>`;
  const blur = (id, sd) => `<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${sd}"/></filter>`;

  // Everything but the eyes and lips, so base products don't paint over them.
  const skinMask = (id) => `<mask id="${id}"><path d="${FACE}" fill="#fff"/><g fill="#000">${both('<ellipse cx="76" cy="117" rx="17" ry="8"/>')}<path d="${LIPS}"/></g></mask>`;

  // Scattered spray droplets for FINISH_SET, placed on a jittered grid across the face
  const MIST = Array.from({ length: 48 }, (_, i) => {
    const col = i % 8, row = Math.floor(i / 8);
    const x = 52 + col * 13 + ((row * 7 + col * 3) % 5), y = 70 + row * 24 + ((col * 11 + row * 5) % 9);
    return `<circle cx="${x}" cy="${y}" r="${1 + ((col + row) % 3) * 0.5}"/>`;
  }).join('');

  const LAYERS = [
    {
      name: 'Bare skin',
      note: 'Clean and moisturized, with the usual redness, blemishes, and under-eye shadows.',
      draw: (p) => `
        <defs>
          <radialGradient id="${p}g" cx="50%" cy="42%" r="60%"><stop offset="0" stop-color="#e6b490"/><stop offset="1" stop-color="#c98f6c"/></radialGradient>
          ${blur(p + 'b3', 3)}${blur(p + 'b2', 2)}
        </defs>
        <path d="${HAIR}" fill="#3a2820"/>
        <path d="M100 30 C70 34 52 52 46 80" fill="none" stroke="#5a4034" stroke-width="2" opacity=".6"/>
        <path d="${NECK}" fill="#c98f6c"/>
        ${both('<ellipse cx="40" cy="130" rx="8" ry="14" fill="#cf9572"/>')}
        <path d="${FACE}" fill="url(#${p}g)"/>
        <g filter="url(#${p}b3)" fill="#d4675f" opacity=".45">
          <ellipse cx="100" cy="150" rx="15" ry="8"/><ellipse cx="66" cy="152" rx="12" ry="8"/><ellipse cx="134" cy="154" rx="10" ry="7"/>
        </g>
        <g filter="url(#${p}b2)" fill="#6e4663" opacity=".45">${both('<ellipse cx="76" cy="127" rx="12" ry="4"/>')}</g>
        <g fill="#b9524d"><circle cx="128" cy="160" r="2.2"/><circle cx="70" cy="166" r="1.8"/><circle cx="108" cy="202" r="2"/><circle cx="118" cy="70" r="1.8"/></g>
        ${both(`
          <path d="${BROW}" fill="none" stroke="#8b6a52" stroke-width="2.2" stroke-linecap="round" opacity=".75"/>
          <path d="${EYE}" fill="#fbf7f2"/>
          <circle cx="76" cy="117" r="6" fill="#6b4428"/><circle cx="76" cy="117" r="2.8" fill="#1d130d"/><circle cx="78" cy="115" r="1.1" fill="#fff"/>
          <path d="M60 118 Q76 106 92 118" fill="none" stroke="#5a3b2b" stroke-width="1.2"/>
        `)}
        <path d="${NOSE}" fill="none" stroke="#a8745a" stroke-width="1.4" stroke-linecap="round"/>
        <path d="${LIPS}" fill="#c98079"/>
        <path d="${MOUTH}" fill="none" stroke="#8e4d48" stroke-width="1.2"/>`,
    },
    {
      name: 'PREP',
      note: 'Primer. Fills in pores and texture so everything after it goes on smoothly and stays put.',
      draw: (p) => `
        <defs>${skinMask(p + 'm')}${blur(p + 'b', 6)}</defs>
        <g mask="url(#${p}m)">
          <path d="${FACE}" fill="#f6eaf2" opacity=".32"/>
          <g filter="url(#${p}b)" fill="#fff" opacity=".5">
            <ellipse cx="100" cy="78" rx="30" ry="14"/><ellipse cx="100" cy="140" rx="9" ry="26"/><ellipse cx="100" cy="204" rx="12" ry="6"/>
          </g>
        </g>`,
    },
    {
      name: 'COMPLEXION_BASE',
      note: 'Foundation, skin tint, BB/CC cream. Evens out tone across the whole face, before concealer, so you only conceal what it missed.',
      draw: (p) => `
        <defs>
          ${skinMask(p + 'm')}
          <radialGradient id="${p}g" cx="50%" cy="42%" r="60%"><stop offset="0" stop-color="#efc6a4"/><stop offset="1" stop-color="#dcaa86"/></radialGradient>
        </defs>
        <path d="${FACE}" fill="url(#${p}g)" opacity=".86" mask="url(#${p}m)"/>`,
    },
    {
      name: 'LOCAL_CORRECTION',
      note: 'Concealer, color corrector. Spot coverage: brightens under the eyes and hides blemishes that still show through.',
      draw: (p) => `
        <defs>${blur(p + 'b', 1.6)}</defs>
        <g filter="url(#${p}b)" fill="#f7d9bc" opacity=".85">
          ${both('<path d="M63 124 Q76 131 90 124 L80 146 Z"/>')}
        </g>
        <g filter="url(#${p}b)" fill="#eec3a1">
          <circle cx="128" cy="160" r="3.6"/><circle cx="70" cy="166" r="3.2"/><circle cx="108" cy="202" r="3.4"/><circle cx="118" cy="70" r="3.2"/>
        </g>`,
    },
    {
      name: 'FACE_DIMENSION_COLOR',
      note: 'Blush, bronzer, contour, highlighter. Adds back the shape and color that the base flattened.',
      draw: (p) => `
        <defs>${blur(p + 'b4', 4)}${blur(p + 'b5', 5)}${blur(p + 'b1', 1.4)}</defs>
        <g filter="url(#${p}b4)" fill="#8a5a40" opacity=".42">
          ${both('<ellipse cx="56" cy="152" rx="17" ry="5.5" transform="rotate(-28 56 152)"/><ellipse cx="47" cy="92" rx="7" ry="16"/>')}
          <ellipse cx="100" cy="212" rx="22" ry="4"/>
        </g>
        <g filter="url(#${p}b5)" fill="#e2657a" opacity=".5">${both('<circle cx="68" cy="146" r="12"/>')}</g>
        <g filter="url(#${p}b1)" fill="#fff6e2" opacity=".85">
          ${both('<ellipse cx="62" cy="134" rx="10" ry="2.6" transform="rotate(-22 62 134)"/>')}
          <path d="M99 124 L101 124 L101.5 142 L98.5 142 Z"/><ellipse cx="100" cy="172" rx="3" ry="1.4"/>
        </g>`,
    },
    {
      name: 'FEATURE_MAKEUP',
      note: 'Eyeshadow, eyeliner, mascara, brows, lip liner, lipstick. Makes individual features stand out.',
      draw: (p) => `
        <defs>
          ${blur(p + 'b', 1.2)}
          <linearGradient id="${p}g" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#7a3f63"/><stop offset="1" stop-color="#c79aa8" stop-opacity=".2"/></linearGradient>
        </defs>
        ${both(`
          <path d="M58 117 Q74 97 96 115 Q76 108 58 117 Z" fill="url(#${p}g)" filter="url(#${p}b)" opacity=".9"/>
          <path d="M92 118 Q76 105 60 117 L53 111" fill="none" stroke="#1b1411" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <g stroke="#1b1411" stroke-width="1.1" stroke-linecap="round">
            <path d="M64 114 L61 109"/><path d="M68 112 L66 106.5"/><path d="M73 110.5 L72 105"/><path d="M78 110.5 L78.5 105"/><path d="M83 111.5 L85 106.5"/>
          </g>
          <path d="M59 105 Q73 94 92 99 L92 103 Q75 99 59 106 Z" fill="#4a3326"/>
        `)}
        <path d="${LIPS}" fill="#b3263e" opacity=".92"/>
        <path d="${LIPS}" fill="none" stroke="#8a1a2e" stroke-width="1"/>
        <path d="${MOUTH}" fill="none" stroke="#6e1424" stroke-width="1.2"/>
        <ellipse cx="96" cy="187" rx="5" ry="1.6" fill="#fff" opacity=".45"/>`,
    },
    {
      name: 'FINISH_SET',
      note: 'Setting powder, setting spray. Locks everything in place and cuts shine.',
      draw: (p) => `
        <defs>${skinMask(p + 'm')}</defs>
        <path d="${FACE}" fill="#fff" opacity=".08" mask="url(#${p}m)"/>
        <g class="ml-mist" fill="#d6e4f2" stroke="#7f97b0" stroke-width=".4" mask="url(#${p}m)">${MIST}</g>`,
    },
  ];

  // Dashed outline of the face, shown behind each product on its own pane so you can see where it lands.
  const GHOST = `<g class="ml-ghost" fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="3 3">
    <path d="${FACE}"/>${both(`<path d="${EYE}"/><path d="${BROW}"/>`)}<path d="${NOSE}"/><path d="${LIPS}"/></g>`;

  return { FACE, HAIR, NECK, EYE, BROW, NOSE, LIPS, MOUTH, both, LAYERS, GHOST };
})();
