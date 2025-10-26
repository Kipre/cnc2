// @ts-check

import { aluExtrusion } from "./aluminumExtrusion.js";
import { nx3, nz3, y2, y3, z3, zero2 } from "./cade/lib/defaults.js";
import {
  FlatPart,
  joinParts,
  makeJoinFromEdgePoints,
  makeShelfOnPlane,
} from "./cade/lib/flat.js";
import { Assembly } from "./cade/lib/lib.js";
import { TenonMortise } from "./cade/lib/slots.js";
import { placeAlong, plus } from "./cade/tools/2d.js";
import { cross, minus3, norm3 } from "./cade/tools/3d.js";
import { Path } from "./cade/tools/path.js";
import { debugGeometry } from "./cade/tools/svg.js";
import { a2m, transformPoint3 } from "./cade/tools/transform.js";
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
import { CylinderNutFastener, defaultSlotLayout } from "./fasteners.js";
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
const angleFillet = 150;

const innerPath = new Path();
innerPath.moveTo([0, 0]);
innerPath.lineTo([0, height]);
const backLine = innerPath.getSegmentAt(-1);

innerPath.lineTo([width, height]);
innerPath.lineTo([width, 0]);
innerPath.fillet(angleFillet);

const angledLine = innerPath.getSegmentAt(-2);

const outerPath = innerPath.clone();
innerPath.close();

export const inner = new FlatPart(
  "inner gantry support",
  woodThickness,
  innerPath,
);

const rollerCenter = [width / 3, -(tunnelHeight - screwShaftZ + joinOffset)];
const [x, y] = plus(rollerCenterToHole, [joinOffset, joinOffset]);
outerPath.lineTo(plus(rollerCenter, [y, -x]));
outerPath.lineTo(plus(rollerCenter, [-y, -x]));
outerPath.close();
// outerPath.roundFilletAll(roundingRadius);

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
const locatedInner = gantryHalf.addChild(
  inner,
  a2m([0, gantrySinking, 0], nz3, nx3),
);

gantryHalf.addChild(bottom, a2m([-carrierWheelbase, 0, -woodThickness], y3));
const locatedOuter = gantryHalf.addChild(
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

const layout = [
  new CylinderNutFastener(0.8),
  new TenonMortise(0.5),
  new CylinderNutFastener(0.1),
];

const nonCenteredTenon = [new CylinderNutFastener(0.7), new TenonMortise(0.3)];

joinParts(gantryHalf, bottom, inner, layout);
joinParts(gantryHalf, bottom, outer, layout);

function makeGantryJoin(name, start, end, offset = 0) {
  const p1 = [...start, -joinOffset];
  const p2 = [...end, -joinOffset];
  const origin = transformPoint3(locatedInner.placement, p2);
  const eax = transformPoint3(locatedInner.placement, p1);
  const why = transformPoint3(locatedOuter.placement, p2);

  const { child: join, placement: joinMatrix } = makeJoinFromEdgePoints(
    origin,
    eax,
    why,
    woodThickness,
    joinOffset,
    roundingRadius,
  );
  join.name = name;
  gantryHalf.addChild(join, joinMatrix.translate(0, 0, offset));
  joinParts(gantryHalf, inner, join, layout);
  joinParts(gantryHalf, outer, join, layout);
  return join;
}

const angledLineEnd = placeAlong(angledLine[1], angledLine[3], {fromEnd: -woodThickness});
const angledJoin = makeGantryJoin("gantry top join", angledLine[1], angledLineEnd);
const backJoin = makeGantryJoin("gantry back join", backLine[3], backLine[1], -woodThickness);
joinParts(gantryHalf, bottom, backJoin, nonCenteredTenon);

{
  const railClearanceHeight = 15;
  const railClearance = new Path();
  railClearance.moveTo([-railClearanceHeight, 0]);
  railClearance.arc([railClearanceHeight, 0], railClearanceHeight, 1);
  const [idx3] = backJoin.outside.findSegmentsOnLine(zero2, y2);
  backJoin.outside.insertFeature(railClearance, idx3, {
    fromStart: xRailSupportWidth / 2  + woodThickness / 2,
  });
}

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
