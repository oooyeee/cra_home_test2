import App from "../App";
import { render, screen } from '@testing-library/react';

test('app renders', () => {
    render(<App />);
    const linkElement = screen.getByText(/Message Template Editor PRO/i);
    expect(linkElement).toBeInTheDocument();
});
