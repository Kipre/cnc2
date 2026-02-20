// @ts-check

import { Assembly } from "./cade/lib/lib.js";
import { blackMetalMaterial } from "./cade/lib/materials.js";
import { cut, extrusion, fuse, intersect } from "./cade/lib/operations.js";
import { Part } from "./cade/lib/part.js";
import { minus } from "./cade/tools/2d.js";
import { nx3, ny3, nz3, x3, y3, z3, zero3 } from "./cade/tools/defaults.js";
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
const interior2 = extrusion(
  a2m([0, 0, cableChainWidth + 2 * thickness1]),
  thickness1,
  layer2,
);

const dimple = extrusion(
  a2m([pitch, 0, 0]),
  thickness1,
  Path.makeCircle(holeRadius - clearance),
);
const dimple2 = extrusion(
  a2m([pitch, 0, cableChainWidth + 3 * thickness1]),
  thickness1,
  Path.makeCircle(holeRadius - clearance),
);

export const chainElement = new Part(
  "chain element",
  fuse(exterior, interior, dimple, gap1, gap2, exterior2, dimple2, interior2),
);
chainElement.material = blackMetalMaterial;

function makeStartChainElement() {
  let startPath = new Path();
  startPath.moveTo([0, height - 1.5]);
  startPath.lineTo([0, 0]);
  startPath.arcTo([cableChainWidth, 0], 0.5);
  startPath.arcTo([cableChainWidth, height - 1.5], 0.5);
  startPath = startPath.thickenAndClose(1.5);

  const startUShape = extrusion(
    a2m([21, -height / 2 + 1.5, 2 * 1.5], nx3, z3),
    30,
    startPath,
  );

  const outlinePath = new Path();
  outlinePath.moveTo([5, height / 2]);
  outlinePath.lineTo([5, height / 2 + 3]);
  outlinePath.lineTo([0, height / 2 + 3]);
  outlinePath.lineTo([0, height]);
  outlinePath.lineTo([-9, height]);
  outlinePath.lineTo([-28, 0]);
  outlinePath.lineTo([0, 0]);
  outlinePath.lineTo([0, height / 2 - 3]);
  outlinePath.lineTo([5, height / 2 - 3]);
  outlinePath.close();
  const outline = extrusion(
    a2m([13, -height / 2, -2]),
    cableChainWidth + 10,
    outlinePath,
  );

  const cutout = extrusion(
    a2m([13, -5, 2 * 1.5]),
    cableChainWidth,
    Path.makeRect(10, 10).recenter(),
  );

  const smallHoleOffset = 32 / 2;
  const bigHoleOffset = 22 / 2;
  const makeHole = (diameter, offset) =>
    extrusion(
      a2m([0, -height, 2 * 1.5 + cableChainWidth / 2 + offset], y3),
      10,
      Path.makeCircle(diameter / 2),
    );

  const result = new Part(
    "start chain element",
    fuse(
      cut(
        intersect(startUShape, outline),
        cutout,
        makeHole(3, smallHoleOffset),
        makeHole(3, -smallHoleOffset),
        makeHole(4, bigHoleOffset),
        makeHole(4, -bigHoleOffset),
      ),
      dimple,
      dimple2,
    ),
  );
  result.material = blackMetalMaterial;
  return result;
}

function makeEndChainElement() {
  let startPath = new Path();
  startPath.moveTo([-1.5, height / 2]);
  startPath.lineTo([-1.5, -height / 2 + 1.5]);
  startPath.arcTo([cableChainWidth + 1.5, -height / 2 + 1.5], 0.5);
  startPath.arcTo([cableChainWidth + 1.5, height / 2], 0.5);
  startPath = startPath.thickenAndClose(1.5);

  const startUShape = extrusion(
    a2m([-6, 0, 2 * 1.5], x3, z3),
    27 + 1,
    startPath,
  );

  const outlinePath = new Path();
  outlinePath.moveTo([0, -height / 2]);
  outlinePath.arc([0, height / 2], height / 2, 1);
  outlinePath.lineTo([-8, height / 2]);
  outlinePath.lineTo([-27, -height / 2]);
  outlinePath.close();
  const outline = extrusion(
    a2m(zero3, z3, nx3),
    cableChainWidth + 10,
    outlinePath,
    Path.makeCircle(holeRadius + clearance),
  );

  const cutout = extrusion(
    a2m([0, 0, 1.5]),
    cableChainWidth + 2 * 1.5,
    Path.makeRect(10, 20).recenter(),
  );

  const smallHoleOffset = 32 / 2;
  const oblongHoleOffset = 23 / 2;
  const makeHole = (offset) =>
    extrusion(
      a2m([17, 0, 2 * 1.5 + cableChainWidth / 2 + offset], y3),
      10,
      Path.makeCircle(3 / 2),
    );

  const oblongHole = new Path();
  oblongHole.moveTo([0, -1.5]);
  oblongHole.lineTo([1.5, -1.5]);
  oblongHole.arc([1.5, 1.5], 1.5, 1);
  oblongHole.lineTo([0, 1.5]);
  oblongHole.mirror();

  const makeOblongHole = (offset) =>
    extrusion(
      a2m([13, 0, 2 * 1.5 + cableChainWidth / 2 + offset], y3),
      10,
      oblongHole,
    );

  const result = new Part(
    "end chain element",
    cut(
      intersect(startUShape, outline),
      cutout,
      makeHole(smallHoleOffset),
      makeHole(-smallHoleOffset),
      makeOblongHole(oblongHoleOffset),
      makeOblongHole(-oblongHoleOffset),
    ),
  );
  result.material = blackMetalMaterial;
  return result;
}

const startChainElement = makeStartChainElement();
const endChainElement = makeEndChainElement();

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
      i === 0
        ? startChainElement
        : i === points.length - 2
          ? endChainElement
          : chainElement,
      rotateVertically.multiply(a2m([...point, 0], null, [...dir, 0])),
    );
  }

  return chain;
}
