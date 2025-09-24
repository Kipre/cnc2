// @ts-check

import { ny3 } from "./cade/lib/defaults.js";
import {
  FlatPart,
  spindleClearedLineTo,
} from "./cade/lib/flat.js";
import { Assembly } from "./cade/lib/lib.js";
import { Path } from "./cade/tools/path.js";
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
} from "./dimensions.js";


const halfBridgeMaker = (p, enlargement = 0) => {
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

const innerBridgePath = halfBridgeMaker(new Path(), woodThickness);
export const innerBridge = new FlatPart(
  "inner bridge",
  woodThickness,
  innerBridgePath,
);

export const outerBridge = new FlatPart(
  "outer bridge",
  woodThickness,
  halfBridgeMaker(new Path(), -joinOffset),
);

export const bridge = new Assembly("bridge");
bridge.addChild(innerBridge, a2m([0, woodThickness, 0], ny3));
bridge.addChild(outerBridge, a2m([0, -joinWidth, 0], ny3));
