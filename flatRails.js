// @ts-check

import { ny3, nz3, y2, zero2 } from "./cade/lib/defaults.js";
import { metalMaterial } from "./cade/lib/materials.js";
import {
  cut,
  extrusion,
  fuse,
} from "./cade/lib/operations.js";
import { Part } from "./cade/lib/part.js";
import { Path } from "./cade/tools/path.js";
import { debugGeometry } from "./cade/tools/svg.js";
import { a2m } from "./cade/tools/transform.js";

const railWidth = 12;
const totalHeight = 13;
const railHeight = 8;
const railSlotSize = 1.5;
const smallDiameter = 3.5;
const bigDiameter = 6;
const holeDepth = railHeight - 4.5;

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

const hole = fuse(
  extrusion(a2m([0, 0, -holeDepth], nz3), 10, Path.makeCircle(bigDiameter / 2)),
  extrusion(a2m([0, 0, -holeDepth]), 10, Path.makeCircle(smallDiameter / 2)),
);

const holes = [];
for (let x = 10; x < 1000; x += 25) {
  holes.push({ placement: a2m([0, 0, x], ny3), shape: hole });
}

export const flatRail = new Part(
  "1000mm flat rail",
  cut(extrusion(a2m([0, 0, 0]), 1000, railProfile), ...holes),
);
flatRail.material = metalMaterial;
