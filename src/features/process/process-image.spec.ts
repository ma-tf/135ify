import { describe, expect, it } from "vite-plus/test";

import { constrainDimensions } from "./process-image";

describe("constrainDimensions", () => {
  it("returns original dimensions when no maxDimension", () => {
    expect(constrainDimensions(100, 80)).toEqual({ width: 100, height: 80 });
  });

  it("returns original dimensions when both fit within maxDimension", () => {
    expect(constrainDimensions(100, 80, 200)).toEqual({
      width: 100,
      height: 80,
    });
  });

  it("scales landscape proportionally when width exceeds maxDimension", () => {
    expect(constrainDimensions(200, 100, 120)).toEqual({
      width: 120,
      height: 60,
    });
  });

  it("scales portrait proportionally when height exceeds maxDimension", () => {
    expect(constrainDimensions(100, 200, 120)).toEqual({
      width: 60,
      height: 120,
    });
  });

  it("scales when both dimensions exceed maxDimension", () => {
    expect(constrainDimensions(400, 300, 100)).toEqual({
      width: 100,
      height: 75,
    });
  });

  it("scales a square image", () => {
    expect(constrainDimensions(200, 200, 100)).toEqual({
      width: 100,
      height: 100,
    });
  });
});
