// @ts-check

import { aluExtrusion } from "./aluminumExtrusion.js";
import { nx3, nz3, x3, y2, y3, z3, zero2, zero3 } from "./cade/lib/defaults.js";
import {
  FlatPart,
  joinParts,
  makeJoinFromEdgePoints,
  trimFlatPartWithAnother,
} from "./cade/lib/flat.js";
import { Assembly } from "./cade/lib/lib.js";
import { HornSlot, TenonMortise } from "./cade/lib/slots.js";
import { locateOriginOnFlatPart } from "./cade/lib/utils.js";
import { placeAlong, plus } from "./cade/tools/2d.js";
import { Path } from "./cade/tools/path.js";
import { a2m, transformPoint3 } from "./cade/tools/transform.js";
import {
  aluExtrusionHeight,
  aluExtrusionThickness,
  carrierWheelbase,
  gantryPosition,
  joinOffset,
  openArea,
  roundingRadius,
  screwShaftZ,
  screwSinking,
  tunnelHeight,
  typicalWidth,
  woodThickness,
  xRailSupportWidth,
} from "./dimensions.js";
import { CylinderNutFastener } from "./fasteners.js";
import {
  motorCenteringHole,
  motorHolesGetter,
  motorSideClearance,
  nema23,
} from "./motor.js";
import {
  boltThreadedSubpartToFlatPart,
  chariot,
  chariotBoltClearingRect,
  chariotHoleFinder,
  chariotLength,
  fastenSubpartToFlatPart,
  fastenSubpartToFlatPartEdge,
  railTopToBottom,
  yRail,
} from "./rails.js";
import {
  baseSurfaceToRollerSurface,
  bf12,
  bf12Thickness,
  bfk12Width,
  bk12,
  bkfHoleFinder,
  bkfTwoHoleFinder,
  bkPlateCutout,
  roller,
  rollerCenterToHole,
  rollerHoleFinder,
  screwAssy,
  shaftY,
} from "./screw.js";

const height = aluExtrusionHeight;
const width = carrierWheelbase;
const gapFromTunnel = 10 + joinOffset;
const angleFillet = 150;
const screwZ = 10;

const tm = (x) => new TenonMortise(x);
const cnf = (x) => new CylinderNutFastener(x);

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

const motorSupportPath = innerPath.clone();

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
const extrusionOffset = 60;

export const gantryHalf = new Assembly("gantry half");
const innerLocation = a2m([0, gantrySinking, 0], nz3, nx3);
const locatedInner = gantryHalf.addChild(inner, innerLocation);

gantryHalf.addChild(bottom, a2m([-carrierWheelbase, 0, -woodThickness], y3));
const locatedOuter = gantryHalf.addChild(
  outer,
  a2m([0, gantrySinking, -gantrySupportWidth - woodThickness], nz3, nx3),
);

export const gantry = new Assembly("gantry");
gantry.addChild(gantryHalf);
const screwPlacement = a2m(
  [-extrusionOffset, bfk12Width / 2 + woodThickness + screwZ, 26],
  x3,
  z3,
);
gantry.addChild(screwAssy, screwPlacement);

{
  const screwOrigin = gantry.findChild(
    screwAssy.children.at(-1).child,
  ).placement;

  gantry.addChild(
    roller,
    screwOrigin.rotate(0, 0, 180).translate(0, 0, -gantryPosition + 115),
  );
}

gantry.addChild(
  aluExtrusion,
  a2m([-aluExtrusionThickness - extrusionOffset, gantrySinking, 0]),
);

const layout = [cnf(0.8), tm(0.5), cnf(0.1)];

const centeredBolt = [cnf(0.5)];

const offcenterTenon = [cnf(0.3), tm(0.7)];

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
  return join;
}

const angledLineEnd = placeAlong(angledLine[1], angledLine[3], {
  fromEnd: -woodThickness,
});

const angledJoin = makeGantryJoin(
  "gantry top join",
  angledLine[1],
  angledLineEnd,
);
joinParts(gantryHalf, inner, angledJoin, layout);
joinParts(gantryHalf, outer, angledJoin, layout);

const backJoin = makeGantryJoin(
  "gantry back join",
  backLine[3],
  backLine[1],
  -woodThickness,
);
joinParts(gantryHalf, inner, backJoin, layout);
joinParts(gantryHalf, bottom, backJoin, [tm(0.3), cnf(0.6)]);

