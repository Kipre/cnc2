// @ts-check

import { Assembly } from "./cade/lib/lib.js";
import { blackMetalMaterial } from "./cade/lib/materials.js";
import { extrusion, fuse } from "./cade/lib/operations.js";
import { Part } from "./cade/lib/part.js";
import { minus } from "./cade/tools/2d.js";
import { ny3, x3, y3, z3, zero3 } from "./cade/tools/defaults.js";
import { Path } from "./cade/tools/path.js";
import { debugGeometry } from "./cade/tools/svg.js";
import { a2m } from "./cade/tools/transform.js";
import {
  cableChainWidth,
  motorCenteringCylinderDiameter,
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

export function makeChain(deltaX, deltaZ, overallLength = 700) {
  const turnDiameter = deltaZ;
  const turnLength = (deltaZ * Math.PI) / 2;
  const middle = overallLength - turnLength + deltaX / 2;

  const directrix = new Path();
  directrix.moveTo([0, 0]);
  directrix.lineTo([middle, 0]);
  directrix.arc([middle, turnDiameter], turnDiameter / 2, 1);
  directrix.lineTo([deltaX, turnDiameter]);
  const points = directrix.getEquidistantPoints(pitch);
  const chain = new Assembly(`cable chain ${deltaZ}`);
  const rotateVertically = a2m([0, 0, height / 2], ny3);

  for (let i = 0; i < points.length - 1; i++) {
    const point = points[i];
    const dir = minus(points[i + 1], point);
    chain.addChild(
      chainElement,
      rotateVertically.multiply(a2m([...point, 0], null, [...dir, 0])),
    );
  }
  return chain;
}
