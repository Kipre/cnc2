// @ts-check

import { nz3, x2, x3, y2, y3, z3, zero2, zero3 } from "./cade/lib/defaults.js";
import { Assembly } from "./cade/lib/lib.js";
import { blackMetalMaterial, metalMaterial } from "./cade/lib/materials.js";
import { cut, extrusion, fuse, multiExtrusion } from "./cade/lib/operations.js";
import { Part } from "./cade/lib/part.js";
import { Path } from "./cade/tools/path.js";
import { debugGeometry } from "./cade/tools/svg.js";
import { a2m, transformPoint3 } from "./cade/tools/transform.js";
import {
  cableChainWidth,
  motorBodyLength,
  motorCenteringCylinderDiameter,
  motorCouplerDiameter,
  motorSide,
  motorSupportWidth,
  roundingRadius,
  woodThickness,
} from "./dimensions.js";

const thickness1 = 1.5;
const thickness2 = 1.2;

const height = 9 + 2 * thickness2;
const holeRadius = 2;
const pitch = 13;
const clearance = 0.1;

let layer1 = new Path();
layer1.moveTo([0, -height / 2]);
layer1.arc([0, height / 2], height / 2, 0);
layer1.lineTo([pitch, height / 2]);
layer1.arc([pitch, -height / 2], height / 2, 1);
layer1.close();
layer1 = layer1.offset([0, 0, -0.3]);

let layer2 = new Path();
layer2.moveTo([0, -height / 2]);
layer2.arc([0, height / 2], height / 2, 1);
layer2.lineTo([pitch, height / 2]);
layer2.arc([pitch, -height / 2], height / 2, 0);
layer2.close();
layer2 = layer2.offset([-0.3]);

debugGeometry(layer1, layer2);

export const motorCenteringHole = Path.makeCircle(
  motorCenteringCylinderDiameter / 2,
);

const exterior = extrusion(
  a2m(),
  thickness1,
  layer1,
  Path.makeCircle(holeRadius + clearance),
);
const dimple = extrusion(
  a2m([pitch, 0, 0]),
  thickness1,
  Path.makeCircle(holeRadius - clearance),
);
const interior = extrusion(a2m([0, 0, thickness1]), thickness1, layer2);

const gap1 = extrusion(
  a2m([4.5, height / 2 - thickness2, 2 * thickness1]),
  cableChainWidth,
  Path.makeRect(7, thickness2),
);
const gap2 = extrusion(
  a2m([4.5, -height / 2, 2 * thickness1]),
  cableChainWidth,
  Path.makeRect(7, thickness2),
);

const exterior2 = extrusion(
  a2m([0, 0, cableChainWidth + 3 * thickness1]),
  thickness1,
  layer1,
  Path.makeCircle(holeRadius + clearance),
);
const dimple2 = extrusion(
  a2m([pitch, 0, cableChainWidth + 3 * thickness1]),
  thickness1,
  Path.makeCircle(holeRadius - clearance),
);
const interior2 = extrusion(
  a2m([0, 0, cableChainWidth + 2 * thickness1]),
  thickness1,
  layer2,
);

export const chainElement = new Part(
  "chain element",
  fuse(exterior, interior, dimple, gap1, gap2, exterior2, dimple2, interior2),
);
chainElement.material = blackMetalMaterial;
