import { Parameter, DrawingShape, DrawingState, BackgroundStyle } from '../common/types';

/**
 * Default parameters for a cutting tool profile
 */
export function getDefaultParameters(): Parameter[] {
  return [
    {
      id: 'width1',
      name: 'Ширина 1 (верхня)',
      value: 20,
      min: 5,
      max: 100,
      unit: 'mm',
      description: 'Ширина різальної кромки (зверху)',
    },
    {
      id: 'width2',
      name: 'Ширина 2 (нижня)',
      value: 30,
      min: 5,
      max: 150,
      unit: 'mm',
      description: 'Ширина основи інструменту',
    },
    {
      id: 'height',
      name: 'Висота загальна',
      value: 80,
      min: 10,
      max: 200,
      unit: 'mm',
      description: 'Загальна висота інструменту',
    },
    {
      id: 'tipWidth',
      name: 'Ширина вістря',
      value: 8,
      min: 2,
      max: 50,
      unit: 'mm',
      description: 'Ширина різального вістря',
    },
    {
      id: 'tipHeight',
      name: 'Висота вістря',
      value: 15,
      min: 5,
      max: 60,
      unit: 'mm',
      description: 'Висота різальної частини',
    },
    {
      id: 'baseHeight',
      name: 'Висота основи',
      value: 20,
      min: 5,
      max: 100,
      unit: 'mm',
      description: 'Висота основи (хвостовика)',
    },
    {
      id: 'angle',
      name: 'Кут нахилу',
      value: 15,
      min: 0,
      max: 45,
      unit: '°',
      description: 'Кут нахилу бічних граней',
    },
  ];
}

/**
 * Default drawing state
 */
export function getDefaultState(): DrawingState {
  return {
    parameters: getDefaultParameters(),
    shapes: [],
    view: {
      view: 'front',
      scale: 5, // 5 pixels per mm
      offset: { x: 0, y: 0 },
    },
    background: {
      type: 'millimeter',
      color: '#1a1a2e',
      gridColor: '#2a2a4e',
      gridSize: 10,
    },
  };
}

/**
 * Default background styles
 */
export const BackgroundStyles: { [key: string]: BackgroundStyle } = {
  solid: {
    type: 'solid',
    color: '#ffffff',
  },
  grid: {
    type: 'grid',
    color: '#f5f5f5',
    gridColor: '#e0e0e0',
    gridSize: 20,
  },
  millimeter: {
    type: 'grid',
    color: '#1a1a2e',
    gridColor: '#2a2a4e',
    gridSize: 10,
  },
  dark: {
    type: 'solid',
    color: '#0d1117',
  },
};
