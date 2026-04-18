import { Parameter, Point, Constraint, DrawingShape } from '../common/types';

/**
 * Parametric constraint system
 * All points are mathematically related to each other
 * Changing one parameter automatically recalculates dependent points
 */
export class ParametricSolver {
  private parameters: Map<string, number> = new Map();
  private constraints: Constraint[] = [];

  setParameter(id: string, value: number): void {
    this.parameters.set(id, value);
  }

  getParameter(id: string): number | undefined {
    return this.parameters.get(id);
  }

  addConstraint(constraint: Constraint): void {
    this.constraints.push(constraint);
  }

  /**
   * Solve all constraints and return calculated points
   * For tool profile: calculates all contour points based on parameters
   */
  solveToolProfile(baseParams: {
    width1: number;
    width2: number;
    height: number;
    tipWidth: number;
    tipHeight: number;
    baseHeight: number;
    angle: number;
  }): Point[] {
    const { width1, width2, height, tipWidth, tipHeight, baseHeight, angle } = baseParams;

    // Store parameters
    this.setParameter('width1', width1);
    this.setParameter('width2', width2);
    this.setParameter('height', height);
    this.setParameter('tipWidth', tipWidth);
    this.setParameter('tipHeight', tipHeight);
    this.setParameter('baseHeight', baseHeight);
    this.setParameter('angle', angle);

    // Calculate all points based on mathematical relationships
    // Profile is drawn clockwise from top-left
    const points: Point[] = [];

    // P0: Top-left corner (start of cutting edge)
    points.push({ x: -width1 / 2, y: height });

    // P1: Top-right corner (end of cutting edge)
    points.push({ x: width1 / 2, y: height });

    // P2: Right side, before tip
    const rightAngleRad = (angle * Math.PI) / 180;
    const rightX = width2 / 2;
    const rightY = height - tipHeight;
    points.push({ x: rightX, y: rightY });

    // P3: Tip right corner
    points.push({ x: tipWidth / 2, y: height - tipHeight });

    // P4: Tip bottom center
    points.push({ x: 0, y: height - tipHeight - (tipWidth / 2) * Math.tan(rightAngleRad) });

    // P5: Tip left corner
    points.push({ x: -tipWidth / 2, y: height - tipHeight });

    // P6: Left side, after tip
    const leftX = -width2 / 2;
    points.push({ x: leftX, y: height - tipHeight });

    // P7: Bottom-left corner
    points.push({ x: -width2 / 2, y: baseHeight });

    // P8: Bottom-right corner
    points.push({ x: width2 / 2, y: baseHeight });

    // Close the shape (back to P0 via left side)
    // The profile is now complete and closed

    return points;
  }

  /**
   * Recalculate points when a parameter changes
   * Maintains geometric consistency
   */
  recalculatePoints(points: Point[], changedParam: string, newValue: number): Point[] {
    const newPoints = [...points];
    
    // Apply mathematical relationships based on which parameter changed
    switch (changedParam) {
      case 'height':
        // Scale all Y coordinates proportionally
        const oldHeight = this.getParameter('height') || 1;
        const ratio = newValue / oldHeight;
        return newPoints.map(p => ({ ...p, y: p.y * ratio }));
      
      case 'width1':
      case 'width2':
        // Scale X coordinates proportionally
        const oldWidth = this.getParameter(changedParam) || 1;
        const widthRatio = newValue / oldWidth;
        return newPoints.map(p => ({ ...p, x: p.x * widthRatio }));
      
      case 'tipWidth':
        // Recalculate tip-related points
        const tipRatio = newValue / (this.getParameter('tipWidth') || 1);
        return newPoints.map((p, i) => {
          if (i >= 3 && i <= 5) { // Tip points
            return { ...p, x: p.x * tipRatio };
          }
          return p;
        });
      
      case 'tipHeight':
        // Move tip points vertically
        const heightDiff = newValue - (this.getParameter('tipHeight') || 0);
        return newPoints.map((p, i) => {
          if (i >= 2 && i <= 6) { // Points affected by tip height
            return { ...p, y: p.y - heightDiff };
          }
          return p;
        });
      
      default:
        return newPoints;
    }
  }

  /**
   * Calculate dimensions from points
   */
  calculateDimensions(points: Point[], params: Map<string, number>) {
    if (points.length < 2) return [];

    const dims = [];
    
    // Overall width
    if (points.length >= 2) {
      const maxWidth = Math.max(...points.map(p => p.x)) - Math.min(...points.map(p => p.x));
      dims.push({
        id: 'overall-width',
        start: { x: Math.min(...points.map(p => p.x)), y: Math.min(...points.map(p => p.y)) - 10 },
        end: { x: Math.max(...points.map(p => p.x)), y: Math.min(...points.map(p => p.y)) - 10 },
        value: maxWidth,
        label: `${maxWidth.toFixed(2)} mm`,
        orientation: 'horizontal' as const,
        offset: 20,
      });
    }

    // Overall height
    if (points.length >= 2) {
      const maxHeight = Math.max(...points.map(p => p.y)) - Math.min(...points.map(p => p.y));
      dims.push({
        id: 'overall-height',
        start: { x: Math.max(...points.map(p => p.x)) + 10, y: Math.min(...points.map(p => p.y)) },
        end: { x: Math.max(...points.map(p => p.x)) + 10, y: Math.max(...points.map(p => p.y)) },
        value: maxHeight,
        label: `${maxHeight.toFixed(2)} mm`,
        orientation: 'vertical' as const,
        offset: 20,
      });
    }

    return dims;
  }
}
