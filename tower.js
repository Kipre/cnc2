// @ts-check

import { railToScrewPlacement } from "./assemblyInvariants.js";
import { nx3, ny2, nz3, y3, z3, zero2, zero3 } from "./cade/lib/defaults.js";
import {
  FlatPart,
  getFacePlacement,
  joinParts,
  makeShelfOnPlane,
} from "./cade/lib/flat.js";
import { Assembly } from "./cade/lib/lib.js";
import { CenterDrawerSlot, TenonMortise } from "./cade/lib/slots.js";
import { Path } from "./cade/tools/path.js";
import { a2m, transformPoint3 } from "./cade/tools/transform.js";
import {
  aluExtrusionHeight,
  aluExtrusionThickness,
  carrierWheelbase,
  interFlatRail,
  joinOffset,
  roundingRadius,
  woodThickness,
  zRailLength,
} from "./dimensions.js";
import { CylinderNutFastener } from "./fasteners.js";
import {
  flatChariot,
  flatChariotHolesIterator,
  flatChariotLength,
  flatChariotWidth,
  flatRailTotalHeight,
} from "./flatRails.js";
import { boltThreadedSubpartToFlatPart } from "./rails.js";
import {
  roller,
  rollerContactSurface,
  rollerHoleFinder,
  rollerThickness,
  shaftY,
} from "./screw.js";

const tm = (x) => new TenonMortise(x);
const cnf = (x) => new CylinderNutFastener(x);

export const frontPlate = new FlatPart(
  "tower plate",
  woodThickness,
  Path.makeRoundedRect(carrierWheelbase, zRailLength, roundingRadius).recenter({
    onlyX: true,
  }),
);

export const towerBottomToRail = woodThickness;
export const tower = new Assembly("tower");
const towerPlatePlacement = a2m(zero3, nx3, z3);
tower.addChild(frontPlate, towerPlatePlacement);

const interChariot = carrierWheelbase;
const bottomHang = 5 + woodThickness;
for (const x of [-interChariot / 2, interChariot / 2 - flatChariotLength]) {
  for (const y of [0, interFlatRail]) {
    tower.addChild(
      flatChariot,
      a2m(
        [flatRailTotalHeight, bottomHang + flatChariotWidth / 2 + y, x],
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
);

const backPlateWidth = 100;
const backPlate = new FlatPart(
  "tower back plate",
  woodThickness,
  Path.makeRect(
    backPlateWidth,
    aluExtrusionHeight * 1.5,
    roundingRadius,
  ).recenter({
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

const backplatePlacement = towerPlatePlacement.translate(0, 0, -plateToPlate);
tower.addChild(backPlate, backplatePlacement);

function otherSide(placement) {
  return placement.multiply(a2m([0, 0, woodThickness], nz3));
}

const screwAxisPlacement = tower
  .findChild(flatChariot)
  .placement.multiply(railToScrewPlacement);
const screwPoint = transformPoint3(screwAxisPlacement, zero3);

const rollerPlacement = otherSide(backplatePlacement)
  .translate(0, -screwPoint[1])
  .multiply(rollerContactSurface.rotate(90).inverse());

tower.addChild(roller, rollerPlacement);
boltThreadedSubpartToFlatPart(tower, roller, backPlate, rollerHoleFinder);

const bottomPlateLocation = a2m([0, 1, 0], y3);
const joinPath = makeShelfOnPlane(
  bottomPlateLocation,
  { woodThickness, joinOffset },
  tower.findChild(frontPlate),
  tower.findChild(backPlate),
);
const bottom = new FlatPart("tower bottom join", woodThickness, joinPath);

const centeredBolt = [cnf(0.5)];
const triple = [cnf(0.8), tm(0.5), cnf(0.2)];

tower.addChild(bottom, bottomPlateLocation);
joinParts(tower, bottom, backPlate, [
  cnf(0.8),
  new CenterDrawerSlot(0.5),
  cnf(0.2),
]);
joinParts(tower, backPlate, bottom, centeredBolt);

joinParts(tower, bottom, frontPlate, [
  cnf(0.1),
  new CenterDrawerSlot(0.3, true),
  cnf(0.5),
  new CenterDrawerSlot(0.7, true),
  cnf(0.9),
]);
joinParts(tower, frontPlate, bottom, centeredBolt, centeredBolt);

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
tower.addChild(middle, middleJoinLocation);
joinParts(tower, middle, frontPlate, triple);
joinParts(tower, middle, backPlate, triple);

const locatedBackPlate = tower.findChild(backPlate);
const rightsidePlacement = getFacePlacement(backPlate, zero2, ny2);
const rightSupportPlacement =
  locatedBackPlate.placement.multiply(rightsidePlacement);

const verticalAngle = makeShelfOnPlane(
  rightSupportPlacement,
  { woodThickness, zoneIndex: 1 },
  tower.findChild(frontPlate),
  locatedBackPlate,
  tower.findChild(middle),
);
const rightSideSupport = new FlatPart(
  "vertical support join",
  woodThickness,
  verticalAngle,
);
tower.addChild(rightSideSupport, rightSupportPlacement);
tower.addChild(
  rightSideSupport,
  rightSupportPlacement.translate(0, 0, -backPlateWidth - woodThickness),
);


joinParts(tower, rightSideSupport, frontPlate, triple);
joinParts(tower, backPlate, rightSideSupport, centeredBolt);

