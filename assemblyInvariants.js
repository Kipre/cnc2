// @ts-check
import { nx3, x3, y3, z3 } from "./cade/lib/defaults.js";
import { a2m } from "./cade/tools/transform.js";
import {
  aluExtrusionOffsetInGantry,
  aluExtrusionThickness,
  joinOffset,
  woodThickness,
} from "./dimensions.js";
import { railTopToBottom } from "./rails.js";
import { bfk12Width } from "./screw.js";

export const gapFromTunnel = 10 + joinOffset;
export const toExtrusionFront =
  aluExtrusionThickness + aluExtrusionOffsetInGantry;
export const gantrySinking = -railTopToBottom + gapFromTunnel;
export const screwZ = 10;
export const washerUnderRail = 1;

const railOrigin = [
  -aluExtrusionThickness / 2 - aluExtrusionOffsetInGantry,
  gantrySinking - washerUnderRail,
  0,
];

export const flatRailPlacementInGantry = a2m(railOrigin, z3, nx3);
export const screwPlacementInGantry = a2m(
  [-aluExtrusionOffsetInGantry, bfk12Width / 2 + woodThickness + screwZ, 26],
  x3,
  z3,
);

export const railToScrewPlacement = flatRailPlacementInGantry
  .inverse()
  .multiply(screwPlacementInGantry);
