// @ts-check
/** @import * as types from './cade/tools/types' */

import {
  otherSide,
  railToScrewPlacement,
  washerUnderRail,
} from "./assemblyInvariants.js";
import {
  boltThreadedSubpartToFlatPart,
  clearBoltOnFlatPart,
  clearBoltOnFlatPart3,
  fastenSubpartToFlatPart,
  fastenSubpartToFlatPartEdge,
} from "./cade/lib/fastening.js";
import {
  FlatPart,
  getFaceOnLocatedFlatPart,
  getFacePlacement,
  joinParts,
  spindleCleared2LineTo,
} from "./cade/lib/flat.js";
import { Assembly } from "./cade/lib/lib.js";
import { ShelfMaker } from "./cade/lib/shelf.js";
import {
  CenterDrawerSlot,
  TenonMortise,
  TroughAngleSupport,
} from "./cade/lib/slots.js";
import { locateOriginOnFlatPart } from "./cade/lib/utils.js";
import { norm } from "./cade/tools/2d.js";
import {
  nx2,
  nx3,
  ny2,
  nz3,
  x2,
  x3,
  y2,
  y3,
  z3,
  zero2,
  zero3,
} from "./cade/tools/defaults.js";
import { Path } from "./cade/tools/path.js";
import { debugGeometry } from "./cade/tools/svg.js";
import {
  a2m,
  locateWithConstraints,
  transformPoint3,
} from "./cade/tools/transform.js";
import {
  aluExtrusionHeight,
  aluExtrusionThickness,
  carrierWheelbase,
  clearBoltHeads,
  defaultSpindleSize,
  interFlatRail,
  joinOffset,
  motorSide,
  motorSupportWidth,
  roundingRadius,
  woodThickness,
  zPosition,
  zRailLength,
} from "./dimensions.js";
import {
  CylinderNutFastener,
  getFastenerKit,
  getHexAndBarrelNut,
} from "./fasteners.js";
import {
  flatChariot,
  flatChariotHolesIterator,
  flatChariotLength,
  flatChariotWidth,
  flatRailHolesIterator,
  flatRailTotalHeight,
  shortFlatRail,
} from "./flatRails.js";
import { head } from "./head.js";
import {
  motorCenteringHole,
  motorHolesGetter,
  motorSideClearance,
  nema23,
} from "./motor.js";
import {
  baseSurfaceToRollerSurface,
  bf12,
  bk12,
  bkfHoleFinder,
  bkfTopHoleFinder,
  bkfTwoHoleFinder,
  roller,
  rollerContactSurface,
  rollerHoleFinder,
  rollerThickness,
  screwAssy,
  shaftY,
  shortScrewAssy,
} from "./screw.js";

const tm = (x) => new TenonMortise(x);
const cnf = (x) => new CylinderNutFastener(x);

const interHorizontalPlates =
  aluExtrusionHeight + 2 * flatRailTotalHeight + washerUnderRail;
const frontPlateToExtrusion = clearBoltHeads;
const roomForABolt = 5;

const railSupportLength = zRailLength + roomForABolt;
const frontPlateHeight = railSupportLength - 2 * woodThickness;
export const frontPlate = new FlatPart(
  "tower plate",
  woodThickness,
  Path.makeRect(carrierWheelbase, frontPlateHeight).recenter({ onlyX: true }),
);

export const towerBottomToRail = woodThickness;
export const tower = new Assembly("tower");
const towerPlatePlacement = a2m(zero3, nx3, z3);
const locatedFrontPlate = tower.addChild(frontPlate, towerPlatePlacement);

const interChariot = carrierWheelbase;
for (const x of [-interChariot / 2, interChariot / 2 - flatChariotLength]) {
  for (const y of [0, interFlatRail + 2 * washerUnderRail]) {
    tower.addChild(
      flatChariot,
      a2m(
        [
          aluExtrusionThickness / 2 + frontPlateToExtrusion,
          flatRailTotalHeight + y,
          x,
        ],
        z3,
        y === 0 ? nx3 : x3,
      ),
    );
  }
}

const backPlateWidth = 90;
const backPlate = new FlatPart(
  "tower back plate",
  woodThickness,
  Path.makeRect(backPlateWidth, aluExtrusionHeight * 1.6).recenter({
    onlyX: true,
  }),
);

const plateToPlate =
  baseSurfaceToRollerSurface +
  aluExtrusionThickness +
  frontPlateToExtrusion +
  woodThickness;

const backplatePlacement = towerPlatePlacement.translate(
  0,
  -woodThickness,
  -plateToPlate,
);
tower.addChild(backPlate, backplatePlacement);

const railBottom = baseSurfaceToRollerSurface - flatRailTotalHeight;

const topPlacement = towerPlatePlacement
  .multiply(getFacePlacement(frontPlate, zero2, x2))
  .translate(0, -woodThickness - motorSupportWidth);

const bottomPlateLocation = getFacePlacement(frontPlate, zero2, nx2);

