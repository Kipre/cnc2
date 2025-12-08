// @ts-check

import {
  aluEndHolesIterator,
  aluExtrusion,
  aluStartHolesIterator,
} from "./aluminumExtrusion.js";
import {
  flatRailPlacementInGantry,
  screwPlacementInGantry,
  toExtrusionFront,
  washerUnderRail,
} from "./assemblyInvariants.js";
import { nx3, nz3, x2, y2, y3, z3, zero2, zero3 } from "./cade/lib/defaults.js";
import {
  FlatPart,
  getFacePlacement,
  joinParts,
  trimFlatPartWithAnother,
} from "./cade/lib/flat.js";
import { Assembly } from "./cade/lib/lib.js";
import { makeShelfOnPlane } from "./cade/lib/shelf.js";
import { HornSlot, TenonMortise } from "./cade/lib/slots.js";
import { locateOriginOnFlatPart } from "./cade/lib/utils.js";
import { plus } from "./cade/tools/2d.js";
import { Path } from "./cade/tools/path.js";
import { a2m, transformPoint3 } from "./cade/tools/transform.js";
import {
  aluExtrusionHeight,
  aluExtrusionThickness,
  carrierWheelbase,
  interFlatRail,
  joinOffset,
  openArea,
  roundingRadius,
  screwShaftZ,
  screwSinking,
  tunnelHeight,
  typicalWidth,
  woodThickness,
  xPosition,
  xRailSupportWidth,
  yRailPlacementOnTunnel,
} from "./dimensions.js";
import {
  CylinderNutFastener,
  getBoltAndBarrelNut,
  getFastenerKit,
} from "./fasteners.js";
import { flatChariot, flatRail } from "./flatRails.js";
import {
  motorCenteringHole,
  motorHolesGetter,
  motorSideClearance,
  nema23,
} from "./motor.js";
import {
  chariot,
  chariotBoltClearingRect,
  chariotContactSurface,
  chariotHoleFinder,
  chariotLength,
  railTopToBottom,
} from "./rails.js";
import {
  boltThreadedSubpartToFlatPart,
  clearBoltOnFlatPart,
  fastenSubpartToFlatPart,
  fastenSubpartToFlatPartEdge,
} from "./cade/lib/fastening.js";
import {
  baseSurfaceToRollerSurface,
  bf12,
  bf12Thickness,
  bk12,
  bkfHoleFinder,
  bkfTwoHoleFinder,
  bkPlateCutout,
  roller,
  rollerCenterToHole,
  rollerContactSurface,
  rollerHoleFinder,
  screwAssy,
  shaftY,
} from "./screw.js";
import { tower } from "./tower.js";

const height = aluExtrusionHeight;
const width = carrierWheelbase;
const gapFromTunnel = 10 + joinOffset;
const angleFillet = 150;

const tm = (x) => new TenonMortise(x);
const cnf = (x) => new CylinderNutFastener(x);

const innerPath = new Path();
innerPath.moveTo([0, 0]);
innerPath.lineTo([0, height]);

innerPath.lineTo([width, height]);
innerPath.lineTo([width, 0]);
innerPath.fillet(angleFillet);

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

export const gantryHalf = new Assembly("gantry half");
const innerLocation = a2m([0, gantrySinking, 0], nz3, nx3);
const locatedInner = gantryHalf.addChild(inner, innerLocation);

const bottomPlacement = a2m([-carrierWheelbase, 0, -woodThickness], y3);
gantryHalf.addChild(bottom, bottomPlacement);
const locatedOuter = gantryHalf.addChild(
  outer,
  a2m([0, gantrySinking, -gantrySupportWidth - woodThickness], nz3, nx3),
);

export const gantry = new Assembly("gantry");
gantry.addChild(gantryHalf);

gantry.addChild(aluExtrusion, a2m([-toExtrusionFront, gantrySinking, 0]));

gantry.addChild(flatRail, flatRailPlacementInGantry);
gantry.addChild(
  flatRail,
  flatRailPlacementInGantry
    .translate(0, -interFlatRail - 2 * washerUnderRail)
    .rotate(180),
);

gantry.addChild(screwAssy, screwPlacementInGantry);

const layout = [cnf(0.8), tm(0.5), cnf(0.1)];

const centeredBolt = [cnf(0.5)];

joinParts(gantryHalf, bottom, inner, [cnf(0.8), tm(0.65), cnf(0.1)]);
joinParts(gantryHalf, bottom, outer, layout);

function makeGantryJoin(name, placement) {
  const joinPath = makeShelfOnPlane(
    placement,
    { woodThickness, joinOffset },
    locatedInner,
    locatedOuter,
  );
  const piece = new FlatPart(name, woodThickness, joinPath);
  gantryHalf.addChild(piece, placement);
  return piece;
}

