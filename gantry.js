// @ts-check

import {
  aluEndHolesIterator,
  aluExtrusion,
  aluStartHolesIterator,
} from "./aluminumExtrusion.js";
import {
  aluExtrusionLocation,
  flatRailPlacementInGantry,
  screwPlacementInGantry,
  washerUnderRail,
} from "./assemblyInvariants.js";
import {
  nx3,
  ny2,
  nz3,
  x2,
  y2,
  y3,
  z3,
  zero2,
  zero3,
} from "./cade/lib/defaults.js";
import {
  boltThreadedSubpartToFlatPart,
  clearBoltOnFlatPart3,
  fastenSubpartToFlatPart,
  fastenSubpartToFlatPartEdge,
} from "./cade/lib/fastening.js";
import {
  FlatPart,
  getFacePlacement,
  joinParts,
  trimFlatPartWithAnother,
} from "./cade/lib/flat.js";
import { Assembly } from "./cade/lib/lib.js";
import { Locator } from "./cade/lib/locating.js";
import { makeShelfOnPlane, ShelfMaker } from "./cade/lib/shelf.js";
import { CenterDrawerSlot, DrawerSlot, HornSlot, TenonMortise } from "./cade/lib/slots.js";
import { locateOriginOnFlatPart } from "./cade/lib/utils.js";
import { plus } from "./cade/tools/2d.js";
import { Path } from "./cade/tools/path.js";
import { debugGeometry } from "./cade/tools/svg.js";
import { a2m, transformPoint3 } from "./cade/tools/transform.js";
import {
  aluExtrusionHeight,
  aluExtrusionThickness,
  carrierWheelbase,
  chariotSide,
  interFlatRail,
  joinOffset,
  motorSide,
  openArea,
  roundingRadius,
  woodThickness,
  xPosition,
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
  motorSideClearance1,
  nema23,
} from "./motor.js";
import {
  chariot,
  chariotContactSurface,
  chariotHoleFinder,
  chariotLength,
  railTopToBottom,
} from "./rails.js";
import {
  bf12,
  bf12Thickness,
  bk12,
  bkfHoleFinder,
  bkfTwoHoleFinder,
  bkPlateCutout,
  roller,
  rollerBbox,
  rollerContactSurface,
  rollerHoleFinder,
  screwAssy,
  shaftY,
} from "./screw.js";
import { tower } from "./tower.js";

const height = 130;
const width = carrierWheelbase;
const gapFromTunnel = 10 + joinOffset;
const gantrySinking = -railTopToBottom + gapFromTunnel;

const tm = (x) => new TenonMortise(x);
const cnf = (x) => new CylinderNutFastener(x);

const innerPath = new Path();
innerPath.moveTo([0, 0]);
innerPath.lineTo([0, height]);

innerPath.lineTo([width, height]);
innerPath.lineTo([width, 0]);

let outerPath = innerPath.clone();
innerPath.close();

const innerLocation = a2m([0, gantrySinking, 0], nz3, nx3);

const mergedInnerPath = new ShelfMaker(innerLocation, { woodThickness })
  .addFeature(innerPath, innerLocation)
  .addFeature(
    Path.makeRect(aluExtrusionThickness, aluExtrusionHeight).offset(10),
    aluExtrusionLocation,
  );

export const inner = new FlatPart(
  "inner gantry support",
  woodThickness,
  mergedInnerPath.make(),
);

outerPath.close();
outerPath = outerPath.offset([woodThickness, 0, woodThickness, gantrySinking]);

const supportWidth = motorSide + 60;

const motorSupportPath = outerPath
  .cutOnLine([supportWidth, 0], [supportWidth, 1], true)
  .offset([-woodThickness, -woodThickness, 0, 0]);

export const outer = new FlatPart(
  "outer gantry support",
  woodThickness,
  outerPath,
);

const gantrySupportWidth = chariotSide * 2 + 22.5;

export const gantryHalf = new Assembly("gantry half");
const locatedInner = gantryHalf.addChild(inner, innerLocation);
const locatedOuter = gantryHalf.addChild(
  outer,
  a2m([0, gantrySinking, -gantrySupportWidth - woodThickness], nz3, nx3),
);

const bottomPlacement = a2m([-carrierWheelbase, 0, -woodThickness], y3);
const bottomPlane = bottomPlacement.multiply(a2m([0, 0, woodThickness], nz3));

const rollerPlacement = new Locator()
  .onFlatPart(locatedOuter, true)
  .onPerforatedSurface(rollerHoleFinder)
  // .coorientedWith(screwPlacementInGantry.multiply(screwAssy.findChild(nema23).placement))
  .locate()
  // TODO fix this
  .rotate(0, -90)
  .translate(10, 0, -75);

outer.assignOutsidePath(
  new ShelfMaker(innerLocation, { woodThickness })
    .addFeature(outerPath, innerLocation)
    .addFeature(rollerBbox, rollerPlacement.multiply(rollerContactSurface))
    .make(),
);


export const gantry = new Assembly("gantry");
gantry.addChild(gantryHalf);

gantry.addChild(aluExtrusion, aluExtrusionLocation);

gantry.addChild(flatRail, flatRailPlacementInGantry);
gantry.addChild(
  flatRail,
  flatRailPlacementInGantry
    .translate(0, -interFlatRail - 2 * washerUnderRail)
    .rotate(180),
);

gantry.addChild(screwAssy, screwPlacementInGantry);

const layout = [cnf(0.85), tm(0.5), cnf(0.15)];
const drawerLayout = [cnf(0.85), new CenterDrawerSlot(0.5), cnf(0.15)];

