// @ts-check

import { Assembly, FlatPart } from "./cade/lib/lib.js";
import {
  BaseSlot,
  CylinderNutFastener,
  defaultSlotLayout,
  TenonMortise,
} from "./cade/lib/slots.js";
import { axesArrows, nx3, ny3, x3, y3, z3, zero3 } from "./cade/lib/utils.js";
import {
  moveLine,
  norm,
  offsetPolyline,
  placeAlong,
  rotatePoint,
} from "./cade/tools/2d.js";
import { proj2d } from "./cade/tools/3d.js";
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

function computeJoinShape(child1, child2, planeMatrix) {
  if (
    !(child1.child instanceof FlatPart) ||
    !(child2.child instanceof FlatPart)
  )
    throw new TypeError("cannot join non flat parts");

  const lines = [];
  for (const { child: part, placement } of [child1, child2]) {
    const planeToPart = placement.inverse().multiply(planeMatrix);
    const ptpart = (p) => proj2d(transformPoint3(planeToPart, p));
    const parttp = (p) => proj2d(transformPoint3(planeToPart.inverse(), p));

    const normalOnPart = [
      ptpart([0, 0, woodThickness / 2]),
      ptpart([0, 0, woodThickness]),
    ];

    const midLine = [
      normalOnPart[0],
      rotatePoint(...normalOnPart, Math.PI / 2),
    ];
    const line = part.outside.intersectLine(
      placeAlong(...midLine, { fromStart: -1e10 }),
      placeAlong(...midLine, { fromEnd: 1e10 }),
    );

    if (line.length !== 2) throw new Error();

    lines.push(line.map((p) => parttp([...p.point, woodThickness / 2])));
  }

  // correct offset from lines being in the middle of the thickness
  const [[one, two], [three, four]] = [
    offsetPolyline(lines[0], -woodThickness / 2),
    offsetPolyline(lines[1], woodThickness / 2),
  ];

  if (norm(moveLine(one, three, four), two) > 1e-6)
    throw new Error("problem with parrallelism or line orientation");

  const join = Path.fromPolyline([one, two, four, three]);
  return new FlatPart(join);
}

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
woodenBase.addChild(
  outerBridge,
  a2m([0, -bridgeJoinWidth - woodThickness, 0], ny3),
);

const layout = [
  new CylinderNutFastener(0.2),
  new TenonMortise(0.5),
  new CylinderNutFastener(0.8),
];

joinParts(woodenBase.children[0], woodenBase.children[1], layout);
joinParts(woodenBase.children[1], woodenBase.children[0], [
  new CylinderNutFastener(0.3),
]);

joinParts(woodenBase.children[1], woodenBase.children[2], [
  new CylinderNutFastener(0.07),
  new TenonMortise(0.25),
  new CylinderNutFastener(0.9),
]);

const joinMatrix = a2m([0, 0, bridgeTop - joinOffset - woodThickness]);
const join = computeJoinShape(
  woodenBase.children[0],
  woodenBase.children[2],
  joinMatrix,
);

woodenBase.addChild(join, joinMatrix);
joinParts(woodenBase.children[3], woodenBase.children[0]);
joinParts(woodenBase.children[3], woodenBase.children[2]);
