// @ts-check

import { ny3, y2, zero2 } from "./cade/lib/defaults.js";
import {
  FlatPart,
  spindleClearedLineTo,
} from "./cade/lib/flat.js";
import { Assembly } from "./cade/lib/lib.js";
import { makeTenon } from "./cade/lib/slots.js";
import { computeVectorAngle, minus, placeAlong } from "./cade/tools/2d.js";
import { Path } from "./cade/tools/path.js";
import { debugGeometry } from "./cade/tools/svg.js";
import { a2m } from "./cade/tools/transform.js";
import {
  openArea,
  woodThickness,
  xRailSupportWidth,
  zAxisTravel,
  defaultSpindleSize,
  joinOffset,
  bridgeTop,
  joinWidth,
  motorSupportWidth,
  motorSupportHeight,
  roundingRadius,
  screwShaftZ,
  motorSpaceDepth,
  bfkSupportExtension,
  mediumClearance,
  motorCouplerDiameter,
  motorCenteringCylinderDiameter,
} from "./dimensions.js";


const halfBridgeMaker = (enlargement = 0) => {
  const p = new Path();
  p.moveTo([xRailSupportWidth + openArea.x / 2, openArea.z]);
  p.lineTo([xRailSupportWidth - enlargement, openArea.z]);
  spindleClearedLineTo(
    p,
    [xRailSupportWidth - enlargement, 0],
    defaultSpindleSize / 2,
    true,
  );
  p.lineTo([0, 0]);
  p.lineTo([0, bridgeTop]);
  p.lineTo([xRailSupportWidth + openArea.x / 2, bridgeTop]);
  p.fillet(100);
  p.close();
  return p;
};

const innerBridgePath = halfBridgeMaker(woodThickness);
export const innerBridge = new FlatPart(
  "inner bridge",
  woodThickness,
  innerBridgePath,
);

export const secondInnerBridge = new FlatPart(
  "second inner bridge",
  woodThickness,
  innerBridgePath.clone(),
);

const outerBridgePath = halfBridgeMaker(-joinOffset);
export const outerBridge = new FlatPart(
  "outer bridge",
  woodThickness,
  outerBridgePath,
);

export const secondOuterBridge = new FlatPart(
  "second outer bridge",
  woodThickness,
  outerBridgePath.clone(),
);


const [idx] = innerBridge.outside.findSegmentsOnLine(zero2, y2);
const motorSupport = makeTenon(motorSupportWidth, motorSupportHeight, defaultSpindleSize, roundingRadius);
innerBridge.outside.insertFeature(motorSupport, idx, { fromStart: screwShaftZ });

innerBridge.addInsides(Path.makeCircle(motorCenteringCylinderDiameter / 2).translate([motorSupportWidth / 2 - motorSupportHeight, screwShaftZ]));

const bf12Support = makeTenon(motorSupportWidth, bfkSupportExtension, defaultSpindleSize, 3);
secondInnerBridge.outside.insertFeature(bf12Support, idx, { fromStart: screwShaftZ });

const [idx2] = outerBridge.outside.findSegmentsOnLine(zero2, y2);

const motorClearance = new Path();
motorClearance.moveTo([-motorSupportWidth / 2, 0]);
motorClearance.lineTo([-motorSupportWidth / 2, motorSpaceDepth]);
motorClearance.arcTo([0, motorSpaceDepth], roundingRadius);
motorClearance.mirror(zero2, y2);

outerBridge.outside.insertFeature(motorClearance, idx2, { fromStart: screwShaftZ });


const serviceHoleDiameter = 60;
const serviceAccess = new Path();
serviceAccess.moveTo([-serviceHoleDiameter / 2, 0]);
serviceAccess.arc([serviceHoleDiameter / 2, 0], serviceHoleDiameter / 2, 1);
const [idx3] = secondOuterBridge.outside.findSegmentsOnLine(zero2, y2);
secondOuterBridge.outside.insertFeature(serviceAccess, idx3, { fromStart: screwShaftZ });


const closer = a2m([0, woodThickness, 0], ny3);
const farther = a2m([0, -joinWidth, 0], ny3);

export const bridge = new Assembly("bridge");
bridge.addChild(innerBridge, closer);
bridge.addChild(outerBridge, farther);

export const secondBridge = new Assembly("second bridge");
secondBridge.addChild(secondInnerBridge, farther);
secondBridge.addChild(secondOuterBridge, closer);
