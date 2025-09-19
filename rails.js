// @ts-check

import { cut, extrusion, fuse } from "./cade/lib/operations.js";
import { intersectLineAndArc } from "./cade/tools/circle.js";
import { Path } from "./cade/tools/path.js";
import { debugGeometry } from "./cade/tools/svg.js";
import { a2m } from "./cade/tools/transform.js";
import { nz3, x3, y3, zero2, zero3 } from "./cade/lib/defaults.js";
import { Part } from "./cade/lib/part.js";
import { metalMaterial } from "./cade/lib/materials.js";
import { yRailLength } from "./dimensions.js";

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
yRailProfile.arc([0, yRailHeight], yRailDiameter/ 2, 1);
yRailProfile.mirror();

const body = extrusion(a2m(), yRailLength, yRailProfile);

export const yRail = new Part("m6 bolt", body);
yRail.material = metalMaterial;
