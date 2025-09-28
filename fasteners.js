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

const washerThickness = 1;

const isoFastenerSizes = {
  M3: {
    headSize: 5.5,
    pitch: 0.5,
    diameter: 3,
    boltHeadThickness: 2,
    nutThickness: 2.4,
    washerOuterDiameter: 7,
    washerInnerDiameter: 3.2,
  },
  M4: {
    headSize: 7,
    pitch: 0.7,
    diameter: 4,
    boltHeadThickness: 2.8,
    nutThickness: 3.2,
    washerOuterDiameter: 9,
    washerInnerDiameter: 4.3,
  },
  M5: {
    headSize: 8,
    pitch: 0.8,
    diameter: 5,
    boltHeadThickness: 3.5,
    nutThickness: 4,
    washerOuterDiameter: 10,
    washerInnerDiameter: 5.3,
  },
  M6: {
    headSize: 10,
    pitch: 1,
    diameter: 6,
    boltHeadThickness: 4,
    nutThickness: 5,
    washerOuterDiameter: 12,
    washerInnerDiameter: 6.4,
  },
  M8: {
    headSize: 13,
    pitch: 1.25,
    diameter: 8,
    boltHeadThickness: 5.3,
    nutThickness: 6.5,
    washerOuterDiameter: 16,
    washerInnerDiameter: 8.4,
  },
};

/**
 * @param {"M3" | "M4" | "M5" | "M6" | "M8"} size
 * @param {number} length
 */
function makeBolt(size, length) {
  const { diameter, headSize, boltHeadThickness } = isoFastenerSizes[size];
  const headPath = Path.fromPolyline(
    Array.from({ length: 6 }, (_, i) =>
      rotatePoint(zero2, [headSize / 2, 0], (i * 2 * Math.PI) / 6),
    ),
  );

  const head = extrusion(
    a2m([0, 0, -washerThickness - boltHeadThickness]),
    boltHeadThickness,
    headPath,
  );
  const shank = extrusion(
    a2m([0, 0, -washerThickness]),
    length,
    Path.makeCircle(diameter / 2),
  );

  const bolt = new Part(`${size} bolt`, fuse(head, shank));
  bolt.material = metalMaterial;
  bolt.symmetries = [0, 0, NaN];
  return bolt;
}

/**
 * @param {"M3" | "M4" | "M5" | "M6" | "M8"} size
 */
function makeNut(size) {
  const { diameter, headSize, nutThickness } = isoFastenerSizes[size];
  const headPath = Path.fromPolyline(
    Array.from({ length: 6 }, (_, i) =>
      rotatePoint(zero2, [headSize / 2, 0], (i * 2 * Math.PI) / 6),
    ),
  );

  const head = extrusion(
    a2m([0, 0, -washerThickness - nutThickness]),
    nutThickness,
    headPath,
    Path.makeCircle(diameter / 2),
  );

  const nut = new Part(`${size} nut`, head);
  nut.material = metalMaterial;
  nut.symmetries = [0, 0, NaN];
  return nut;
}

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
  Path.makeCircle(6 / 2),
);

export const cylinderNut = new Part("m6 cylinder nut", cut(cylinder, hole));
cylinderNut.material = metalMaterial;

/**
 * @param {"M3" | "M4" | "M5" | "M6" | "M8"} size
 */
function makeWasher(size) {
  const { washerOuterDiameter, washerInnerDiameter } = isoFastenerSizes[size];

  const washerShape = extrusion(
    a2m([0, 0, -washerThickness]),
    washerThickness,
    Path.makeCircle(washerOuterDiameter / 2).invert(),
    Path.makeCircle(washerInnerDiameter / 2),
  );

  const washer = new Part(`${size} washer`, washerShape);
  washer.material = metalMaterial;
  washer.symmetries = [0, 0, NaN];
  return washer;
}

export const m6Washer = makeWasher("M6");
export const m5Washer = makeWasher("M5");

export const m6Bolt = makeBolt("M6", 35);
export const m5Bolt = makeBolt("M5", 30);

export const m5Nut = makeNut("M5");

export const m6Fastener = new Assembly("fastener");
m6Fastener.addChild(m6Bolt);
m6Fastener.addChild(m6Washer);
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