{
  const railClearanceHeight = 15;
  const railClearance = new Path();
  railClearance.moveTo([-railClearanceHeight, 0]);
  railClearance.arc([railClearanceHeight, 0], railClearanceHeight, 1);
  const [idx3] = backJoin.outside.findSegmentsOnLine(zero2, y2);
  backJoin.outside.insertFeature(railClearance, idx3, {
    fromStart: xRailSupportWidth / 2 + woodThickness / 2,
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

  boltThreadedSubpartToFlatPart(gantryHalf, chariot, bottom, chariotHoleFinder);

  const screwOrigin = loc
    .inverse()
    .multiply(parent.findChild(screwAssy.children.at(-1).child).placement);

  gantryHalf.addChild(
    roller,
    screwOrigin.rotate(0, 0, 180).translate(0, 0, -gantryPosition + 115),
  );
  boltThreadedSubpartToFlatPart(gantryHalf, roller, outer, rollerHoleFinder);

  const secondSupport = gantryHalf.mirror(z3);
  const secondOuter = secondSupport.forkChild(outer);
  const secondBackJoin = secondSupport.forkChild(backJoin);
  const secondInner = secondSupport.forkChild(inner);
  const secondBottom = secondSupport.forkChild(bottom);
  const secondAngled = secondSupport.forkChild(angledJoin);

  const secondSupportPlace = a2m([0, 0, openArea.x]);
  gantry.addChild(secondSupport, secondSupportPlace);

  const shaftOnInner = locateOriginOnFlatPart(
    gantry,
    secondInner,
    screwAssy.children.at(-1).child,
  );

  secondOuter.assignOutsidePath(
    secondOuter.outside.booleanDifference(
      motorSideClearance.translate(shaftOnInner),
    ),
  );

  joinParts(gantryHalf, outer, backJoin, layout);

  joinParts(
    secondSupport,
    secondOuter,
    secondBackJoin,
    centeredBolt,
    centeredBolt,
  );

  secondInner.addInsides(bkPlateCutout.translate(shaftOnInner));

  const motorInGantry = gantry.findChild(
    screwAssy.findChild(nema23).child,
  ).placement;

  const motorPlacement = secondSupportPlace
    .inverse()
    .multiply(motorInGantry)
    .multiply(a2m(zero3, nz3));

  const motorSupportPlacement = innerLocation.translate(
    0,
    0,
    -transformPoint3(motorPlacement, zero3)[2],
  );
  const support = new FlatPart(
    `motor support`,
    woodThickness,
    motorSupportPath,
  );
  secondSupport.addChild(support, motorSupportPlacement);

  trimFlatPartWithAnother(secondSupport, support, secondBottom);
  const allowableWidth = carrierWheelbase - chariotLength;
  support.assignOutsidePath(
    support.outside.cutOnLine([allowableWidth, 0], [allowableWidth, 1], true),
  );

  const [origin] = support.outside.bbox().extrema();
  support.assignOutsidePath(
    support.outside.booleanDifference(
      chariotBoltClearingRect.translate(origin),
    ),
  );

  const tenonAndBolt = [tm(0.3), cnf(0.8)];

  joinParts(secondSupport, support, secondBottom, [tm(0.5)]);
  joinParts(secondSupport, support, secondBackJoin, tenonAndBolt);
  joinParts(secondSupport, support, secondAngled, tenonAndBolt);

  const motorCenterOnSupport = locateOriginOnFlatPart(
    gantry,
    support,
    screwAssy.findChild(nema23).child,
  );
  support.addInsides(motorCenteringHole.translate(motorCenterOnSupport));

  fastenSubpartToFlatPart(gantry, nema23, support, motorHolesGetter);
  fastenSubpartToFlatPart(gantry, bk12, secondInner, bkfHoleFinder);

  // end holder
  const holderSize = 100;
  const screwEndHolderPath = Path.makeRoundedRect(
    holderSize,
    holderSize,
    roundingRadius,
  ).translate([-holderSize, -holderSize / 2]);

  const endHolder = new FlatPart(
    `screw end holder`,
    woodThickness,
    screwEndHolderPath,
  );

  const shaftPlacement = gantry.findChild(
    screwAssy.findChild(bf12).child,
  ).placement;
  gantryHalf.addChild(
    endHolder,
    shaftPlacement.multiply(a2m([-bf12Thickness / 2, 0, shaftY - woodThickness / 2], z3)),
  );
  trimFlatPartWithAnother(gantryHalf, endHolder, inner, true);
  joinParts(gantryHalf, endHolder, inner, [new HornSlot(), cnf(0.5), new HornSlot(false)]);
  fastenSubpartToFlatPartEdge(gantry, bf12, endHolder, bkfTwoHoleFinder);
});
