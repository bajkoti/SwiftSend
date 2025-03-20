import { render, screen } from '@testing-library/react';
import App from './App';

test('renders SwiftSend header', () => {
  render(<App />);
  const headerElement = screen.getByText(/SWIFTSEND/i);
  expect(headerElement).toBeInTheDocument();
});
