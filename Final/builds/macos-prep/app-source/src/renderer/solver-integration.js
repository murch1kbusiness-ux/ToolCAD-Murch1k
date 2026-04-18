// ═══════════════════════════════════════════════════
// SOLVER INTEGRATION — hooks into app.js
// ═══════════════════════════════════════════════════
// This module provides the parametric constraint
// system integration with the main app state.
// Must be loaded AFTER app.js (globals: state, solver, render, etc.)
// ═══════════════════════════════════════════════════

(function () {
  'use strict';

  // Wait for app.js to load state and solver
  function waitForApp() {
    if (typeof state === 'undefined' || typeof ConstraintSolver === 'undefined') {
      setTimeout(waitForApp, 100);
      return;
    }
    init();
  }

  function init() {
    // Create solver instance
    window.solver = new ConstraintSolver();
    console.log('[Solver] Initialized');

    // Build initial state from entities
    rebuildSolverState();

    // Hook into saveSnapshot to sync solver
    const origSaveSnapshot = window.saveSnapshot;
    if (origSaveSnapshot) {
      window.saveSnapshot = function () {
        origSaveSnapshot.apply(this, arguments);
        // Don't rebuild on every save — too expensive
        // Rebuild only when entities change structurally
      };
    }

    console.log('[Solver] Integration complete');
  }

  /**
   * Rebuild the entire solver state from state.entities.
   * Call this when entities are loaded (project open, undo, etc.)
   */
  window.rebuildSolverState = function () {
    if (!window.solver) return;
    const s = window.solver;

    s.clearPoints();
    s.clearConstraints();

    for (const ent of state.entities) {
      ConstraintSolver.registerEntityPoints(s, ent);

      // Auto-constraints for lines
      if (ent.type === 'line') {
        const dy = Math.abs(ent.y2 - ent.y1);
        const dx = Math.abs(ent.x2 - ent.x1);
        if (dy < 0.01) {
          s.addConstraint({
            type: 'horizontal',
            p1: ent.id + ':x1y1',
            p2: ent.id + ':x2y2',
          });
        }
        if (dx < 0.01) {
          s.addConstraint({
            type: 'vertical',
            p1: ent.id + ':x1y1',
            p2: ent.id + ':x2y2',
          });
        }
      }

      // Auto: distance constraint for existing dimensions
      if (ent.type === 'dimension') {
        const p1Id = ent.id + ':x1y1';
        const p2Id = ent.id + ':x2y2';
        const ddx = ent.x2 - ent.x1;
        const ddy = ent.y2 - ent.y1;
        const dist = Math.sqrt(ddx * ddx + ddy * ddy);
        const cId = s.addConstraint({
          type: 'distance',
          p1: p1Id,
          p2: p2Id,
          value: dist,
        });
        ent.constraintId = cId;
      }
    }
  };

  /**
   * Idempotent: ensure all dimension entities have a distance constraint.
   * Safe to call on every render — only adds missing constraints.
   */
  window.ensureDimensionConstraints = function () {
    if (!window.solver) return;
    const s = window.solver;

    for (const ent of state.entities) {
      if (ent.type !== 'dimension') continue;
      if (ent.constraintId) {
        // Already has constraint — verify it still exists
        const c = s.constraints.find(c => c.id === ent.constraintId);
        if (c) {
          // Update value to current geometry
          const dx = ent.x2 - ent.x1;
          const dy = ent.y2 - ent.y1;
          c.value = Math.sqrt(dx * dx + dy * dy);
          continue;
        }
      }
      // Missing or orphaned — (re)create
      addDimensionConstraint(ent);
    }
  };

  /**
   * Add a distance constraint for a newly created dimension entity.
   * Call this right after the dimension is pushed to state.entities.
   */
  window.addDimensionConstraint = function (dimEnt) {
    if (!window.solver) return null;
    const s = window.solver;

    const p1Id = dimEnt.id + ':x1y1';
    const p2Id = dimEnt.id + ':x2y2';

    s.setPoint(p1Id, dimEnt.x1, dimEnt.y1);
    s.setPoint(p2Id, dimEnt.x2, dimEnt.y2);

    const ddx = dimEnt.x2 - dimEnt.x1;
    const ddy = dimEnt.y2 - dimEnt.y1;
    const dist = Math.sqrt(ddx * ddx + ddy * ddy);

    const existing = s.findDistanceConstraint(p1Id, p2Id);
    if (existing) {
      s.updateConstraintValue(existing.id, dist);
      return existing.id;
    }

    const cId = s.addConstraint({
      type: 'distance',
      p1: p1Id,
      p2: p2Id,
      value: dist,
    });

    dimEnt.constraintId = cId;
    console.log('[Solver] Distance constraint ' + cId + ' added: ' + dist.toFixed(2) + 'mm');
    return cId;
  };

  /**
   * Update dimension constraint value, solve, and write back.
   * @param {number} newDistance — desired distance in mm
   * @param {object} dimEnt — the dimension entity object
   * @returns {boolean} true if solve succeeded
   */
  window.solveAndUpdateDimension = function (newDistance, dimEnt) {
    if (!window.solver || !dimEnt.constraintId) return false;

    window.solver.updateConstraintValue(dimEnt.constraintId, newDistance);
    const result = window.solver.solve();
    console.log('[Solver] solved=' + result.solved + ', iter=' + result.iterations + ', err=' + result.maxError.toFixed(4));

    if (result.solved || result.maxError < 0.01) {
      ConstraintSolver.writeBackEntities(window.solver, state.entities);
      return true;
    }

    console.warn('[Solver] solve did not converge');
    return false;
  };

  // Remove an entity's constraints from the solver
  window.removeEntityFromSolver = function (entityId) {
    if (!window.solver) return;
    const s = window.solver;
    s.removeConstraintsForPoint(entityId + ':x1y1');
    s.removeConstraintsForPoint(entityId + ':x2y2');
    s.removeConstraintsForPoint(entityId + ':center');
    // Remove polyline points
    for (let i = 0; i < 100; i++) {
      s.removeConstraintsForPoint(entityId + ':p' + i);
    }
  };

  // Start initialization
  waitForApp();
})();
