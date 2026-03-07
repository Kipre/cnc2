// @ts-check

import { metalMaterial } from "../cade/lib/materials.js";
import {
  cut,
  extrusion,
  fuse,
  multiExtrusion,
  retrieveOperations,
} from "../cade/lib/operations.js";
import { Part } from "../cade/lib/part.js";
import { ny3, nz3, x3, y3, z3 } from "../cade/tools/defaults.js";
import { Path } from "../cade/tools/path.js";
import { a2m } from "../cade/tools/transform.js";
import { joinOffset, roundingRadius } from "../dimensions.js";

const transformerWidth = 113;
const transformerThickness = 50;
const transformerHeight = 214;
// TODO: confirm
const threadSize = 4;
const threadDepth = 5;

const body = extrusion(
  a2m(),
  transformerWidth,
  Path.makeRect(transformerHeight, transformerThickness),
);

const hole = Path.makeCircle(threadSize / 2);

const holes = multiExtrusion(
  a2m([0, 0, 0], nz3).translate(0, 0, 5),
  -threadDepth * 2,
  // TODO: check on real part
  hole.translate([32, -11]),
  hole.translate([transformerHeight - 32, -11]),
);

export function* transformerHoleFinder(part) {
  for (const holeInfo of retrieveOperations(holes).slice(0, -1)) {
    yield {
      // hole: holeInfo.shapes[0].outsides[0],
      hole: holeInfo.outsides[0],
      depth: threadDepth,
      transform: holeInfo.placement.translate(0, 0, -5),
    };
  }
}

export const transformer = new Part("transformer", cut(body, holes));
transformer.material = metalMaterial;

export const transformerClearance = Path.makeRoundedRect(
  transformerHeight + 2 * joinOffset,
  transformerThickness + 2 * joinOffset,
  roundingRadius,
).translate([-joinOffset, -joinOffset]);
