
export class Utility {
    static linearInterpolation(y1: number, y2: number, ratio: number): number {
      return Math.round(y1 + (y2 - y1) * ratio);
    }
  }
  