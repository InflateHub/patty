// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom/extend-expect';
import { vi } from 'vitest';

// Mock matchmedia
window.matchMedia = window.matchMedia || function() {
  return {
      matches: false,
      addListener: function() {},
      removeListener: function() {}
  };
};

// Mock the SQLite database module so hooks don't throw
// "Database not initialised" during unit tests.
const mockDb = {
  query: vi.fn().mockResolvedValue({ values: [] }),
  run: vi.fn().mockResolvedValue({ changes: { changes: 0, lastId: 0 } }),
  execute: vi.fn().mockResolvedValue(undefined),
  executeSet: vi.fn().mockResolvedValue(undefined),
  close: vi.fn().mockResolvedValue(undefined),
};

vi.mock('./db/database', () => ({
  initDatabase: vi.fn().mockResolvedValue(undefined),
  getDb: vi.fn().mockReturnValue(mockDb),
}));
