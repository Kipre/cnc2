// @ts-check

import { x2, x3, zero2, zero3 } from "./cade/lib/defaults.js";
import { FlatPart, getFacePlacement, joinParts } from "./cade/lib/flat.js";
import { Assembly } from "./cade/lib/lib.js";
import { ShelfMaker } from "./cade/lib/shelf.js";
import { TenonMortise } from "./cade/lib/slots.js";
import { placeAlong } from "./cade/tools/2d.js";
import { Path } from "./cade/tools/path.js";
import { a2m } from "./cade/tools/transform.js";
import { joinOffset, roundingRadius, woodThickness } from "./dimensions.js";
import { btbLayout, CylinderNutFastener } from "./fasteners.js";

const tm = (x) => new TenonMortise(x);
const cnf = (x) => new CylinderNutFastener(x);

const width = 150;
const height = 100;
const length = 200;

const sidePath = Path.makeRect(length, height);

const side = new FlatPart("side", woodThickness, sidePath);

export const box = new Assembly("box");

const locatedSide1 = box.addChild(side, a2m(zero3, x3));
const locatedSide2 = box.addChild(side.clone(), a2m([width, 0, 0], x3));

const bottomLocation = a2m([0, 0, joinOffset]);
const bottomPath = new ShelfMaker(bottomLocation, { woodThickness })
  .addFlatPart(locatedSide1)
  .addFlatPart(locatedSide2)
  .make();

const bottom = new FlatPart("bottom", woodThickness, bottomPath);
const locatedBottom = box.addChild(bottom, bottomLocation);

const extremaLocation = getFacePlacement(bottom, zero2, x2);
let extremaPath = new ShelfMaker(extremaLocation, {
  woodThickness,
  joinOffset,
})
  .addFlatPart(locatedSide1)
  .addFlatPart(locatedSide2)
  .addFlatPart(locatedBottom)
  .make();

const [, p1, , p2] = extremaPath.getSegmentAt(4);
const topCenter = placeAlong(p1, p2, { fraction: 0.5 });
const handle = Path.makeRoundedRect(80, 21, roundingRadius)
  .recenter()
  .translate(topCenter);

extremaPath.roundFilletAll(roundingRadius);
extremaPath = extremaPath.realBooleanUnion(handle.offset(10));

const end = new FlatPart("end", woodThickness, extremaPath);
end.addInsides(handle);
const locatedFront = box.addChild(end, extremaLocation);
const locatedBack = box.addChild(
  end.clone(),
  extremaLocation.translate(0, 0, -woodThickness - length),
);

joinParts(box, bottom, side, btbLayout(5));
joinParts(box, bottom, locatedSide2.child, btbLayout(5));
joinParts(box, bottom, end, btbLayout(3));
joinParts(box, bottom, locatedBack.child, btbLayout(3));
joinParts(box, side, end, [cnf(0.2), tm(0.5)]);
joinParts(box, side, locatedBack.child, [cnf(0.8), tm(0.5)]);
joinParts(box, locatedSide2.child, end, [cnf(0.2), tm(0.5)]);
joinParts(box, locatedSide2.child, locatedBack.child, [cnf(0.8), tm(0.5)]);