const railSupport = new Assembly("z axis rail assy");
const railOffcenter = (carrierWheelbase - flatChariotWidth) / 2;
tower.addChild(railSupport, a2m([0, 0, -railOffcenter]));

const railBase = new FlatPart(
  "vertical rail base",
  woodThickness,
  Path.makeRect(railBottom, railSupportLength),
);
const railBasePlacement = a2m(
  [-woodThickness, -woodThickness, woodThickness / 2],
  nz3,
  nx3,
);
railSupport.addChild(railBase, railBasePlacement);
const rightRailSupport = tower.findChild(railBase);

const shortRailPlacement = locateWithConstraints({
  from: a2m(zero3, y3),
  to: getFacePlacement(railBase, zero2, ny2),
})
  .rotate(0, -90)
  .translate(-woodThickness / 2, 0, -zRailLength);

railSupport.addChild(
  shortFlatRail,
  railBasePlacement.multiply(shortRailPlacement),
);

function* shortRailFasteners() {
  let i = 0;
  for (const hole of flatRailHolesIterator(zRailLength)()) {
    if (![0, 3, 5, 8, 10, 13].includes(i++)) continue;
    yield hole;
  }
}
fastenSubpartToFlatPartEdge(
  railSupport,
  shortFlatRail,
  railBase,
  shortRailFasteners,
  getHexAndBarrelNut,
);

const otherSupport = railSupport.clone();
const otherRailBase = otherSupport.forkChild(railBase);
tower.addChild(otherSupport, a2m([0, 0, railOffcenter]));
const leftRailSupport = tower.findChild(otherRailBase);

const screwAxisPlacement = tower
  .findChild(flatChariot)
  .placement.multiply(railToScrewPlacement);
const screwPoint = transformPoint3(screwAxisPlacement, zero3);

const rollerPlacement = otherSide(backplatePlacement, true)
  .translate(0, -screwPoint[1] - woodThickness)
  .multiply(rollerContactSurface.rotate(90).inverse());

tower.addChild(roller, rollerPlacement);
boltThreadedSubpartToFlatPart(
  tower,
  roller,
  backPlate,
  rollerHoleFinder,
  getFastenerKit,
);

const [chariot1, two, chariot2, four] = tower.findChildren(flatChariot);

const bottomJoinMaker = new ShelfMaker(bottomPlateLocation, {
  woodThickness,
  zonePoint: [-100, 0],
})
  .addFlatPart(tower.findChild(frontPlate))
  .addFlatPart(tower.findChild(backPlate))
  .addSingleSideOfPart(rightRailSupport, true)
  .addSingleSideOfPart(leftRailSupport);

const middleJoinLocation = a2m([0, interHorizontalPlates + 1, 0], y3);
const middleShelfMaker = new ShelfMaker(middleJoinLocation, {
  woodThickness,
  joinOffset,
})
  .addFlatPart(tower.findChild(frontPlate))
  .addFlatPart(tower.findChild(backPlate));

for (const maker of [middleShelfMaker, bottomJoinMaker]) {
  for (const chariot of [chariot1, chariot2]) {
    for (const hole of flatChariotHolesIterator()) {
      maker.addFeature(
        hole.hole.offset(8),
        chariot.placement.multiply(hole.transform),
      );
    }
  }
}

const bottom = new FlatPart(
  "tower bottom join",
  woodThickness,
  bottomJoinMaker.make(),
);

const centeredBolt = [cnf(0.5)];
const triple = [cnf(0.85), tm(0.5), cnf(0.15)];
// const quint = [cnf(0.1), tm(0.3), cnf(0.5), tm(0.7), cnf(0.9)];

tower.addChild(bottom, bottomPlateLocation);
joinParts(tower, bottom, backPlate, [
  cnf(0.15),
  new CenterDrawerSlot(0.5, true),
  cnf(0.85),
]);
joinParts(tower, backPlate, bottom, centeredBolt);

joinParts(tower, frontPlate, bottom, [
  cnf(0.1),
  new CenterDrawerSlot(0.5, false, 100),
  cnf(0.9),
]);
joinParts(tower, bottom, frontPlate, centeredBolt);
joinParts(tower, bottom, railBase, centeredBolt);
joinParts(tower, bottom, otherRailBase, centeredBolt);

const middle = new FlatPart(
  "tower middle join",
  woodThickness,
  middleShelfMaker.make(),
);
const locatedMiddle = tower.addChild(middle, middleJoinLocation);

boltThreadedSubpartToFlatPart(
  tower,
  flatChariot,
  middle,
  flatChariotHolesIterator,
  getFastenerKit,
  { ignoreMisplacedHoles: true },
);

boltThreadedSubpartToFlatPart(
  tower,
  flatChariot,
  bottom,
  flatChariotHolesIterator,
  getFastenerKit,
  { ignoreMisplacedHoles: true },
);

joinParts(tower, middle, frontPlate, [
  new TroughAngleSupport(locatedMiddle, leftRailSupport, true),
  cnf(0.35),
  cnf(0.65),
  new TroughAngleSupport(locatedMiddle, rightRailSupport),
]);
joinParts(tower, middle, backPlate, triple);