const centeredBolt = [cnf(0.5)];


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

const frontPlacement = locatedInner.placement.multiply(
  getFacePlacement(inner, zero2, ny2),
);
const topLocation = locatedInner.placement.multiply(
  getFacePlacement(inner, zero2, x2),
);

const frontJoin = makeGantryJoin("gantry front join", frontPlacement);
joinParts(gantryHalf, inner, frontJoin, layout);
joinParts(gantryHalf, frontJoin, outer, drawerLayout);

const backPlacement = locatedInner.placement.multiply(
  getFacePlacement(inner, zero2, y2),
);
const backJoin = makeGantryJoin("gantry back join", backPlacement);

const bottomPlatePath = new ShelfMaker(bottomPlane, { woodThickness, zonePoint: [100, -30] })
  .addFlatPart(locatedInner)
  .addFlatPart(locatedOuter)
  .addFlatPart(gantryHalf.findChild(backJoin))
  .addFlatPart(gantryHalf.findChild(frontJoin))
  .make();

export const bottom = new FlatPart(
  "bottom gantry support",
  woodThickness,
  bottomPlatePath,
);

gantryHalf.addChild(bottom, bottomPlane);
joinParts(gantryHalf, bottom, inner, [cnf(0.9), tm(0.4), cnf(0.1)]);


joinParts(gantryHalf, inner, backJoin, layout);
joinParts(gantryHalf, bottom, backJoin, [cnf(0.4)]);
joinParts(gantryHalf, bottom, frontJoin, [cnf(0.6)]);

const chariotPlacement = bottomPlacement
  .multiply(chariotContactSurface.rotate(-90).inverse())
  .translate(chariotSide);

gantryHalf.addChild(chariot, chariotPlacement);
gantryHalf.addChild(
  chariot,
  chariotPlacement.translate(0, 0, carrierWheelbase - chariotLength),
);

for (const join of [backJoin, frontJoin]) {
  const railClearanceHeight = 15;
  // TODO
  const railClearance = Path.makeRect(2 * railClearanceHeight).recenter();

  const railOnJoin = locateOriginOnFlatPart(gantry, join, chariot);

  join.assignOutsidePath(
    join.outside.booleanDifference(
      railClearance.translate(plus(railOnJoin, [20, 0])),
    ),
  );
}

const chariotFasteners = boltThreadedSubpartToFlatPart(
  gantryHalf,
  chariot,
  bottom,
  chariotHoleFinder,
  getFastenerKit,
);

gantryHalf.addChild(roller, rollerPlacement);

const locations = boltThreadedSubpartToFlatPart(
  gantryHalf,
  roller,
  outer,
  rollerHoleFinder,
  getFastenerKit,
  { ignoreMisplacedHoles: true },
);

clearBoltOnFlatPart3(gantryHalf, bottom, locations);
joinParts(gantryHalf, bottom, outer, [cnf(0.4), tm(0.7)], centeredBolt);

const secondSupport = gantryHalf.mirror(z3);
const secondOuter = secondSupport.forkChild(outer);
const secondBackJoin = secondSupport.forkChild(backJoin);
const secondInner = secondSupport.forkChild(inner);
const secondBottom = secondSupport.forkChild(bottom);
const secondFront = secondSupport.forkChild(frontJoin);

const secondSupportPlace = a2m([0, 0, openArea.x]);
gantry.addChild(secondSupport, secondSupportPlace);

const shaftOnInner = locateOriginOnFlatPart(
  gantry,
  secondInner,
  screwAssy.children.at(-1).child,
);

// secondOuter.assignOutsidePath(
//   secondOuter.outside.booleanDifference(
//     motorSideClearance.translate(shaftOnInner),
//   ),
// );
secondOuter.addInsides(motorSideClearance.translate(shaftOnInner));

joinParts(gantryHalf, backJoin, outer, drawerLayout);

joinParts(
  secondSupport,
  secondBackJoin,
  secondOuter,
  [cnf(0.2), cnf(0.8)]
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

joinParts(secondSupport, support, secondBottom, [new HornSlot()]);
joinParts(secondSupport, support, secondBackJoin, [cnf(0.8)]);

const braceWidth = 60;
const topPath = new ShelfMaker(topLocation, { woodThickness })
  .addFlatPart(secondSupport.findChild(support))
  .addFlatPart(secondSupport.findChild(secondInner))
  .addFlatPart(secondSupport.findChild(secondOuter))
  .make()
  .cutOnLine([supportWidth, 0], [supportWidth, 1], true)
  .cutOnLine([supportWidth - braceWidth, 0], [supportWidth - braceWidth, 1]);

topPath.roundFilletAll(roundingRadius);

export const top = new FlatPart("top brace", woodThickness, topPath);
secondSupport.addChild(top, topLocation);

joinParts(secondSupport, support, top, [new DrawerSlot(false), cnf(0.4)]);
joinParts(secondSupport, secondInner, top, centeredBolt);
joinParts(secondSupport, secondOuter, top, centeredBolt);

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
  new HornSlot(false),
  cnf(0.5),
  new HornSlot(),
]);
fastenSubpartToFlatPartEdge(
  gantry,
  bf12,
  endHolder,
  bkfTwoHoleFinder,
  getBoltAndBarrelNut,
);

boltThreadedSubpartToFlatPart(
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

clearBoltOnFlatPart3(secondSupport, support, chariotFasteners.slice(4));

const towerPlacement = gantry
  .findChild(flatRail)
  .placement.multiply(tower.findChild(flatChariot).placement.inverse());

gantry.addChild(tower, towerPlacement.translate(0, 0, xPosition));
