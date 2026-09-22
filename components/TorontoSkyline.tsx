/**
 * Line-drawn Toronto skyline for the home hero: dark silhouettes with gold
 * hairline edges, CN Tower and Rogers Centre as the landmarks. Heights follow
 * the real towers at one scale (CN Tower 553 m = 360 units), so the tower
 * dominates the way it does from the lake. Decorative only.
 */

type Roof = "flat" | "step" | "cap" | "slant";
type Building = [x: number, width: number, height: number, roof?: Roof];

const BASE = 400;

function outline([x, w, h, roof = "flat"]: Building): string {
  const top = BASE - h;
  switch (roof) {
    case "step": {
      // Setback crown: the top floors are narrower than the podium.
      const shoulder = top + Math.round(h * 0.14);
      return `M${x} ${BASE}V${shoulder}H${x + w * 0.2}V${top}H${x + w * 0.8}V${shoulder}H${x + w}V${BASE}`;
    }
    case "cap":
      // Rooftop mechanical box.
      return `M${x} ${BASE}V${top}H${x + w * 0.35}V${top - 6}H${x + w * 0.65}V${top}H${x + w}V${BASE}`;
    case "slant":
      return `M${x} ${BASE}V${top + 8}L${x + w} ${top}V${BASE}`;
    default:
      return `M${x} ${BASE}V${top}H${x + w}V${BASE}`;
  }
}

// Far row, drawn first and dimmer, so the front row overlaps it.
const BACK: Building[] = [
  [20, 30, 96], [90, 28, 130, "cap"], [150, 34, 112], [214, 26, 150, "step"],
  [282, 30, 128], [340, 24, 168, "cap"], [412, 36, 140], [476, 28, 186, "step"],
  [544, 30, 160], [606, 26, 196, "cap"], [642, 34, 150], [706, 30, 204, "step"],
  [770, 28, 170], [836, 32, 128],
  [1088, 30, 170, "cap"], [1150, 28, 212, "step"], [1222, 32, 200],
  [1256, 26, 230, "step"], [1290, 30, 190, "cap"], [1320, 34, 172],
  [1356, 30, 206, "slant"], [1392, 28, 150], [1420, 34, 128, "cap"],
  [1460, 30, 146], [1500, 36, 112, "step"], [1540, 30, 138], [1580, 20, 90],
];

// Near row: CityPlace and Liberty Village condos to the west, the financial
// district to the east.
const FRONT: Building[] = [
  [0, 38, 60], [42, 26, 92, "cap"], [72, 32, 78], [108, 22, 118, "step"],
  [134, 30, 100], [168, 26, 132, "cap"], [198, 34, 86], [236, 24, 124, "slant"],
  [264, 30, 108], [298, 22, 146, "step"], [324, 38, 80], [366, 26, 118, "cap"],
  [396, 30, 152, "step"], [430, 24, 102], [458, 34, 134, "cap"],
  [496, 26, 168, "step"], [526, 30, 120], [560, 22, 150, "slant"], [586, 38, 92],
  [628, 28, 160, "step"], [660, 24, 126, "cap"], [688, 34, 142],
  [726, 26, 176, "step"], [756, 30, 132, "cap"], [790, 24, 156, "slant"],
  [818, 38, 100], [860, 20, 74], [884, 14, 58],
  [1100, 26, 118, "cap"], [1130, 32, 145], [1238, 28, 155, "cap"],
  [1304, 26, 142, "step"], [1374, 28, 160, "slant"], [1406, 24, 110],
  [1434, 40, 82, "cap"], [1478, 28, 124, "step"], [1510, 44, 70],
  [1558, 42, 96, "cap"],
];

// Towers with a recognisable top: First Canadian Place (mast), Scotia Plaza
// (notched crown), Bay Wellington (stepped) and Royal Bank Plaza (sawtooth).
const LANDMARK_TOWERS = [
  "M1166 400V206H1178V194H1184V206H1196V400",
  "M1200 400V221L1208 229L1217 221L1226 229L1234 221V400",
  "M1270 400V265H1276V256H1294V265H1300V400",
  "M1334 400V283L1340 289L1346 283L1352 289L1358 283L1364 289L1370 283V400",
];

const ROGERS_CENTRE = "M900 400V384H905Q960 336 1015 384H1020V400";
const ROGERS_RIB = "M926 372Q960 346 994 372";

const CN_TOWER =
  "M1044 400L1052 360L1055 198L1039 188V176L1045 170L1056 166L1057 108H1053V98H1057.5L1059.2 40H1060.8L1062.5 98H1067V108H1063L1064 166L1075 170L1081 176V188L1065 198L1068 360L1076 400Z";
const CN_POD_BAND = "M1039 182H1081";

export default function TorontoSkyline({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 1600 400"
      preserveAspectRatio="xMaxYMax slice"
      aria-hidden="true"
      focusable="false"
    >
      <g fill="#07080c" stroke="var(--gold)" strokeWidth="1" strokeLinejoin="round">
        <g strokeOpacity="0.2">
          {BACK.map((b) => (
            <path key={`b${b[0]}`} d={outline(b)} vectorEffect="non-scaling-stroke" />
          ))}
        </g>
        <g strokeOpacity="0.55">
          {FRONT.map((b) => (
            <path key={`f${b[0]}`} d={outline(b)} vectorEffect="non-scaling-stroke" />
          ))}
          {LANDMARK_TOWERS.map((d) => (
            <path key={d} d={d} vectorEffect="non-scaling-stroke" />
          ))}
          <path d={ROGERS_CENTRE} vectorEffect="non-scaling-stroke" />
          <path d={CN_TOWER} vectorEffect="non-scaling-stroke" />
        </g>
      </g>
      <g fill="none" stroke="var(--gold)" strokeOpacity="0.35" strokeWidth="1">
        <path d={ROGERS_RIB} vectorEffect="non-scaling-stroke" />
        <path d={CN_POD_BAND} vectorEffect="non-scaling-stroke" />
      </g>
    </svg>
  );
}
