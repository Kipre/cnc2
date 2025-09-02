import { Assembly } from "./cade/lib/lib.js";
import { woodenBase } from "./woodenBase.js";

export const base = new Assembly("complete frame");

base.addChild(woodenBase);
