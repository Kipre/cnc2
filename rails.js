// @ts-check

import { y3, z3, zero2 } from "./cade/lib/defaults.js";
import { metalMaterial } from "./cade/lib/materials.js";
import {
  cut,
  extrusion,
  multiExtrusion,
  retrieveOperations,
} from "./cade/lib/operations.js";
import { Part } from "./cade/lib/part.js";
import { makeFourDrills } from "./cade/lib/utils.js";
import { rotatePoint } from "./cade/tools/2d.js";
import { intersectLineAndArc } from "./cade/tools/circle.js";
import { Path } from "./cade/tools/path.js";
import { a2m } from "./cade/tools/transform.js";
import { chariotSide, defaultSpindleSize, yRailLength } from "./dimensions.js";

const yRailWidth = 30;
const yRailHeight = 29;
const yRailDiameter = 12;

const p = intersectLineAndArc(
  [3, 0],
  [3, yRailHeight - yRailDiameter / 2],
  [0, yRailHeight],
  [0, yRailHeight - yRailDiameter],
  yRailDiameter / 2,
  0,
);
const yRailProfile = new Path();
yRailProfile.moveTo([0, 0]);
yRailProfile.lineTo([yRailWidth / 2, 0]);
yRailProfile.lineTo([yRailWidth / 2, 4]);
yRailProfile.lineTo([yRailWidth / 2 - 9, 4]);
yRailProfile.lineTo([yRailWidth / 2 - 9, 10]);
yRailProfile.lineTo(p);
yRailProfile.arc([0, yRailHeight], yRailDiameter / 2, 1);
yRailProfile.mirror();

const body = extrusion(a2m(), yRailLength, yRailProfile);

const holeDiameter = 5.2;
const holePaths = [];
for (let x = 50; x < yRailLength; x += 100) {
  const circle = Path.makeCircle(holeDiameter / 2);
  holePaths.push(circle.translate([x, yRailWidth / 2 - 4]));
  holePaths.push(circle.translate([x, -yRailWidth / 2 + 4]));
}

const holesTransform = a2m([0, -5, 0], y3, z3);
const holes = multiExtrusion(holesTransform, 20, ...holePaths);

export function* yRailHoleFinder() {
  const length = holePaths.length;
  for (let i = 0; i < length; i += 3 * 2) {
    yield { hole: holePaths[i], depth: 4, transform: holesTransform };
    yield { hole: holePaths[i + 1], depth: 4, transform: holesTransform };
  }
}


export const yRail = new Part("y rail", cut(body, holes));
yRail.material = metalMaterial;
yRail.symmetries = [0, NaN, NaN];

export const railCenter = yRailHeight - yRailDiameter / 2;
const chariotDiameter = 20;
const chariotHeight = 27.6;
export const chariotTop = 17;
const chariotBottom = chariotHeight - chariotTop;
export const chariotLength = 39;
export const railTopToBottom = yRailHeight - yRailDiameter / 2 + chariotTop;

const chariotProfile = new Path();
chariotProfile.moveTo([0, chariotDiameter / 2]);
chariotProfile.arc([0, -chariotDiameter / 2], chariotDiameter / 2, 0);
chariotProfile.intersectLineTo(
  zero2,
  rotatePoint(zero2, [0, -chariotDiameter], (40 * Math.PI) / 180),
);
chariotProfile.intersectLineTo(
  [0, -chariotBottom],
  [chariotSide, -chariotBottom],
);
chariotProfile.lineTo([chariotSide, chariotTop]);
chariotProfile.lineTo([0, chariotTop]);
chariotProfile.mirror();

const holeSize = 5;
const chariotHoleDepth = 10;
const drillsTransform = a2m([0, railTopToBottom, chariotLength / 2], y3);
const drills = makeFourDrills(
  drillsTransform,
  holeSize,
  chariotHoleDepth,
  // TODO: check this
  [28 / 2, 26 / 2],
);

export function* chariotHoleFinder() {
  const transform = drillsTransform;
  for (const op of retrieveOperations(drills).slice(0, -1)) {
    yield { hole: op.outsides[0], depth: chariotHoleDepth, transform };
  }
}

export const chariotBoltClearingRect = Path.makeRoundedRect(
  chariotLength * 2.2,
  20,
  defaultSpindleSize,
).recenter();

export const chariot = new Part(
  "y chariot",
  cut(
    extrusion(a2m([0, railCenter, 0]), chariotLength, chariotProfile),
    drills,
  ),
);
chariot.material = metalMaterial;
chariot.symmetries = [0, NaN, NaN];

export const chariotContactSurface = a2m([0, chariotTop + railCenter, 0], y3);
