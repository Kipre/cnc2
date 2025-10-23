// @ts-check

import { aluExtrusion } from "./aluminumExtrusion.js";
import { nx3, ny3, nz3, x3, y3, z3, zero3 } from "./cade/lib/defaults.js";
import { FlatPart } from "./cade/lib/flat.js";
import { Assembly } from "./cade/lib/lib.js";
import { plus } from "./cade/tools/2d.js";
import { Path } from "./cade/tools/path.js";
import { a2m } from "./cade/tools/transform.js";
import {
  aluExtrusionHeight,
  aluExtrusionThickness,
  bridgeTop,
  carrierWheelbase,
  defaultSpindleSize,
  gantryPosition,
  joinOffset,
  joinSpace,
  joinWidth,
  motorBodyLength,
  openArea,
  roundingRadius,
  screwShaftZ,
  screwSinking,
  tunnelHeight,
  tunnelOpeningHeight,
  typicalWidth,
  woodThickness,
  xRailSupportWidth,
} from "./dimensions.js";
import {
  chariot,
  chariotLength,
  chariotTop,
  railTopToBottom,
  yRail,
} from "./rails.js";
import {
  baseSurfaceToRollerSurface,
  bfk12Width,
  bkf12Height,
  roller,
  rollerCenterToHole,
  screwAssy,
} from "./screw.js";

const height = aluExtrusionHeight;
const width = carrierWheelbase;
const gapFromTunnel = 10 + joinOffset;

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

const outerPath = new Path();
outerPath.moveTo([0, 0]);
outerPath.lineTo([0, height]);
outerPath.lineTo([width, height]);
outerPath.lineTo([width, 0]);
const rollerCenter = [width / 3, -(tunnelHeight - screwShaftZ + joinOffset)];
{
  const [x, y] = plus(rollerCenterToHole, [joinOffset, joinOffset]);
  // outerPath.lineTo(plus(rollerCenter, [y, x]));
  outerPath.lineTo(plus(rollerCenter, [y, -x]));
  outerPath.lineTo(plus(rollerCenter, [-y, -x]));
  // outerPath.lineTo(plus(rollerCenter, [-y, x]));
}
outerPath.close();
outerPath.roundFilletAll(roundingRadius);

export const outer = new FlatPart(
  "outer gantry support",
  woodThickness,
  outerPath,
);

const gantrySupportWidth =
  typicalWidth + baseSurfaceToRollerSurface + screwSinking - woodThickness;
const bottomPlatePath = Path.makeRect(carrierWheelbase, gantrySupportWidth);

export const bottom = new FlatPart(
  "bottom gantry support",
  woodThickness,
  bottomPlatePath,
);

const gantrySinking = -railTopToBottom + gapFromTunnel;
const extrusionOffset = 50;

export const gantryHalf = new Assembly("gantry half");
gantryHalf.addChild(inner, a2m([0, gantrySinking, 0], nz3, nx3));
gantryHalf.addChild(bottom, a2m([-carrierWheelbase, 0, -woodThickness], y3));
gantryHalf.addChild(
  outer,
  a2m([0, gantrySinking, -gantrySupportWidth - woodThickness], nz3, nx3),
);

export const gantry = new Assembly("gantry");
gantry.addChild(gantryHalf);
gantry.addChild(
  screwAssy,
  a2m(
    [-extrusionOffset + bkf12Height + 1, bfk12Width / 2 + woodThickness, 26],
    nx3,
    z3,
  ),
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
    screwOrigin.rotate(0, 0, 180).translate(0, 0, -gantryPosition + 115),
  );

  gantry.addChild(gantryHalf.mirror([0, 0, 1]), a2m([0, 0, openArea.x]));
});
