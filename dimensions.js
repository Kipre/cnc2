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

const defaultSpindleSize = 6;
