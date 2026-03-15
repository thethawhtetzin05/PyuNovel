import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './button';
import userEvent from '@testing-library/user-event';

describe('Button component', () => {
    it('renders with children', () => {
        render(<Button>Click me</Button>);
        expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('renders as a different element when asChild is true', () => {
        render(
            <Button asChild>
                <a href="/test">Link Button</a>
            </Button>
        );
        const link = screen.getByRole('link', { name: /link button/i });
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('href', '/test');
    });

    it('handles click events', async () => {
        const handleClick = vi.fn();
        render(<Button onClick={handleClick}>Click me</Button>);
        
        const button = screen.getByRole('button', { name: /click me/i });
        await userEvent.click(button);
        
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('is disabled when disabled prop is passed', () => {
        render(<Button disabled>Disabled Button</Button>);
        const button = screen.getByRole('button', { name: /disabled button/i });
        expect(button).toBeDisabled();
    });

    it('applies the correct variant classes', () => {
        const { container } = render(<Button variant="destructive">Destructive</Button>);
        const button = container.firstChild;
        expect(button).toHaveClass('bg-destructive');
    });
});
