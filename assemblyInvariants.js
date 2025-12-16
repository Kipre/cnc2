// @ts-check
import { nx3, nz3, x3, y3, z3 } from "./cade/lib/defaults.js";
import { a2m, locateWithConstraints } from "./cade/tools/transform.js";
import {
  aluExtrusionOffsetInGantry,
  aluExtrusionThickness,
  bridgeHeight,
  clearBoltHeads,
  joinOffset,
  joinWidth,
  tunnelHeight,
  tunnelWidth,
  woodThickness,
  xOverwidth,
  yRailEndSpace,
  yRailPlacementOnTunnel,
} from "./dimensions.js";
import { flatRailTotalHeight } from "./flatRails.js";
import { railTopToBottom } from "./rails.js";
import { bfk12Width } from "./screw.js";

export const gapFromTunnel = 10 + joinOffset;
export const toExtrusionFront =
  aluExtrusionThickness + aluExtrusionOffsetInGantry;
export const gantrySinking = -railTopToBottom + gapFromTunnel;
export const screwZ = 10;
export const washerUnderRail = 1;
export const chariotTopToExtrusionBottom =
  tunnelHeight + woodThickness + railTopToBottom;
export const extrusionBottomToTowerBottom =
  flatRailTotalHeight +
  washerUnderRail +
  woodThickness +
  // TODO + clearBoltHeads
  5 +
  bridgeHeight;

export function otherSide(placement, other = false) {
  return placement.multiply(a2m([0, 0, woodThickness], other ? nz3 : z3));
}

export const aluExtrusionLocation = a2m([
  -toExtrusionFront,
  extrusionBottomToTowerBottom - chariotTopToExtrusionBottom,
  0,
]);
const railOrigin = [aluExtrusionThickness / 2, -washerUnderRail, 0];

export const tunnelTop = a2m([0, 0, tunnelHeight], z3, y3);
export const tunnelOuterLocation = a2m([0, 0, -tunnelWidth]);

export const screwXLocation =
  xOverwidth + 2 * woodThickness + joinWidth - bfk12Width / 2;

export const flatRailPlacementInGantry = aluExtrusionLocation.multiply(
  a2m(railOrigin, z3, nx3),
);
export const screwPlacementInGantry = a2m(
  [-aluExtrusionOffsetInGantry, bfk12Width / 2 + woodThickness + screwZ, 26],
  x3,
  z3,
);

export const yRailPlacement = a2m(
  [
    joinWidth + woodThickness + yRailEndSpace,
    tunnelHeight + woodThickness,
    yRailPlacementOnTunnel,
  ],
  x3,
  nz3,
);

export const railToScrewPlacement = flatRailPlacementInGantry
  .inverse()
  .multiply(screwPlacementInGantry);
