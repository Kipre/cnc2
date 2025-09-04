// @ts-check

import { Assembly, FlatPart } from "./cade/lib/lib.js";
import {
  BaseSlot,
  CylinderNutFastener,
  defaultSlotLayout,
  TenonMortise,
} from "./cade/lib/slots.js";
import { axesArrows, nx3, ny3, x3, y3, z3, zero3 } from "./cade/lib/utils.js";
import { norm, placeAlong, plus, rotatePoint } from "./cade/tools/2d.js";
import {
  dot3,
  minus3,
  mult3,
  normalize3,
  plus3,
  proj2d,
} from "./cade/tools/3d.js";
import { Path } from "./cade/tools/path.js";
import { a2m, transformPoint3 } from "./cade/tools/transform.js";
import {
  openArea,
  woodThickness,
  xRailSupportWidth,
  zAxisTravel,
} from "./dimensions.js";

const bridgeTopThickness = zAxisTravel;
const bridgeTop = openArea.z + bridgeTopThickness;
const joinOffset = 10;
const bridgeJoinWidth = 100 - 2 * woodThickness;

const bridgeFormation = (p, enlargement = 0) => {
  p.moveTo([xRailSupportWidth + openArea.y / 2, openArea.z]);
  p.lineTo([xRailSupportWidth - enlargement, openArea.z]);
  p.lineTo([xRailSupportWidth - enlargement, 0]);
  p.lineTo([0, 0]);
  p.lineTo([0, bridgeTop]);
  p.lineTo([xRailSupportWidth + openArea.y / 2, bridgeTop]);
  p.fillet(100);
  p.mirror();
  return p;
};

const innerBridgePath = bridgeFormation(new Path(), woodThickness);
const innerBridge = new FlatPart(innerBridgePath);

const outerBridge = new FlatPart(bridgeFormation(new Path(), -joinOffset));

const tunnelPath = new Path();
tunnelPath.moveTo([bridgeJoinWidth + openArea.x / 2, 0]);
tunnelPath.lineTo([0, 0]);
tunnelPath.lineTo([0, bridgeTop]);
tunnelPath.lineTo([bridgeJoinWidth, bridgeTop]);
tunnelPath.lineTo([bridgeJoinWidth, openArea.z]);
tunnelPath.lineTo([bridgeJoinWidth + openArea.x / 2, openArea.z]);
tunnelPath.mirror();

const tunnel = new FlatPart(tunnelPath);

function addSimpleReinforcingJoin(part1, part2, l1, l2, width, thickness) {
//   const cutouts = [];
//   const joinCutouts = [];
//
//   const length = norm(l2, l1);
//   const nbFasteners = Math.ceil(length / 250);
//   const offset = 50;
//   const fastenerPitch = (length - 2 * offset) / (nbFasteners - 1);
//
//   const joinPartPath = new Path();
//   joinPartPath.moveTo([0, width / 2]);
//
//   const firstBolt = placeAlong(l1, l2, { fromStart: offset });
//   cutouts.push(fastenerHole.translate(firstBolt));
//   joinCutouts.push(nutHole.translate([offset, width / 2]));
//   joinCutouts.push(nutHole.translate([offset, width / 2]).scale(1, -1));
//
//   let lastLocation = offset;
//
//   for (let i = 1; i < nbFasteners; i++) {
//     const location = offset + i * fastenerPitch;
//
//     const nextBolt = placeAlong(l1, l2, { fromStart: location });
//     cutouts.push(fastenerHole.translate(nextBolt));
//     joinCutouts.push(nutHole.translate([location, width / 2]));
//     joinCutouts.push(nutHole.translate([location, width / 2]).scale(1, -1));
//
//     const loc = (lastLocation + location) / 2;
//     const nextMortise = placeAlong(l1, l2, { fromStart: loc });
//     cutouts.push(mortise.translate(nextMortise));
//     joinPartPath.merge(tenon.translate([loc, width / 2]));
//
//     lastLocation = location;
//   }
//
//   joinPartPath.lineTo([length, width / 2]);
//   joinPartPath.mirror([0, 0], [1, 0]);
//   joinPartPath.close();
//
//   part1.addInsides(...cutouts);
//   part2.addInsides(...cutouts);
//
//   // const joinPart = new FlatPart(joinPartPath, joinCutouts);
//   const joinPart = new FlatPart(joinPartPath);
//
//   const transform = a2m([l1[0], -width / 2 - thickness, l1[1] - thickness / 2]);
//
//   const part2Transform = a2m([0, -width - thickness, 0], ny3);
//   return [joinPart, transform, part2Transform];
}
//
// const zJoin = bridgeTop - joinOffset - woodThickness / 2;
// const [from, to] = innerBridgePath
//   .intersectLine([-10, zJoin], [2 * xRailSupportWidth + openArea.y + 10, zJoin])
//   .map((int) => int.point);
//
// const zJoin2 = openArea.z + joinOffset + woodThickness / 2;
// const [from2, to2] = innerBridgePath
//   .intersectLine(
//     [-10, zJoin2],
//     [2 * xRailSupportWidth + openArea.y + 10, zJoin2],
//   )
//   .map((int) => int.point);

