/**
 * Єдина система координат для ToolCAD
 * 
 * Цей модуль містить ЄДИНУ функцію для перетворення координат
 * між екранними (пікселі) та світовими (мм) координатами.
 * 
 * ВСІ модулі мають використовувати ці функції.
 * Заборонено дублювати логіку перетворення в інших місцях!
 */

export interface WorkspaceState {
  pan: { x: number; y: number }; // Зміщення в пікселях
  zoom: number;                 // Коефіцієнт масштабування (1 = 100%, base = 3px/mm)
  rulerSize: number;            // Розмір лінійок в пікселях (напр., 24)
}

/**
 * ЄДИНА функція для перетворення координат з екрану в світ (мм).
 * 
 * @param screenX - clientX з події миші
 * @param screenY - clientY з події миші
 * @param state - поточний стан робочої зони
 * @returns Координати в системі аркуша (в мм)
 */
export function screenToWorld(
  screenX: number, 
  screenY: number, 
  state: WorkspaceState
): { x: number; y: number } {
  const { pan, zoom, rulerSize } = state;

  // 1. Віднімаємо зміщення від лінійок, щоб отримати координати відносно viewport
  const viewX = screenX - rulerSize;
  const viewY = screenY - rulerSize;

  // 2. Віднімаємо pan і ділимо на zoom, щоб отримати світові координати
  // zoom тут це effectiveZoom = zoom * baseZoom (baseZoom = 3px/mm)
  const worldX = (viewX - pan.x) / zoom;
  const worldY = (viewY - pan.y) / zoom;

  return { x: worldX, y: worldY };
}

/**
 * ЄДИНА функція для перетворення координат зі світу (мм) в екран.
 * 
 * @param worldX - координата X в мм
 * @param worldY - координата Y в мм
 * @param state - поточний стан робочої зони
 * @returns Координати в пікселях екрану
 */
export function worldToScreen(
  worldX: number,
  worldY: number,
  state: WorkspaceState
): { x: number; y: number } {
  const { pan, zoom, rulerSize } = state;

  // Зворотне перетворення
  const screenX = worldX * zoom + pan.x + rulerSize;
  const screenY = worldY * zoom + pan.y + rulerSize;

  return { x: screenX, y: screenY };
}

/**
 * Допоміжна функція для отримання поточного стану workspace з DOM елементів
 * 
 * @param panX - поточний pan X
 * @param panY - поточний pan Y
 * @param zoom - поточний zoom
 * @param rulerSize - розмір лінійок (за замовчуванням 24)
 * @returns Об'єкт WorkspaceState
 */
export function getWorkspaceState(
  panX: number,
  panY: number,
  zoom: number,
  rulerSize: number = 24
): WorkspaceState {
  return {
    pan: { x: panX, y: panY },
    zoom,
    rulerSize
  };
}
