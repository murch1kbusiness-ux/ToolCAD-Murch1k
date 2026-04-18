/**
 * Єдина система координат для ToolCAD
 * 
 * Цей модуль містить ЄДИНУ функцію для перетворення координат
 * між екранними (пікселі) та світовими (мм) координатами.
 * 
 * ВСІ модулі мають використовувати ці функції.
 * Заборонено дублювати логіку перетворення в інших місцях!
 */

const RULER_SIZE = 24; // px

/**
 * ЄДИНА функція для перетворення координат з екрану в світ (мм).
 * 
 * @param {number} clientX - clientX з події миші
 * @param {number} clientY - clientY з події миші
 * @param {Object} state - поточний стан робочої зони
 * @param {Object} state.pan - { x, y } зміщення в пікселях
 * @param {number} state.zoom - коефіцієнт масштабування (1 = 100%)
 * @returns {Object} Координати в системі аркуша (в мм) { x, y }
 */
function screenToWorld(clientX, clientY, state) {
  // ВИКОРИСТОВУЄМО workspace.screenToWorld як єдине джерело істини
  // workspace вже правильно обробляє rect, pan, zoom, ruler offset
  if (typeof workspace !== 'undefined') {
    return workspace.screenToWorld({ x: clientX, y: clientY });
  }
  
  // Fallback якщо workspace недоступний:
  const svgEl = document.getElementById('drawing-canvas');
  if (!svgEl) {
    console.error('[screenToWorld] SVG element not found!');
    return { x: 0, y: 0 };
  }

  const rect = svgEl.getBoundingClientRect();
  const svgX = clientX - rect.left;
  const svgY = clientY - rect.top;
  const viewX = svgX - RULER_SIZE;
  const viewY = svgY - RULER_SIZE;
  const effectiveZoom = state.zoom * 3;
  const worldX = viewX / effectiveZoom;  // pan вже враховано в rect.left/top
  const worldY = viewY / effectiveZoom;

  return { x: worldX, y: worldY };
}

/**
 * ЄДИНА функція для перетворення координат зі світу (мм) в екран.
 * 
 * @param {number} worldX - координата X в мм
 * @param {number} worldY - координата Y в мм
 * @param {Object} state - поточний стан робочої зони
 * @param {Object} state.pan - { x, y } зміщення в пікселях
 * @param {number} state.zoom - коефіцієнт масштабування (1 = 100%)
 * @returns {Object} Координати в пікселях екрану { x, y }
 */
function worldToScreen(worldX, worldY, state) {
  const effectiveZoom = state.zoom * 3;
  
  const svgEl = document.getElementById('drawing-canvas');
  if (!svgEl) {
    console.error('[worldToScreen] SVG element not found!');
    return { x: 0, y: 0 };
  }
  
  const rect = svgEl.getBoundingClientRect();
  
  const screenX = worldX * effectiveZoom + state.pan.x + RULER_SIZE + rect.left;
  const screenY = worldY * effectiveZoom + state.pan.y + RULER_SIZE + rect.top;
  
  return { x: screenX, y: screenY };
}

/**
 * Допоміжна функція для отримання поточного стану workspace
 * 
 * @param {number} panX - поточний pan X
 * @param {number} panY - поточний pan Y
 * @param {number} zoom - поточний zoom
 * @returns {Object} Об'єкт WorkspaceState
 */
function getWorkspaceState(panX, panY, zoom) {
  return {
    pan: { x: panX, y: panY },
    zoom,
    rulerSize: RULER_SIZE
  };
}