// const [join, joinTransform] = addSimpleReinforcingJoin(
//   innerBridge,
//   outerBridge,
//   from,
//   to,
//   bridgeJoinWidth,
//   woodThickness,
// );
//
//
// const [join2, join2Transform, part2Transform] = addSimpleReinforcingJoin(
//   innerBridge,
//   outerBridge,
//   from2,
//   to2,
//   bridgeJoinWidth,
//   woodThickness,
// );

/**
 * @param {import("./cade/lib/lib.js").LocatedPart} toTab
 * @param {import("./cade/lib/lib.js").LocatedPart} toSlot
 * @param {BaseSlot[]} [maybeLayout]
 */
function joinParts(
  { child: toTab, placement: toTabPlacement },
  { child: toSlot, placement: toSlotPlacement },
  maybeLayout,
) {
  if (!(toTab instanceof FlatPart) || !(toSlot instanceof FlatPart))
    throw new TypeError("cannot join non flat parts");

  const tabToSlot = toSlotPlacement.inverse().multiply(toTabPlacement);
  const tts = (p) => proj2d(transformPoint3(tabToSlot, p));
  const stt = (p) => proj2d(transformPoint3(tabToSlot.inverse(), p));

  const onToTab = [stt([0, 0, 0]), stt([0, 0, woodThickness])];

  const side1 = [onToTab[0], rotatePoint(...onToTab, Math.PI / 2)];
  const side2 = [onToTab[1], rotatePoint(...onToTab.toReversed(), Math.PI / 2)];

  const segments = [
    ...toTab.outside.findSegmentsOnLine(...side1),
    ...toTab.outside.findSegmentsOnLine(...side2),
  ];

  if (segments.length !== 1)
    throw new Error("can't handle multiple slotting segments yet");

  const [segmentIdx] = segments;

  const segmentLength =
    toTab.outside.getLengthInfo().info[segmentIdx - 1].length;

  const layout = maybeLayout ?? defaultSlotLayout(segmentLength, woodThickness);

  // reversing for conserving the segment idx
  for (const slot of layout.toReversed()) {
    if (maybeLayout) slot.x = slot.x * segmentLength;
    const { path, location } = slot.materialize(toTab, segmentIdx);
    const center = tts([...location, woodThickness / 2]);
    toSlot.addInsides(path.translate(center));
  }
}

const tunnelPlacement = a2m(
  [xRailSupportWidth - woodThickness, -bridgeJoinWidth - woodThickness, 0],
  x3,
  y3,
);

export const woodenBase = new Assembly("wooden frame");

woodenBase.addChild(innerBridge, a2m(null, ny3));
woodenBase.addChild(tunnel, tunnelPlacement);
woodenBase.addChild(outerBridge, a2m([0, -bridgeJoinWidth - woodThickness, 0], ny3));
// woodenBase.addChild(join, joinTransform)
// woodenBase.addChild(join2, join2Transform);

// woodenBase.addChild(axesArrows);

const layout = [
  new CylinderNutFastener(0.2),
  new TenonMortise(0.5),
  new CylinderNutFastener(0.8),
];

joinParts(woodenBase.children[0], woodenBase.children[1], layout);
joinParts(woodenBase.children[1], woodenBase.children[0], [new CylinderNutFastener(0.3)]);

joinParts(woodenBase.children[1], woodenBase.children[2], [
  new CylinderNutFastener(0.07),
  new TenonMortise(0.25),
  new CylinderNutFastener(0.9),
]);

