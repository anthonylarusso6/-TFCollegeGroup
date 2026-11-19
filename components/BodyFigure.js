// Body check-in figure: one smooth silhouette, split into tappable regions.
// Regions are simple shapes clipped to the silhouette and separated by thin
// gaps, so edges always follow the body outline. Shapes are drawn for the
// screen-right side and mirrored (x → 200 − x) for the screen-left side.
//
// Front view: the athlete faces you, so their RIGHT side is on screen-left.
// Back view: their right side is on screen-right.

const W = 200;
const mir = (d) => d.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (_, x, y) => `${+(W - parseFloat(x)).toFixed(1)},${y}`);
const both = (d) => [d, mir(d)];

// ── Silhouette (screen-right halves + head) ───────────────────────────
const TORSO = "M100,56 L109,56 C109,63 110,68 113,72 C121,78 132,80 142,84 C147,88 149,94 147,102 L139,118 C137,140 132,160 128,180 C127,194 130,206 135,216 C138,224 137,232 130,238 C122,242 110,244 100,244 Z";
const ARM = "M139,86 C150,83 160,90 162,104 C164,120 165,138 165,152 C165,162 166,170 167,176 C170,196 172,220 170,244 L157,246 C155,226 151,204 149,184 C147,176 146,170 146,164 C145,148 144,132 140,118 C138,108 136,94 139,86 Z";
const HAND = "M157,244 L170,243 C174,254 175,268 171,278 C168,285 161,287 157,282 C153,276 152,260 157,244 Z";
const LEG = "M100,226 L135,214 C141,232 143,254 141,276 C139,298 135,316 133,330 C135,344 137,358 135,372 C133,386 129,396 127,406 C128,412 131,417 134,422 C136,428 131,431 125,431 L111,431 C106,431 104,427 105,421 C106,415 106,409 106,403 C104,389 104,374 104,360 C104,350 106,342 107,334 C105,316 104,292 103,270 C102,258 101,248 100,242 Z";
const SILHOUETTE = [...both(TORSO), ...both(ARM), ...both(HAND), ...both(LEG)];
const HEAD = { cx: 100, cy: 34, rx: 19, ry: 24 };

// ── Regions ───────────────────────────────────────────────────────────
const ell = (cx, cy, rx, ry) => `M${cx - rx},${cy} A${rx},${ry} 0 1,0 ${cx + rx},${cy} A${rx},${ry} 0 1,0 ${cx - rx},${cy} Z`;
const R = {
  head: ell(100, 34, 21, 26),
  neckFront: "M84,54 L116,54 L117,70 C127,76 137,80 146,84 L138,92 C126,89 112,87 100,87 C88,87 74,89 62,92 L54,84 C63,80 73,76 83,70 Z",
  neckBack: "M84,54 L116,54 L116,72 L84,72 Z",
  delt: "M136,86 C147,80 161,88 163,104 C164,114 161,122 155,127 C148,121 142,111 136,100 Z",
  chest: "M101,89 L137,91 C143,101 143,117 135,127 C124,135 110,135 101,131 Z",
  upperArm: "M139,117 L155,128 C161,131 166,142 166,154 L167,172 L146,172 C145,152 144,134 139,117 Z",
  forearm: "M145,173 L168,175 L174,246 L154,246 Z",
  hand: "M150,244 L178,242 L178,292 L150,292 Z",
  abs: "M89,134 L111,134 L115,240 C109,247 91,247 85,240 Z",
  oblique: "M113,134 L136,128 C133,150 130,168 129,182 C129,196 132,206 137,215 L116,236 Z",
  adductor: "M101,247 L119,241 C117,260 113,282 109,302 L104,302 C103,282 102,262 101,247 Z",
  quad: "M120,240 L138,216 C142,238 144,262 141,286 C139,304 136,316 134,322 L109,322 C110,312 111,306 110,302 C114,282 118,260 120,240 Z",
  shin: "M104,346 L138,346 C138,366 134,384 129,398 L127,405 L104,405 Z",
  foot: "M103,406 L130,406 C134,414 138,424 135,432 L103,432 Z",
  trap: "M100,62 L114,69 C125,77 137,81 146,85 L131,95 C119,105 109,130 100,152 C91,130 81,105 69,95 L54,85 C63,81 75,77 86,69 Z",
  upperBack: "M100,153 C109,131 119,106 131,96 L146,94 C148,102 145,111 140,119 C137,137 133,157 129,177 L100,181 Z",
  lowerBack: "M100,182 L130,178 C129,193 131,205 136,215 L100,222 Z",
  glute: "M100,223 L136,213 C142,227 143,242 140,256 C131,264 112,266 100,259 Z",
  hamstring: "M100,261 C113,268 131,266 140,258 C141,276 140,294 137,310 L134,324 L107,324 C106,306 104,284 101,266 Z",
  abductor: "M140,234 C144,250 145,266 142,288 L134,292 C136,276 138,258 139,246 Z",
  calf: "M104,326 L136,326 C139,344 139,364 135,380 C133,390 130,398 127,405 L104,405 Z",
};

