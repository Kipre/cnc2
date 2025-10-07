// @ts-check

import { Assembly } from "./cade/lib/lib.js";
import { FlatPart } from "./cade/lib/flat.js";
import { aluExtrusion } from "./aluminumExtrusion.js";
import { Path } from "./cade/tools/path.js";
import {
  openArea,
  woodThickness,
  xRailSupportWidth,
  joinWidth,
  bridgeTop,
  defaultSpindleSize,
  joinOffset,
  joinSpace,
  tunnelOpeningHeight,
  screwShaftZ,
  tunnelHeight,
  motorBodyLength,
  roundingRadius,
  gantryPosition,
  typicalWidth,
  screwSinking,
  carrierWheelbase,
  aluExtrusionThickness,
  aluExtrusionHeight,
} from "./dimensions.js";
import { a2m } from "./cade/tools/transform.js";
import { nx3, ny3, nz3, x3, y3, z3, zero3 } from "./cade/lib/defaults.js";
import {
  chariot,
  chariotLength,
  chariotTop,
  railTopToBottom,
  yRail,
} from "./rails.js";
import {
  baseSurfaceToRollerSurface,
  roller,
  screwAssy,
  bfk12Width,
} from "./screw.js";

const height = aluExtrusionHeight;
const width = 200;

const innerPath = new Path();
innerPath.moveTo([0, 0]);
innerPath.lineTo([0, height]);
innerPath.lineTo([width, height]);
innerPath.lineTo([width, 0]);
innerPath.close();

export const inner = new FlatPart(
  "inner gantry support",
  woodThickness,
  innerPath,
);

const bottomPlatePath = Path.makeRect(
  carrierWheelbase,
  typicalWidth + baseSurfaceToRollerSurface + screwSinking - woodThickness,
);

export const bottom = new FlatPart(
  "bottom gantry support",
  woodThickness,
  bottomPlatePath,
);

const gapFromTunnel = 10;
const gantrySinking = -railTopToBottom + gapFromTunnel;
const extrusionOffset = 50;

export const gantryHalf = new Assembly("gantry half");
gantryHalf.addChild(inner, a2m([0, gantrySinking, 0], nz3, nx3));
gantryHalf.addChild(bottom, a2m([-carrierWheelbase, 0, -woodThickness], y3));

export const gantry = new Assembly("gantry");
gantry.addChild(gantryHalf);
gantry.addChild(
  screwAssy,
  a2m([-extrusionOffset, bfk12Width / 2 + gantrySinking, 0], x3, z3),
);
gantry.addChild(
  aluExtrusion,
  a2m([-aluExtrusionThickness - extrusionOffset, gantrySinking, 0]),
);

gantry.addAttachListener((parent, loc) => {
  const { placement } = parent.findChild(yRail);
  const railOrigin = loc.inverse().multiply(placement);
  // TODO 93...
  const chariotPlacement = railOrigin.translate(
    0,
    0,
    gantryPosition + 93 - carrierWheelbase,
  );
  gantryHalf.addChild(chariot, chariotPlacement);
  gantryHalf.addChild(
    chariot,
    chariotPlacement.translate(0, 0, -carrierWheelbase + chariotLength),
  );

  const screwOrigin = loc
    .inverse()
    .multiply(parent.findChild(screwAssy.children.at(-1).child).placement);
  gantryHalf.addChild(
    roller,
    screwOrigin.rotate(0, 0, 180).translate(0, 0, -gantryPosition),
  );

  gantry.addChild(gantryHalf.mirror(), a2m([0, 0, openArea.x]));
});
