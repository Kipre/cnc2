// @ts-check

import { blackMetalMaterial, metalMaterial } from "../cade/lib/materials.js";
import {
  cut,
  extrusion,
  fuse,
  multiExtrusion,
  retrieveOperations,
} from "../cade/lib/operations.js";
import { Part } from "../cade/lib/part.js";
import { nx3, ny3, nz3, x3, y3, z3, zero3 } from "../cade/tools/defaults.js";
import { Path } from "../cade/tools/path.js";
import { debugGeometry } from "../cade/tools/svg.js";
import { a2m } from "../cade/tools/transform.js";
import { joinOffset, roundingRadius } from "../dimensions.js";

// TODO: confirm
const driverWidth = 75;
const driverThickness = 34;
const driverLength = 118;

const threadSize = 4;
const threadDepth = 5;

const sideProfile = new Path();
sideProfile.moveTo([0, 0]);
sideProfile.lineTo([0, driverThickness]);
sideProfile.lineTo([3, driverThickness]);
sideProfile.lineTo([3, 11]);
sideProfile.lineTo([driverWidth, 11]);
sideProfile.lineTo([driverWidth, 0]);
sideProfile.close();

const body = extrusion(
  a2m([driverLength, 0, 0], nx3, z3),
  driverLength,
  sideProfile,
);

const body2 = extrusion(
  a2m([driverLength / 2, 11, 0]),
  driverWidth,
  Path.makeRect(105, driverThickness - 11).recenter({ onlyX: true }),
);

const hole = Path.makeRoundedRect(10, 4, 2).recenter();
// TODO
// hole.simplify()

const firstHole = [0, driverThickness - 9 + 2];
const secondHole = [driverLength, driverThickness - 9 + 2];
const holes = multiExtrusion(
  a2m(), //.translate(0, 0, 5),
  4,
  hole.translate(firstHole),
  hole.translate(secondHole),
);

export function* driverHoleFinder(part) {
  const common = { hole: Path.makeCircle(2), depth: 3 };
  yield {
    ...common,
    transform: a2m()
      .translate(...firstHole)
      .translate(3),
  };
  yield {
    ...common,
    transform: a2m()
      .translate(...secondHole)
      .translate(-3),
  };
}

export const driver = new Part("stepper driver", cut(fuse(body, body2), holes));
driver.material = blackMetalMaterial;

export const driverClearance = Path.makeRoundedRect(
  driverLength + 2 * joinOffset,
  driverThickness + 2 * joinOffset,
  roundingRadius,
).translate([-joinOffset, -joinOffset]);
