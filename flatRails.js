// @ts-check

import { ny3, nz3, x3, y2, y3, zero2 } from "./cade/lib/defaults.js";
import { metalMaterial } from "./cade/lib/materials.js";
import { cut, extrusion, fuse } from "./cade/lib/operations.js";
import { Part } from "./cade/lib/part.js";
import { plus3 } from "./cade/tools/3d.js";
import { Path } from "./cade/tools/path.js";
import { debugGeometry } from "./cade/tools/svg.js";
import { a2m } from "./cade/tools/transform.js";

const railWidth = 12;
export const flatRailTotalHeight = 13;
const railHeight = 8;
const railSlotSize = 1.5;
const smallDiameter = 3.5;
const bigDiameter = 6;
const holeDepth = railHeight - 4.5;
const chariotToBottom = 3;

const railProfile = new Path();
railProfile.moveTo([railWidth / 2, 0]);
railProfile.lineTo([railWidth / 2, railHeight / 2]);
railProfile.lineTo([
  railWidth / 2 - railSlotSize,
  railHeight / 2 + railSlotSize,
]);
railProfile.lineTo([railWidth / 2, railHeight / 2 + 2 * railSlotSize]);
railProfile.lineTo([railWidth / 2, railHeight]);
railProfile.mirror(zero2, y2);
railProfile.close();

const railHole = Path.makeCircle(smallDiameter / 2);
const hole = fuse(
  extrusion(a2m([0, 0, -holeDepth], nz3), 10, Path.makeCircle(bigDiameter / 2)),
  extrusion(a2m([0, 0, -holeDepth]), 10, railHole),
);

function makeFlatRail(length) {
  const holes = [];
  for (let x = 10; x < length; x += 25) {
    holes.push({ placement: a2m([0, 0, x], ny3), shape: hole });
  }

  const flatRail = new Part(
    `${length}mm flat rail`,
    cut(extrusion(a2m([0, 0, 0]), length, railProfile), ...holes),
  );
  flatRail.material = metalMaterial;
  return flatRail;
}

/**
 * @param {number} length
 */
export function flatRailHolesIterator(length) {
  return function*() {
    const extrusionLocation = a2m([0, 0, 0 ]);
    for (let x = 10; x < length; x += 25) {
      yield {
        hole: railHole,
        depth: holeDepth,
        transform: extrusionLocation.multiply(a2m([0, 0, x], y3)),
      };
    }
  }
}

export const flatRail = makeFlatRail(1000);
export const shortFlatRail = makeFlatRail(350);

const thickenedRailProfile = railProfile.offset(-1);
export const flatChariotWidth = 27;

const flatChariotProfile = Path.makeRect(
  flatChariotWidth,
  flatRailTotalHeight - chariotToBottom,
)
  .recenter({ onlyX: true })
  .translate([0, chariotToBottom])
  .booleanDifference(thickenedRailProfile);

export const flatChariotLength = 45.4;
const drillDepth = 8;
const drill = extrusion(
  a2m([0, -drillDepth, 0]),
  2 * drillDepth,
  Path.makeCircle(3 / 2),
);
const chariotHoles = [];
const center = [0, flatRailTotalHeight, flatChariotLength / 2];
for (const x of [-10, 10]) {
  for (const y of [-10, 10]) {
    chariotHoles.push({
      placement: a2m(plus3(center, [x, 0, y]), y3),
      shape: drill,
    });
  }
}

export function* flatChariotHolesIterator() {
  for (const op of chariotHoles) {
    yield {
      hole: drill.retreive().outsides[0],
      // TODO check bolt length
      depth: drillDepth,
      transform: op.placement,
    };
  }
}

export const flatChariot = new Part(
  "flat chariot",
  cut(extrusion(a2m(), flatChariotLength, flatChariotProfile), ...chariotHoles),
);
flatChariot.material = metalMaterial;
