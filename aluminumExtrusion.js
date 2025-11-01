// @ts-check

import { metalMaterial } from "./cade/lib/materials.js";
import { cut, extrusion, fuse } from "./cade/lib/operations.js";
import { Part } from "./cade/lib/part.js";
import { Path } from "./cade/tools/path.js";
import { a2m } from "./cade/tools/transform.js";
import {
  aluExtrusionHeight,
  aluExtrusionLength,
  aluExtrusionThickness,
} from "./dimensions.js";

const sideHoleDepth = 20;
const holeDiameter = 8.1;
const drill = extrusion(
  a2m([0, 0, -sideHoleDepth]),
  2 * sideHoleDepth,
  Path.makeCircle(holeDiameter / 2),
);
const holes = [];
for (const end of [0, aluExtrusionLength]) {
  for (const z of [
    aluExtrusionThickness / 2,
    aluExtrusionHeight - aluExtrusionThickness / 2,
  ]) {
    holes.push({
      placement: a2m([aluExtrusionThickness / 2, z, end]),
      shape: drill,
    });
  }
}

export function* aluStartHolesIterator() {
  for (const op of holes.slice(0, 2)) {
    yield {
      hole: drill.retreive().outsides[0],
      depth: sideHoleDepth,
      transform: op.placement,
    };
  }
}

export function* aluEndHolesIterator() {
  for (const op of holes.slice(2)) {
    yield {
      hole: drill.retreive().outsides[0],
      depth: sideHoleDepth,
      transform: op.placement,
    };
  }
}

export const aluExtrusion = new Part(
  "alu extrusion",
  cut(
    extrusion(
      a2m(),
      aluExtrusionLength,
      Path.makeRoundedRect(aluExtrusionThickness, aluExtrusionHeight, 3),
    ),
    ...holes,
  ),
);
aluExtrusion.material = metalMaterial;
