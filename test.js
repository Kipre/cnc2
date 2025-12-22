// @ts-check

import { x2, x3, y3, z3, zero2, zero3 } from "./cade/lib/defaults.js";
import { FlatPart, getFacePlacement, joinParts } from "./cade/lib/flat.js";
import { Assembly } from "./cade/lib/lib.js";
import { ShelfMaker } from "./cade/lib/shelf.js";
import { TenonMortise } from "./cade/lib/slots.js";
import { placeAlong } from "./cade/tools/2d.js";
import { Path } from "./cade/tools/path.js";
import { a2m } from "./cade/tools/transform.js";
import { roundingRadius, woodThickness } from "./dimensions.js";
import { btbLayout, CylinderNutFastener } from "./fasteners.js";

const tm = (x) => new TenonMortise(x);
const cnf = (x) => new CylinderNutFastener(x);

const width = 150;
const height = 300;

const page = new FlatPart(
  "page",
  woodThickness,
  Path.makeRect(width, height).recenter({ onlyX: true }),
);

export const box = new Assembly("box");

const locatedPage = box.addChild(page);

const join = new FlatPart(
  "join",
  woodThickness,
  Path.makeRect(50, 100).recenter({ onlyY: true }),
);
const joinOffset = 35;

for (let i = 0; i < 5; i++) {
  const located = box.addChild(
    join.clone(i),
    a2m([0, 20 + i * joinOffset, woodThickness], y3, z3),
  );
  joinParts(box, located.child, page, [
    new TenonMortise(0.25, {spindleDiameter: 6.2,  clearance: i * 0.4}),
    new TenonMortise(0.75, {spindleDiameter: 6.2,  clearance: i * 0.4}),
  ]);
}