const angledPlacement = locatedInner.placement.multiply(
  getFacePlacement(inner, y2, x2),
);

const angledJoin = makeGantryJoin("gantry top join", angledPlacement);
angledJoin.assignOutsidePath(
  angledJoin.outside.offset([0, 0, -woodThickness, 0]),
);
angledJoin.outside.roundFilletAll(roundingRadius);
joinParts(gantryHalf, inner, angledJoin, layout);
joinParts(gantryHalf, outer, angledJoin, layout);

const backPlacement = locatedInner.placement.multiply(
  getFacePlacement(inner, zero2, y2),
);
const backJoin = makeGantryJoin("gantry back join", backPlacement);
backJoin.outside.roundFilletAll(roundingRadius);
joinParts(gantryHalf, inner, backJoin, layout);
joinParts(gantryHalf, bottom, backJoin, [tm(0.3), cnf(0.6)]);

{
  const railClearanceHeight = 15;
  const railClearance = new Path();
  railClearance.moveTo([-railClearanceHeight, 0]);
  railClearance.arc([railClearanceHeight, 0], railClearanceHeight, 1);
  const [idx3] = backJoin.outside.findSegmentsOnLine(zero2, y2);
  backJoin.outside.insertFeature(railClearance, idx3, {
    fromEnd: -xRailSupportWidth / 2 - woodThickness / 2,
  });
}

const chariotPlacement = bottomPlacement
  .multiply(chariotContactSurface.rotate(-90).inverse())
  .translate(yRailPlacementOnTunnel);

gantryHalf.addChild(chariot, chariotPlacement);
gantryHalf.addChild(
  chariot,
  chariotPlacement.translate(0, 0, carrierWheelbase - chariotLength),
);

boltThreadedSubpartToFlatPart(
  gantryHalf,
  chariot,
  bottom,
  chariotHoleFinder,
  getFastenerKit,
);

const rollerPlacement = locatedOuter.placement
  .translate(...rollerCenter)
  .multiply(rollerContactSurface.rotate(90).inverse());

gantryHalf.addChild(roller, rollerPlacement);
boltThreadedSubpartToFlatPart(
  gantryHalf,
  roller,
  outer,
  rollerHoleFinder,
  getFastenerKit,
);

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
const support = new FlatPart(`motor support`, woodThickness, motorSupportPath);
secondSupport.addChild(support, motorSupportPlacement);

trimFlatPartWithAnother(secondSupport, support, secondBottom);
const allowableWidth = carrierWheelbase - chariotLength;
support.assignOutsidePath(
  support.outside.cutOnLine([allowableWidth, 0], [allowableWidth, 1], true),
);

const [origin] = support.outside.bbox().extrema();
support.assignOutsidePath(
  support.outside.booleanDifference(chariotBoltClearingRect.translate(origin)),
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

fastenSubpartToFlatPart(
  gantry,
  nema23,
  support,
  motorHolesGetter,
  getFastenerKit,
);
fastenSubpartToFlatPart(
  gantry,
  bk12,
  secondInner,
  bkfHoleFinder,
  getFastenerKit,
);

// end holder
const holderSize = 80;
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
  shaftPlacement.multiply(
    a2m([-bf12Thickness / 2, 0, shaftY - woodThickness / 2], z3),
  ),
);
trimFlatPartWithAnother(gantryHalf, endHolder, inner, true);
joinParts(gantryHalf, endHolder, inner, [
  new HornSlot(),
  cnf(0.5),
  new HornSlot(false),
]);
fastenSubpartToFlatPartEdge(
  gantry,
  bf12,
  endHolder,
  bkfTwoHoleFinder,
  getBoltAndBarrelNut,
);

const [aluToInnerBolt] = boltThreadedSubpartToFlatPart(
  gantry,
  aluExtrusion,
  inner,
  aluStartHolesIterator,
  getFastenerKit,
);
boltThreadedSubpartToFlatPart(
  gantry,
  aluExtrusion,
  secondInner,
  aluEndHolesIterator,
  getFastenerKit,
);

clearBoltOnFlatPart(gantry, bottom, aluToInnerBolt.child, { ignore: true });
clearBoltOnFlatPart(gantry, secondBottom, aluToInnerBolt.child, {
  ignore: true,
});

const towerPlacement = gantry
  .findChild(flatRail)
  .placement.multiply(tower.findChild(flatChariot).placement.inverse());

gantry.addChild(tower, towerPlacement.translate(0, 0, xPosition));
