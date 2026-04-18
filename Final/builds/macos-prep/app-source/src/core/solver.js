// ═══════════════════════════════════════════════════
// CONSTRAINT SOLVER — MVP (fix point, distance, horizontal, vertical)
// ═══════════════════════════════════════════════════
// Lightweight geometric constraint solver for 2D CAD.
// Uses iterative Gauss-Newton relaxation to satisfy
// distance, horizontal, vertical, and fixed-point constraints.
// ═══════════════════════════════════════════════════

const SOLVER_TOLERANCE = 0.001;  // mm
const MAX_ITERATIONS = 50;
const DAMPING = 0.5;             // relaxation factor for stability

// ── Constraint types ─────────────────────────────
// fixed:      { type: 'fixed',      p1: pointId }
// distance:   { type: 'distance',   p1: pointId, p2: pointId, value: mm }
// horizontal: { type: 'horizontal', p1: pointId, p2: pointId }
// vertical:   { type: 'vertical',   p1: pointId, p2: pointId }

class ConstraintSolver {
  constructor() {
    // Map<pointId, { x, y }>
    this.points = new Map();
    // Array of constraint objects
    this.constraints = [];
    // Counter for generating constraint IDs
    this._nextConstraintId = 1;
  }

  // ── Point Management ─────────────────────────

  /**
   * Register or update a point's current position.
   * @param {string} id   — unique point identifier (e.g. "ent_3:x1")
   * @param {number} x    — world X in mm
   * @param {number} y    — world Y in mm
   */
  setPoint(id, x, y) {
    this.points.set(id, { x, y });
  }

  getPoint(id) {
    return this.points.get(id) || null;
  }

  hasPoint(id) {
    return this.points.has(id);
  }

  removePoint(id) {
    this.points.delete(id);
    // Also remove any constraints referencing this point
    this.constraints = this.constraints.filter(
      c => c.p1 !== id && c.p2 !== id
    );
  }

  clearPoints() {
    this.points.clear();
  }

  // ── Constraint Management ─────────────────────

  /**
   * Add a constraint to the system.
   * @returns {string} constraintId
   */
  addConstraint(constraint) {
    const id = `c_${this._nextConstraintId++}`;
    const c = { ...constraint, id };
    this.constraints.push(c);
    return id;
  }

  /**
   * Update the value of an existing distance constraint.
   */
  updateConstraintValue(constraintId, newValue) {
    const c = this.constraints.find(con => con.id === constraintId);
    if (c && c.type === 'distance') {
      c.value = newValue;
    }
  }

  removeConstraint(constraintId) {
    this.constraints = this.constraints.filter(c => c.id !== constraintId);
  }

  /**
   * Remove all constraints that reference a given point.
   */
  removeConstraintsForPoint(pointId) {
    this.constraints = this.constraints.filter(
      c => c.p1 !== pointId && c.p2 !== pointId
    );
  }

  clearConstraints() {
    this.constraints = [];
  }

  getConstraints() {
    return [...this.constraints];
  }

  getConstraintsForPoint(pointId) {
    return this.constraints.filter(c => c.p1 === pointId || c.p2 === pointId);
  }

  /**
   * Find a distance constraint by its two points.
   */
  findDistanceConstraint(p1, p2) {
    return this.constraints.find(
      c => c.type === 'distance' &&
           ((c.p1 === p1 && c.p2 === p2) || (c.p1 === p2 && c.p2 === p1))
    );
  }

  // ── Solver ─────────────────────────────────────

