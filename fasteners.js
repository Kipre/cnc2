// @ts-check
/** @import * as types from '../tools/types' */

import { nz3, x3, zero2 } from "./cade/lib/defaults.js";
import { FlatPart } from "./cade/lib/flat.js";
import { Assembly } from "./cade/lib/lib.js";
import { metalMaterial } from "./cade/lib/materials.js";
import { cut, extrusion, fuse } from "./cade/lib/operations.js";
import { Part } from "./cade/lib/part.js";
import { BaseSlot, TenonMortise } from "./cade/lib/slots.js";
import { minus, placeAlong, rotatePoint } from "./cade/tools/2d.js";
import { Path } from "./cade/tools/path.js";
import { a2m } from "./cade/tools/transform.js";

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

const head = extrusion(a2m(), headThickness, headPath);
const shank = extrusion(
  a2m([0, 0, headThickness]),
  shankLength,
  Path.makeCircle(D / 2),
);

export const bolt = new Part("m6 bolt", fuse(head, shank));
bolt.material = metalMaterial;

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
cylinderNut.material = metalMaterial;

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
washer.material = metalMaterial;

export const m6Fastener = new Assembly("fastener");
m6Fastener.addChild(bolt, a2m([0, 0, -headThickness - washerThickness]));
m6Fastener.addChild(washer, a2m([0, 0, -washerThickness]));
m6Fastener.addChild(cylinderNut, a2m([0, 0, 30]));
m6Fastener.symmetries = [0, 0, NaN];

export class CylinderNutFastener extends BaseSlot {
  /**
   * @param {number} x
   */
  constructor(x, offset = 10) {
    super(x);
    this.offset = offset;

    const holeRadius = 7 / 2;
    this.nutRadius = 10.2 / 2;

    this.boltHole = Path.makeCircle(holeRadius);
    this.nutHole = Path.makeCircle(this.nutRadius);
  }

  /**
   * @param {FlatPart} part
   * @param {number} segmentIdx
   * @param {types.Point} location
   * @param {types.Point} vector
   */
  materialize(part, segmentIdx, location, vector) {
    const center = rotatePoint(
      location,
      placeAlong(location, vector, { fromStart: this.offset + this.nutRadius }),
      -Math.PI / 2,
    );

    part.addInsides(this.nutHole.translate(center));

    return { path: this.boltHole, fastener: m6Fastener };
  }
}

/**
 * @param {number} length
 */
export function defaultSlotLayout(length) {
  const slots = [];

  const nbFasteners = Math.ceil(length / 250);
  const offset = 70;
  const fastenerPitch = (length - 2 * offset) / (nbFasteners - 1);

  let lastLocation = offset;

  slots.push(new CylinderNutFastener(lastLocation));

  for (let i = 1; i < nbFasteners; i++) {
    const location = offset + i * fastenerPitch;

    slots.push(new TenonMortise((lastLocation + location) / 2));
    slots.push(new CylinderNutFastener(location));

    lastLocation = location;
  }

  return slots;
}
