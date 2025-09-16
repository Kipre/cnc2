// @ts-check

import { Path } from "./cade/tools/path.js";
import { nx3, ny3, x3, y3, z3, zero3, zero2, x2, nz3 } from "./cade/lib/defaults.js";
import { rotatePoint } from "./cade/tools/2d.js";
import { debugGeometry } from "./cade/tools/svg.js";
import { a2m } from "./cade/tools/transform.js";
import { cut, extrusion, fuse } from "./cade/lib/operations.js";
import { Part } from "./cade/lib/part.js";

const D = 6.0; // nominal major diameter (mm)
const pitch = 1.0; // mm (M6 coarse)
const threadHeight = 0.5 * pitch; // approx thread height
const shankLength = 35.0; // mm overall shank length
const headAcrossFlats = 10.0; // mm typical for M6 hex head
const headThickness = 4.0; // mm
const extraHeadChamfer = 0.5; // small chamfer under head
const threadLength = shankLength - headThickness - 1.0; // leave some unthreaded under head


const headPath = Path.fromPolyline(
  Array.from({ length: 6 }, (_, i) =>
    rotatePoint(zero2, [headAcrossFlats / 2, 0], (i * 2 * Math.PI) / 6),
  ),
);
debugGeometry(headPath);

const head = extrusion(a2m(), headThickness, headPath);
const shank = extrusion(
  a2m([0, 0, headThickness]),
  shankLength,
  Path.makeCircle(D / 2),
);

export const bolt = new Part("m6 bolt", fuse(head, shank));

const cylinderLength = 13;
export const cylinderDiameter = 10;

const cylinder = extrusion(
  a2m([-cylinderLength / 2, 0, 0], x3, nz3),
  cylinderLength,
  Path.makeCircle(cylinderDiameter / 2),
);

const hole = extrusion(
  a2m([0, 0, -cylinderDiameter]),
  cylinderDiameter * 2,
  Path.makeCircle(D / 2),
);

export const cylinderNut = new Part("m6 cylinder nut", cut(cylinder, hole));

const washerThickness = 1;
const washerOuter = 13.72;
const washerInner = 6.1;

const washerShape = extrusion(
  a2m(),
  washerThickness,
  Path.makeCircle(washerOuter / 2),
  Path.makeCircle(washerInner / 2),
);

export const washer = new Part("m6 washer", washerShape);