  /**
   * Solve all constraints iteratively.
   * @param {number} [maxIter=MAX_ITERATIONS]
   * @returns {{ solved: boolean, iterations: number, maxError: number }}
   */
  solve(maxIter = MAX_ITERATIONS) {
    let maxError = 0;
    let iterations = 0;

    for (let iter = 0; iter < maxIter; iter++) {
      iterations = iter + 1;
      maxError = 0;
      let converged = true;

      // Process each constraint and compute corrections
      for (const constraint of this.constraints) {
        const p1 = this.points.get(constraint.p1);
        if (!p1) continue;

        let correction1 = { x: 0, y: 0 };
        let correction2 = { x: 0, y: 0 };

        switch (constraint.type) {
          case 'fixed': {
            // Fixed point: snap back to its original registered position
            // (we store the "home" position in the constraint itself)
            const homeX = constraint.x;
            const homeY = constraint.y;
            const dx = homeX - p1.x;
            const dy = homeY - p1.y;
            correction1 = { x: dx, y: dy };
            maxError = Math.max(maxError, Math.abs(dx), Math.abs(dy));
            if (Math.abs(dx) > SOLVER_TOLERANCE || Math.abs(dy) > SOLVER_TOLERANCE) {
              converged = false;
            }
            break;
          }

          case 'distance': {
            const p2 = this.points.get(constraint.p2);
            if (!p2) break;

            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const currentDist = Math.sqrt(dx * dx + dy * dy);
            if (currentDist < 0.0001) break; // degenerate

            const error = currentDist - constraint.value;
            maxError = Math.max(maxError, Math.abs(error));

            if (Math.abs(error) > SOLVER_TOLERANCE) {
              converged = false;
              // Distribute correction equally to both points
              const nx = dx / currentDist;
              const ny = dy / currentDist;
              const half = error * DAMPING / 2;
              correction1 = { x: nx * half, y: ny * half };
              correction2 = { x: -nx * half, y: -ny * half };
            }
            break;
          }

          case 'horizontal': {
            const p2 = this.points.get(constraint.p2);
            if (!p2) break;

            const dy = p2.y - p1.y;
            maxError = Math.max(maxError, Math.abs(dy));

            if (Math.abs(dy) > SOLVER_TOLERANCE) {
              converged = false;
              const half = dy * DAMPING / 2;
              correction1 = { x: 0, y: half };
              correction2 = { x: 0, y: -half };
            }
            break;
          }

          case 'vertical': {
            const p2 = this.points.get(constraint.p2);
            if (!p2) break;

            const dx = p2.x - p1.x;
            maxError = Math.max(maxError, Math.abs(dx));

            if (Math.abs(dx) > SOLVER_TOLERANCE) {
              converged = false;
              const half = dx * DAMPING / 2;
              correction1 = { x: half, y: 0 };
              correction2 = { x: -half, y: 0 };
            }
            break;
          }
        }

        // Apply corrections
        p1.x += correction1.x;
        p1.y += correction1.y;

        if (constraint.p2) {
          const p2 = this.points.get(constraint.p2);
          if (p2) {
            p2.x += correction2.x;
            p2.y += correction2.y;
          }
        }
      }

      if (converged) break;
    }

    return {
      solved: maxError <= SOLVER_TOLERANCE,
      iterations,
      maxError,
    };
  }

  // ── Sync State ─────────────────────────────────

  /**
   * Write solved point positions back to entity objects.
   * Each entity field that was registered as a point gets updated.
   *
   * Mapping: pointId format is "entityId:field" (e.g. "ent_3:x1")
   *
   * @param {Array} entities — state.entities array
   * @returns {Map<string, {oldX, oldY, newX, newY}>}  changes made
   */
  syncToEntities(entities) {
    const changes = new Map();

    for (const [pointId, pos] of this.points) {
      // Parse "entityId:field" format
      const colonIdx = pointId.indexOf(':');
      if (colonIdx === -1) continue;

      const entityId = pointId.substring(0, colonIdx);
      const field = pointId.substring(colonIdx + 1);

      const ent = entities.find(e => String(e.id) === entityId || e.id === Number(entityId));
      if (!ent) continue;

      const oldVal = ent[field];
      if (oldVal === undefined) continue;

      const diff = pos - oldVal;
      if (Math.abs(diff) > SOLVER_TOLERANCE) {
        changes.set(pointId, { oldX: oldVal, newX: pos });
        ent[field] = pos;
      }
    }

    return changes;
  }

  /**
   * Build point IDs from an entity's coordinates.
   * Returns array of { pointId, x, y } for registration.
   */
  static entityPoints(entity) {
    const points = [];

    switch (entity.type) {
      case 'line':
        points.push({ pointId: `${entity.id}:x1`, x: entity.x1, y: entity.y1, field: 'x1' });
        points.push({ pointId: `${entity.id}:y1`, x: entity.x1, y: entity.y1, field: 'y1' });
        // Actually we need (x,y) pairs, not individual coords
        break;
      case 'rect':
      case 'circle':
      case 'dimension':
      case 'arc':
        break;
    }

    return points;
  }

