// @ts-check
/** @import * as types from './cade/tools/types' */

import { railToScrewPlacement } from "./assemblyInvariants.js";
import { FlatPart, getFacePlacement, joinParts } from "./cade/lib/flat.js";
import { Assembly } from "./cade/lib/lib.js";
import {
  CenterDrawerSlot,
  TenonMortise,
  TroughAngleSupport,
} from "./cade/lib/slots.js";
import {
  nx2,
  nx3,
  ny2,
  ny3,
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
  interFlatRail,
  joinOffset,
  motorSupportWidth,
  roundingRadius,
  woodThickness,
  zRailLength,
} from "./dimensions.js";
import { CylinderNutFastener, getFastenerKit, getHexAndBarrelNut, getHexFastener } from "./fasteners.js";
import {
  flatChariot,
  flatChariotHolesIterator,
  flatChariotLength,
  flatChariotWidth,
  flatRailHolesIterator,
  flatRailTotalHeight,
  shortFlatRail,
} from "./flatRails.js";
import { nema23 } from "./motor.js";
import { boltThreadedSubpartToFlatPart, fastenSubpartToFlatPartEdge } from "./cade/lib/fastening.js";
import {
  baseSurfaceToRollerSurface,
  bf12,
  roller,
  rollerContactSurface,
  rollerHoleFinder,
  rollerThickness,
  shaftY,
  shortScrewAssy,
} from "./screw.js";
import { makeShelfOnPlane, ShelfMaker } from "./cade/lib/shelf.js";

const tm = (x) => new TenonMortise(x);
const cnf = (x) => new CylinderNutFastener(x);

const frontPlateHeight = zRailLength;
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
const bottomHang = 5 + woodThickness;
for (const x of [-interChariot / 2, interChariot / 2 - flatChariotLength]) {
  for (const y of [0, interFlatRail]) {
    tower.addChild(
      flatChariot,
      a2m(
        [
          flatRailTotalHeight,
          -woodThickness + bottomHang + flatChariotWidth / 2 + y,
          x,
        ],
        z3,
        y3,
      ),
    );
  }
}

boltThreadedSubpartToFlatPart(
  tower,
  flatChariot,
  frontPlate,
  flatChariotHolesIterator, 
  getFastenerKit,
);

const backPlateWidth = 100;
const backPlate = new FlatPart(
  "tower back plate",
  woodThickness,
  Path.makeRect(backPlateWidth, aluExtrusionHeight * 1.5).recenter({
    onlyX: true,
  }),
);

const plateToPlate =
  shaftY +
  rollerThickness / 2 +
  aluExtrusionThickness +
  1 +
  flatRailTotalHeight +
  woodThickness;

const backplatePlacement = towerPlatePlacement.translate(
  0,
  -woodThickness,
  -plateToPlate,
);
tower.addChild(backPlate, backplatePlacement);

function otherSide(placement, other = false) {
  return placement.multiply(a2m([0, 0, woodThickness], other ? nz3 : z3));
}

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
  Path.makeRect(railBottom, frontPlateHeight),
);
const railBasePlacement = a2m(
  [-woodThickness, 0, woodThickness / 2],
  nz3,
  nx3,
);
railSupport.addChild(railBase, railBasePlacement);
const rightRailSupport = tower.findChild(railBase);

const shortRailPlacement = locateWithConstraints({
  from: a2m(zero3, y3),
  to: getFacePlacement(railBase, zero2, ny2),
})
  .rotate(0, 90)
  .translate(woodThickness / 2);

railSupport.addChild(shortFlatRail, railBasePlacement.multiply(shortRailPlacement));

function* shortRailFasteners() {
  let i = 0;
  for (const hole of flatRailHolesIterator(zRailLength)()) {
    if (![0, 3, 5, 8, 10, 13].includes(i++)) continue;
    yield hole;
  }
}
fastenSubpartToFlatPartEdge(railSupport, shortFlatRail, railBase, shortRailFasteners, getHexAndBarrelNut);


const otherSupport = railSupport.clone();
const otherRailBase = otherSupport.forkChild(railBase);
tower.addChild(otherSupport, a2m([0, 0, railOffcenter]));
const leftRailSupport = tower.findChild(otherRailBase);


const screwAxisPlacement = tower
  .findChild(flatChariot)
  .placement.multiply(railToScrewPlacement);
const screwPoint = transformPoint3(screwAxisPlacement, zero3);

const rollerPlacement = otherSide(backplatePlacement, true)
  .translate(0, -screwPoint[1])
  .multiply(rollerContactSurface.rotate(90).inverse());

tower.addChild(roller, rollerPlacement);
boltThreadedSubpartToFlatPart(tower, roller, backPlate, rollerHoleFinder, getFastenerKit);

const joinPath = new ShelfMaker(bottomPlateLocation, {
  woodThickness,
  zonePoint: [-100, 0],
})
  .addFlatPart(tower.findChild(frontPlate))
  .addFlatPart(tower.findChild(backPlate))
  .addFlatPart(rightRailSupport)
  .addFlatPart(leftRailSupport)
  .make();

const bottom = new FlatPart("tower bottom join", woodThickness, joinPath);

const centeredBolt = [cnf(0.5)];
const triple = [cnf(0.8), tm(0.5), cnf(0.2)];
// const quint = [cnf(0.1), tm(0.3), cnf(0.5), tm(0.7), cnf(0.9)];

tower.addChild(bottom, bottomPlateLocation);
joinParts(tower, bottom, backPlate, [
  cnf(0.2),
  new CenterDrawerSlot(0.5, true),
  cnf(0.8),
]);
joinParts(tower, backPlate, bottom, centeredBolt);

joinParts(tower, frontPlate, bottom, [
  cnf(0.1),
  new CenterDrawerSlot(0.5, false, 100),
  cnf(0.9),
]);
joinParts(tower, bottom, frontPlate, centeredBolt);

const middleJoinLocation = a2m([0, aluExtrusionHeight + bottomHang + 5, 0], y3);
const middlePlatePath = makeShelfOnPlane(
  middleJoinLocation,
  { woodThickness, joinOffset },
  tower.findChild(frontPlate),
  tower.findChild(backPlate),
);
const middle = new FlatPart(
  "tower middle join",
  woodThickness,
  middlePlatePath,
);
const locatedMiddle = tower.addChild(middle, middleJoinLocation);

joinParts(tower, middle, frontPlate, [
  new TroughAngleSupport(locatedMiddle, leftRailSupport, true),
  cnf(0.35), cnf(0.65),
  new TroughAngleSupport(locatedMiddle, rightRailSupport),
]);
joinParts(tower, middle, backPlate, triple);

for (const part of [railBase, otherRailBase]) {
  joinParts(tower, middle, part, centeredBolt);
  const side = part === railBase;
  joinParts(tower, part, frontPlate, [
    cnf(0.15),
    new CenterDrawerSlot(0.3, side),
    cnf(0.48),
    cnf(0.65),
    new CenterDrawerSlot(0.8, side, 50),
    cnf(0.91),
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
const locatedRightSide = tower.addChild(rightSideSupport, rightSupportPlacement);
tower.addChild(
  leftSideSupport,
  rightSupportPlacement.translate(0, 0, -backPlateWidth - woodThickness),
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
  .addFeature(
    Path.makeRect(motorSupportWidth).recenter(),
    tower.findChild(nema23).placement,
  )
  .addFlatPart(rightRailSupport)
  .addFlatPart(leftRailSupport)
  .make();
top.assignOutsidePath(minimalTop);
