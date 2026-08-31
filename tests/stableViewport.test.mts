import assert from 'node:assert/strict';
import test from 'node:test';
import {createStableViewportController} from '../src/utils/stableViewport.ts';

type EventName = 'resize' | 'orientationchange';
type Listener = () => void;

function createEnvironment(width = 390, height = 800) {
  const listeners = new Map<EventName, Set<Listener>>();
  const published: number[] = [];
  let currentWidth = width;
  let currentHeight = height;

  return {
    source: {
      readWidth: () => currentWidth,
      readHeight: () => currentHeight,
      publishHeight: (nextHeight: number) => published.push(nextHeight),
      addListener: (event: EventName, listener: Listener) => {
        const eventListeners = listeners.get(event) ?? new Set<Listener>();
        eventListeners.add(listener);
        listeners.set(event, eventListeners);
      },
      removeListener: (event: EventName, listener: Listener) => {
        listeners.get(event)?.delete(listener);
      },
    },
    resize(nextWidth: number, nextHeight: number) {
      currentWidth = nextWidth;
      currentHeight = nextHeight;
      listeners.get('resize')?.forEach((listener) => listener());
    },
    rotate(nextWidth: number, nextHeight: number) {
      currentWidth = nextWidth;
      currentHeight = nextHeight;
      listeners.get('orientationchange')?.forEach((listener) => listener());
    },
    published,
  };
}

test('mantém a altura estável quando apenas a altura visual muda', () => {
  const environment = createEnvironment();
  const viewport = createStableViewportController(environment.source);

  viewport.start();
  environment.resize(390, 690);

  assert.equal(viewport.getHeight(), 800);
  assert.deepEqual(environment.published, [800]);
});

test('atualiza a altura quando a largura muda', () => {
  const environment = createEnvironment();
  const viewport = createStableViewportController(environment.source);

  viewport.start();
  environment.resize(844, 390);

  assert.equal(viewport.getHeight(), 390);
  assert.deepEqual(environment.published, [800, 390]);
});

test('atualiza a altura em orientationchange mesmo sem mudança de largura', () => {
  const environment = createEnvironment();
  const viewport = createStableViewportController(environment.source);

  viewport.start();
  environment.rotate(390, 760);

  assert.equal(viewport.getHeight(), 760);
  assert.deepEqual(environment.published, [800, 760]);
});