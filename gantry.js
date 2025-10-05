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
  chariotWheelbase,
  gantryPosition,
} from "./dimensions.js";
import { a2m } from "./cade/tools/transform.js";
import { nx3, nz3, zero3 } from "./cade/lib/defaults.js";
import { chariot, yRail } from "./rails.js";
import { roller, screwAssy } from "./screw.js";

const height = 150 + 100;
const width = 200;

const innerPath = new Path();
innerPath.moveTo([0, 0]);
innerPath.lineTo([0, height]);
innerPath.lineTo([60, height]);
innerPath.lineTo([width, 0]);
innerPath.close();

export const inner = new FlatPart(
  "inner gantry support",
  woodThickness,
  innerPath,
);

export const gantry = new Assembly("gantry");
gantry.addChild(aluExtrusion, a2m([-45, 0, 0]));
gantry.addChild(inner, a2m(zero3, nz3, nx3));

gantry.addAttachListener((parent, loc) => {
  const { placement } = parent.findChild(yRail);
  const railOrigin = loc.inverse().multiply(placement);
  const chariotPlacement = railOrigin.translate(0, 0, gantryPosition);
  gantry.addChild(chariot, chariotPlacement);
  gantry.addChild(chariot, chariotPlacement.translate(0, 0, -chariotWheelbase));

  const screwOrigin = loc
    .inverse()
    .multiply(parent.findChild(screwAssy.children.at(-1).child).placement);
  gantry.addChild(roller, screwOrigin.rotate(0, 0, 180).translate(0, 0, -gantryPosition));
});
