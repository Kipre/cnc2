const xRailLength = 1000;
export const yRailLength = 1000;
const zRailLength = 350;

export const woodThickness = 15;
const carrierWheelbase = 200;
export const xRailSupportWidth = 100;

export const zAxisTravel = zRailLength - carrierWheelbase;

export const yRailEndSpace = 20;

export const openArea = {
  x: xRailLength,
  y: yRailLength + 3 * yRailEndSpace,
  z: zAxisTravel,
};

export const defaultSpindleSize = 6;

export const joinOffset = 10;
export const joinWidth = 100 - 2 * woodThickness;
export const joinSpace = 2 * joinOffset + woodThickness;

export const bridgeTopThickness = zAxisTravel;
export const bridgeTop = openArea.z + bridgeTopThickness;