for (const part of [railBase, otherRailBase]) {
  joinParts(tower, middle, part, centeredBolt);
  const side = part === railBase;
  joinParts(tower, part, frontPlate, [
    cnf(0.08),
    new CenterDrawerSlot(0.3, side),
    cnf(0.48),
    cnf(0.65),
    new CenterDrawerSlot(0.8, side, 50),
    // cnf(0.97),
  ]);
  joinParts(tower, frontPlate, part, centeredBolt, centeredBolt);
}

const top = new FlatPart(
  "top tower plate",
  woodThickness,
  Path.makeRect(carrierWheelbase, 50 + woodThickness + motorSupportWidth),
);
tower.addChild(top, topPlacement);

const locatedBackPlate = tower.findChild(backPlate);
const rightsidePlacement = getFacePlacement(backPlate, zero2, y2);
const rightSupportPlacement =
  locatedBackPlate.placement.multiply(rightsidePlacement);

const verticalAngle = new ShelfMaker(rightSupportPlacement, {
  woodThickness,
  zonePoint: [266, -52],
})
  .addFlatPart(locatedFrontPlate)
  .addFlatPart(locatedBackPlate)
  .addFlatPart(tower.findChild(middle))
  .addFlatPart(tower.findChild(top))
  .make();

const rightSideSupport = new FlatPart(
  "vertical support join",
  woodThickness,
  verticalAngle,
);
const leftSideSupport = rightSideSupport.clone();

const supportBbox = rightSideSupport.outside.bbox();
const supportCenter = [supportBbox.xMin + 30, supportBbox.yMax - 40];

let cableChainSupport = Path.makeRect(40, 100);
cableChainSupport = cableChainSupport.translate(supportCenter);
cableChainSupport.roundFilletAll(5);

leftSideSupport.assignOutsidePath(
  leftSideSupport.outside.realBooleanUnion(cableChainSupport).invert(),
);
leftSideSupport.addInsides(Path.makeCircle(10).translate(cableChainSupport.bbox().center()));

const locatedRightSide = tower.addChild(
  rightSideSupport,
  rightSupportPlacement,
);

const locatedLeftSide = tower.addChild(
  leftSideSupport,
  rightSupportPlacement.translate(0, 0, -backPlateWidth - woodThickness),
);

export const supportShoulder = getFaceOnLocatedFlatPart(locatedLeftSide, (x) =>
  -Math.abs(x[0] - cableChainSupport.bbox().xMax),
);

for (const part of [rightSideSupport, leftSideSupport]) {
  joinParts(tower, part, frontPlate, [cnf(0.9), tm(0.65), cnf(0.2)]);
  joinParts(tower, backPlate, part, centeredBolt);
}

const screwPlacement = locateWithConstraints(
  {
    from: shortScrewAssy.findChild(nema23).placement,
    to: otherSide(topPlacement),
  },
  {
    from: shortScrewAssy.findChild(bf12).placement,
    to: otherSide(towerPlatePlacement),
  },
);

tower.addChild(shortScrewAssy, screwPlacement);

const minimalTop = new ShelfMaker(topPlacement, { woodThickness })
  .addFlatPart(locatedFrontPlate)
  .addFlatPart(tower.findChild(rightSideSupport))
  .addFlatPart(tower.findChild(leftSideSupport))
  .addFeature(motorSideClearance, tower.findChild(nema23).placement)
  .addSingleSideOfPart(rightRailSupport, true, true)
  .addSingleSideOfPart(leftRailSupport, false, true)
  .make();

top.assignOutsidePath(minimalTop);

joinParts(tower, top, railBase, centeredBolt);
joinParts(tower, top, otherRailBase, centeredBolt);

fastenSubpartToFlatPart(
  tower,
  bf12,
  frontPlate,
  bkfTopHoleFinder,
  getFastenerKit,
);
fastenSubpartToFlatPart(
  tower,
  bk12,
  frontPlate,
  bkfTopHoleFinder,
  getFastenerKit,
);
const fasteners = fastenSubpartToFlatPart(
  tower,
  nema23,
  top,
  motorHolesGetter,
  getFastenerKit,
).filter((x, i) => i % 2 === 1);
clearBoltOnFlatPart3(tower, frontPlate, fasteners, { depth: 15 });

const motorCenterOnSupport = locateOriginOnFlatPart(
  tower,
  top,
  screwAssy.findChild(nema23).child,
);
top.addInsides(motorCenteringHole.translate(motorCenterOnSupport));

joinParts(tower, frontPlate, top, centeredBolt, centeredBolt);
joinParts(tower, rightSideSupport, top, centeredBolt);
joinParts(tower, leftSideSupport, top, centeredBolt);
joinParts(tower, rightSideSupport, middle, [cnf(0.7)]);
joinParts(tower, leftSideSupport, middle, [cnf(0.7)]);

const headPlacement = tower
  .findChild(shortFlatRail)
  .placement.multiply(head.findChild(flatChariot).placement.inverse());

tower.addChild(head, headPlacement.translate(0, 0, zPosition));