// id → list of path strings, per view
export const FRONT_ZONES = [
  ["head", [R.head]],
  ["neck", [R.neckFront]],
  ["chest", both(R.chest)],
  ["front-deltoids", both(R.delt)],
  ["biceps", both(R.upperArm)],
  ["forearm", both(R.forearm)],
  ["right-hand", [mir(R.hand)]], ["left-hand", [R.hand]],
  ["abs", [R.abs]],
  ["obliques", both(R.oblique)],
  ["adductor", both(R.adductor)],
  ["quadriceps", both(R.quad)],
  ["knees", [ell(120, 335, 15, 12), ell(80, 335, 15, 12)]], // arcs can't go through mir()
  ["right-soleus", [mir(R.shin)]], ["left-soleus", [R.shin]],
  ["right-ankle", [mir(R.foot)]], ["left-ankle", [R.foot]],
];
export const BACK_ZONES = [
  ["head", [R.head]],
  ["neck", [R.neckBack]],
  ["trapezius", [R.trap]],
  ["back-deltoids", both(R.delt)],
  ["upper-back", both(R.upperBack)],
  ["lower-back", both(R.lowerBack)],
  ["triceps", both(R.upperArm)],
  ["forearm", both(R.forearm)],
  ["left-hand", [mir(R.hand)]], ["right-hand", [R.hand]],
  ["gluteal", both(R.glute)],
  ["hamstring", both(R.hamstring)],
  ["abductors", both(R.abductor)],
  ["calves", both(R.calf)],
  ["left-ankle", [mir(R.foot)]], ["right-ankle", [R.foot]],
];

export default function BodyFigure({ view, partData, selected, onSelect, names }) {
  const zones = view === "back" ? BACK_ZONES : FRONT_ZONES;
  const clipId = "bmClip-" + view;
  return (
    <svg viewBox="0 0 200 440" className="bm-svg" role="group" aria-label={(view === "back" ? "Back" : "Front") + " of body"}>
      <defs>
        <clipPath id={clipId}>
          <ellipse {...HEAD} />
          {SILHOUETTE.map((d, i) => <path key={i} d={d} />)}
        </clipPath>
      </defs>
      {/* base silhouette — the gaps between regions show this */}
      <g className="bm-sil">
        <ellipse {...HEAD} />
        {SILHOUETTE.map((d, i) => <path key={i} d={d} />)}
      </g>
      <g clipPath={`url(#${clipId})`}>
        {zones.map(([id, paths]) => {
          const st = partData[id]?.status;
          const flag = st === "sore" || st === "pain";
          const cls = "bm-m" + (flag ? " is-" + st : "") + (selected === id ? " is-sel" : "");
          return (
            <g key={id} className={cls} role="button" tabIndex={0} aria-label={(names[id] || id) + (flag ? ", " + st : "")}
              onClick={(e) => { e.stopPropagation(); onSelect(id); }}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(id); } }}>
              {paths.map((d, i) => <path key={i} d={d} />)}
            </g>
          );
        })}
      </g>
    </svg>
  );
}
