// @ts-check

import { nz3, x2, x3, y2, y3, z3, zero2, zero3 } from "./cade/lib/defaults.js";
import { Assembly } from "./cade/lib/lib.js";
import { blackMetalMaterial, metalMaterial } from "./cade/lib/materials.js";
import { cut, extrusion, fuse, multiExtrusion } from "./cade/lib/operations.js";
import { Part } from "./cade/lib/part.js";
import { Path } from "./cade/tools/path.js";
import { a2m, transformPoint3 } from "./cade/tools/transform.js";
import {
  motorBodyLength,
  motorCenteringCylinderDiameter,
  motorCouplerDiameter,
  motorSide,
  motorSupportWidth,
  roundingRadius,
  woodThickness,
} from "./dimensions.js";

const side = motorSide;
const angleInset = 9;
const plateThickness = 5;
const bodyLength = motorBodyLength - plateThickness;
const interHoles = 47.14;
const centeringCylinderThickness = 1.6;
const shaftDiameter = 8;
const shaftLength = 21;

const couplerDiameter = motorCouplerDiameter;
const couplerLength = 30;
const couplerOutputDiameter = 10;
const couplerInputDiameter = shaftDiameter;
const couplerHoleDepth = 10;

const couplingDepth = couplerHoleDepth - 1;

const bodyPath = new Path();
bodyPath.moveTo([side / 2, 0]);
bodyPath.lineTo([side / 2, side / 2 - angleInset]);
bodyPath.lineTo([side / 2 - angleInset, side / 2 - angleInset]);
bodyPath.arcTo([side / 2 - angleInset, side / 2], 4);
bodyPath.lineTo([0, side / 2]);
bodyPath.mirror(zero2, y2);
bodyPath.mirror(zero2, x2);
bodyPath.roundFilletAll(1.5);

export const motorCenteringHole = Path.makeCircle(
  motorCenteringCylinderDiameter / 2,
);

const body = extrusion(a2m([0, 0, plateThickness]), bodyLength, bodyPath);
const plate = extrusion(
  a2m(),
  plateThickness,
  Path.makeRoundedRect(side, side, 4).translate([-side / 2, -side / 2]),
);
const centeringCylinder = extrusion(
  a2m(zero3, nz3),
  centeringCylinderThickness,
  motorCenteringHole,
);

const shaft = extrusion(
  a2m(zero3, nz3),
  shaftLength,
  Path.makeCircle(shaftDiameter / 2),
);

const holeDiameter = 5.2;
const holePaths = [];

const holePath = Path.makeCircle(holeDiameter / 2);

for (const xSign of [1, -1]) {
  for (const ySign of [1, -1]) {
    holePaths.push(
      holePath.translate([(xSign * interHoles) / 2, (ySign * interHoles) / 2]),
    );
  }
}

const holes = multiExtrusion(
  a2m([0, 0, -plateThickness / 2]),
  plateThickness * 2,
  ...holePaths,
);

export function* motorHolesGetter() {
  for (const path of holePaths) {
    yield { hole: path, depth: plateThickness, transform: a2m() };
  }
}

export const nema23 = new Part(
  "nema23",
  cut(fuse(body, plate, centeringCylinder, shaft), holes),
);
nema23.material = blackMetalMaterial;
// yRail.symmetries = [0, NaN, 0];

const couplerBody = extrusion(
  a2m(),
  couplerLength,
  Path.makeCircle(couplerDiameter / 2),
);

const outputHole = extrusion(
  a2m([0, 0, -couplerHoleDepth]),
  couplerHoleDepth * 2,
  Path.makeCircle(couplerOutputDiameter / 2),
);

const inputHole = extrusion(
  a2m([0, 0, couplerLength - couplerHoleDepth]),
  couplerHoleDepth * 2,
  Path.makeCircle(couplerInputDiameter / 2),
);

export const coupler = new Part(
  "10-8 coupler",
  cut(couplerBody, outputHole, inputHole),
);
coupler.material = metalMaterial;

export const motorSideClearance = Path.makeRoundedRect(
  // 2.1 * motorSide,
  1.2 * motorSide,
  1.2 * motorSide,
  roundingRadius,
)
  .recenter()

export const motorSideClearance1 = Path.makeRoundedRect(
  motorSide * 1.5,
  motorSide * 1.2,
  roundingRadius,
)
  .recenter()
  .translate([-8, 0]);

export const lengthwiseClearance = Path.makeRect(bodyLength, 1.2 * motorSide)
  .offset([woodThickness + 20, 0, 0, 0])
  .recenter({ onlyY: true });
lengthwiseClearance.roundFilletAll(roundingRadius);

export const motorWithCoupler = new Assembly("motor with coupler");
motorWithCoupler.addChild(coupler, a2m([0, 0, -couplingDepth]));
motorWithCoupler.addChild(
  nema23,
  a2m([0, 0, couplerLength - 2 * couplingDepth + shaftLength]),
);
motorWithCoupler.symmetries = [0, 0, NaN];