  /**
   * Register all endpoint coordinates from an entity as solver points.
   * Returns mapping of what was registered.
   */
  static registerEntityPoints(solver, entity) {
    const registered = [];

    switch (entity.type) {
      case 'line': {
        solver.setPoint(`${entity.id}:x1y1`, entity.x1, entity.y1);
        solver.setPoint(`${entity.id}:x2y2`, entity.x2, entity.y2);
        registered.push(
          { pointId: `${entity.id}:x1y1`, x: entity.x1, y: entity.y1, field: 'x1y1' },
          { pointId: `${entity.id}:x2y2`, x: entity.x2, y: entity.y2, field: 'x2y2' },
        );
        break;
      }
      case 'rect': {
        solver.setPoint(`${entity.id}:x1y1`, entity.x1, entity.y1);
        solver.setPoint(`${entity.id}:x2y2`, entity.x2, entity.y2);
        registered.push(
          { pointId: `${entity.id}:x1y1`, x: entity.x1, y: entity.y1, field: 'x1y1' },
          { pointId: `${entity.id}:x2y2`, x: entity.x2, y: entity.y2, field: 'x2y2' },
        );
        break;
      }
      case 'circle': {
        solver.setPoint(`${entity.id}:center`, entity.cx, entity.cy);
        registered.push(
          { pointId: `${entity.id}:center`, x: entity.cx, y: entity.cy, field: 'center' },
        );
        break;
      }
      case 'polyline': {
        entity.points.forEach((p, i) => {
          solver.setPoint(`${entity.id}:p${i}`, p.x, p.y);
          registered.push({ pointId: `${entity.id}:p${i}`, x: p.x, y: p.y, field: `p${i}` });
        });
        break;
      }
      case 'dimension': {
        solver.setPoint(`${entity.id}:x1y1`, entity.x1, entity.y1);
        solver.setPoint(`${entity.id}:x2y2`, entity.x2, entity.y2);
        registered.push(
          { pointId: `${entity.id}:x1y1`, x: entity.x1, y: entity.y1, field: 'x1y1' },
          { pointId: `${entity.id}:x2y2`, x: entity.x2, y: entity.y2, field: 'x2y2' },
        );
        break;
      }
    }

    return registered;
  }

  /**
   * Write solver positions back to entity coordinates.
   */
  static writeBackEntities(solver, entities) {
    for (const ent of entities) {
      switch (ent.type) {
        case 'line': {
          const p1 = solver.getPoint(`${ent.id}:x1y1`);
          const p2 = solver.getPoint(`${ent.id}:x2y2`);
          if (p1) { ent.x1 = p1.x; ent.y1 = p1.y; }
          if (p2) { ent.x2 = p2.x; ent.y2 = p2.y; }
          break;
        }
        case 'rect': {
          const p1 = solver.getPoint(`${ent.id}:x1y1`);
          const p2 = solver.getPoint(`${ent.id}:x2y2`);
          if (p1) { ent.x1 = p1.x; ent.y1 = p1.y; }
          if (p2) { ent.x2 = p2.x; ent.y2 = p2.y; }
          break;
        }
        case 'circle': {
          const c = solver.getPoint(`${ent.id}:center`);
          if (c) { ent.cx = c.x; ent.cy = c.y; }
          break;
        }
        case 'polyline': {
          ent.points.forEach((p, i) => {
            const sp = solver.getPoint(`${ent.id}:p${i}`);
            if (sp) { ent.points[i].x = sp.x; ent.points[i].y = sp.y; }
          });
          break;
        }
        case 'dimension': {
          const p1 = solver.getPoint(`${ent.id}:x1y1`);
          const p2 = solver.getPoint(`${ent.id}:x2y2`);
          if (p1) { ent.x1 = p1.x; ent.y1 = p1.y; }
          if (p2) { ent.x2 = p2.x; ent.y2 = p2.y; }
          break;
        }
      }
    }
  }
}

// Make globally available (loaded via <script> tag)
if (typeof window !== 'undefined') {
  window.ConstraintSolver = ConstraintSolver;
}
