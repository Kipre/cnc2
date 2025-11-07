// @ts-check
/** @import * as types from '../tools/types' */

import { nz3, x3, zero2 } from "./cade/lib/defaults.js";
import { FlatPart } from "./cade/lib/flat.js";
import { Assembly } from "./cade/lib/lib.js";
import { metalMaterial } from "./cade/lib/materials.js";
import { cut, extrusion, fuse } from "./cade/lib/operations.js";
import { Part } from "./cade/lib/part.js";
import { BaseSlot, CenterDrawerSlot, TenonMortise } from "./cade/lib/slots.js";
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
    lengths: [5, 6, 8, 10, 12, 16, 20, 25, 30, 35, 40, 50],
  },
  M4: {
    headSize: 7,
    pitch: 0.7,
    diameter: 4,
    boltHeadThickness: 2.8,
    nutThickness: 3.2,
    washerOuterDiameter: 9,
    washerInnerDiameter: 4.3,
    lengths: [6, 8, 10, 12, 14, 16, 18, 20, 25, 30, 35, 40, 45, 50, 55, 60],
  },
  M5: {
    headSize: 8,
    pitch: 0.8,
    diameter: 5,
    boltHeadThickness: 3.5,
    nutThickness: 4,
    washerOuterDiameter: 10,
    washerInnerDiameter: 5.3,
    lengths: [
      6, 8, 10, 12, 14, 16, 18, 20, 22, 25, 30, 35, 40, 45, 50, 55, 60, 70, 100,
    ],
  },
  M6: {
    headSize: 10,
    pitch: 1,
    diameter: 6,
    boltHeadThickness: 4,
    nutThickness: 5,
    washerOuterDiameter: 12,
    washerInnerDiameter: 6.4,
    lengths: [
      8, 10, 12, 14, 16, 18, 20, 22, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75,
      80, 90, 100, 110, 130, 150,
    ],
  },
  M8: {
    headSize: 13,
    pitch: 1.25,
    diameter: 8,
    boltHeadThickness: 5.3,
    nutThickness: 6.5,
    washerOuterDiameter: 16,
    washerInnerDiameter: 8.4,
    lengths: [
      8, 10, 12, 14, 16, 18, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80,
      90, 100, 110, 120, 140, 150, 180,
    ],
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

  const bolt = new Part(`${size} bolt ${length}`, fuse(head, shank));
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

const m6hole = extrusion(
  a2m([0, 0, -cylinderDiameter]),
  cylinderDiameter * 2,
  Path.makeCircle(6 / 2),
);

const m5hole = extrusion(
  a2m([0, 0, -cylinderDiameter]),
  cylinderDiameter * 2,
  Path.makeCircle(5 / 2),
);

export const cylinderNut = new Part("m6 cylinder nut", cut(cylinder, m6hole));
cylinderNut.material = metalMaterial;

export const m5CylinderNut = new Part("m5 cylinder nut", cut(cylinder, m5hole));
m5CylinderNut.material = metalMaterial;

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

const bolts = {};
const rest = {};

export function getFastenerKit(size, length, addLengthForNut = true) {
  let mSize = "M3";
  if (size > 4) mSize = "M4";
  if (size > 5) mSize = "M5";
  if (size > 6) mSize = "M6";
  if (size > 8) mSize = "M8";
  if (size > 9 || size < 3)
    throw new Error("we don't have bolts this size yet");

  const iso = isoFastenerSizes[mSize];
  let requiredLength = length;
  if (addLengthForNut) requiredLength += 2 + iso.nutThickness + 3;

  const availableLength = iso.lengths.find((x) => x >= requiredLength);
  const key = `${mSize}_${availableLength}`;

  let bolt = bolts[key];
  if (bolt == null) {
    bolt = makeBolt(mSize, availableLength);
    bolts[key] = bolt;
  }

  if (!(mSize in rest)) {
    const nut = makeNut(mSize);
    const washer = makeWasher(mSize);
    rest[mSize] = { nut, washer };
  }

  return { ...rest[mSize], bolt };
}

export const {
  washer: m5Washer,
  nut: m5Nut,
  bolt: m5Bolt,
} = getFastenerKit(5.3, 22);
export const {
  washer: m6Washer,
  nut: m6Nut,
  bolt: m6Bolt,
} = getFastenerKit(6.3, 26);

// export const m6Washer = makeWasher("M6");
// export const m6Bolt = makeBolt("M6", 35);

export const m6BoltAndBarrelNut = new Assembly("fastener");
m6BoltAndBarrelNut.addChild(m6Bolt);
m6BoltAndBarrelNut.addChild(m6Washer);
m6BoltAndBarrelNut.addChild(cylinderNut, a2m([0, 0, 30]));
m6BoltAndBarrelNut.symmetries = [0, 0, NaN];

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
   * @param {number} place
   */
  materialize(part, segmentIdx, place) {
    const path = part.outside;
    const line = path.subpath(segmentIdx, 0, segmentIdx, 1);
    const [, start1, , end1] = line
      .offset(-this.offset - this.nutRadius)
      .getSegmentAt(1);

    const center1 = placeAlong(start1, end1, { fromStart: place });

    const barrelHole = this.nutHole.translate(center1);
    part.addInsides(barrelHole);

    return { path: this.boltHole, fastener: m6BoltAndBarrelNut };
  }
}

/**
 * @param {number} length
 */
export function defaultSlotLayout(length) {
  const offset = 70;
  if (length < 2 * offset) {
    const err = new Error("overlap too short for a default layout");
    console.warn(err);
  }
  const slots = [];

  const nbFasteners = Math.ceil(length / 250);
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
