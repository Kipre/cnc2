// @ts-check

import { ny3, y2, zero2 } from "./cade/lib/defaults.js";
import { FlatPart, spindleClearedLineTo } from "./cade/lib/flat.js";
import { Assembly } from "./cade/lib/lib.js";
import { makeTenon } from "./cade/lib/slots.js";
import { Path } from "./cade/tools/path.js";
import { a2m } from "./cade/tools/transform.js";
import {
  bfkSupportExtension,
  bridgeHeight,
  bridgeTop,
  defaultSpindleSize,
  joinOffset,
  joinWidth,
  motorSpaceDepth,
  motorSupportWidth,
  openArea,
  roundingRadius,
  tunnelWidth,
  woodThickness,
  xOverwidth,
} from "./dimensions.js";

const halfBridge = tunnelWidth + openArea.x / 2 + xOverwidth;
export const bridgeCenter = halfBridge - xOverwidth;

let bridgePath = new Path();
bridgePath.moveTo([halfBridge, bridgeHeight]);
bridgePath.lineTo([tunnelWidth, bridgeHeight]);
bridgePath.lineTo([tunnelWidth, 0]);
bridgePath.lineTo([0, 0]);
bridgePath.lineTo([0, bridgeTop]);
bridgePath.lineTo([halfBridge, bridgeTop]);
bridgePath.close();
bridgePath = bridgePath.translate([-xOverwidth, 0]);

export const innerBridge = new FlatPart(
  "inner bridge",
  woodThickness,
  bridgePath.clone(),
);

export const secondInnerBridge = new FlatPart(
  "second inner bridge",
  woodThickness,
  bridgePath.clone(),
);

export const outerBridge = new FlatPart(
  "outer bridge",
  woodThickness,
  bridgePath.clone(),
);

export const secondOuterBridge = new FlatPart(
  "second outer bridge",
  woodThickness,
  bridgePath,
);

const motorClearance = new Path();
motorClearance.moveTo([-motorSupportWidth / 2, 0]);
motorClearance.lineTo([-motorSupportWidth / 2, motorSpaceDepth]);
motorClearance.arcTo([0, motorSpaceDepth], roundingRadius);
motorClearance.mirror(zero2, y2);

const serviceHoleDiameter = 60;
const serviceAccess = new Path();
serviceAccess.moveTo([-serviceHoleDiameter / 2, 0]);
serviceAccess.arc([serviceHoleDiameter / 2, 0], serviceHoleDiameter / 2, 1);

const closer = a2m([0, woodThickness, 0], ny3);
const farther = a2m([0, -joinWidth, 0], ny3);

export const bridge = new Assembly("bridge");
bridge.addChild(innerBridge, closer);
bridge.addChild(outerBridge, farther);

export const secondBridge = new Assembly("second bridge");
secondBridge.addChild(secondInnerBridge, farther);
secondBridge.addChild(secondOuterBridge, closer);
