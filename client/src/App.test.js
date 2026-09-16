import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('axios', () => ({
  get: jest.fn(() => Promise.resolve({ data: {} })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  delete: jest.fn(() => Promise.resolve({ data: {} })),
}));

jest.mock('jspdf', () => ({
  jsPDF: jest.fn().mockImplementation(() => ({
    setFillColor: jest.fn(),
    rect: jest.fn(),
    setTextColor: jest.fn(),
    setFontSize: jest.fn(),
    setFont: jest.fn(),
    text: jest.fn(),
    setDrawColor: jest.fn(),
    setLineWidth: jest.fn(),
    line: jest.fn(),
    splitTextToSize: jest.fn(() => []),
    save: jest.fn(),
  })),
}));

jest.mock('./firebase', () => ({
  auth: {},
}));

jest.mock('firebase/auth', () => ({
  GoogleAuthProvider: jest.fn(),
  signInWithPopup: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn((auth, cb) => {
    cb(null);
    return () => {};
  }),
  updateProfile: jest.fn(),
}));

test('renders Academic Explainer brand and navigation', () => {
  render(<App />);
  const brandElements = screen.getAllByText(/Academic Explainer/i);
  expect(brandElements.length).toBeGreaterThan(0);

  const homeButtons = screen.getAllByText(/Home/i);
  expect(homeButtons.length).toBeGreaterThan(0);

  const explainerButtons = screen.getAllByText(/Explainer Workspace/i);
  expect(explainerButtons.length).toBeGreaterThan(0);
});
