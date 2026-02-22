import React from 'react';
import { render } from '@testing-library/react';
import { act } from 'react';
import App from './App';

test('renders without crashing', async () => {
  let baseElement: Element;
  await act(async () => {
    ({ baseElement } = render(<App />));
  });
  expect(baseElement!).toBeDefined();
});
