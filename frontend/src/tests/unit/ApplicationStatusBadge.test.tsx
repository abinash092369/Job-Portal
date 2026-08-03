import { render, screen } from '@testing-library/react';
import { ApplicationStatusBadge } from '../../components/ApplicationStatusBadge';


describe('ApplicationStatusBadge Component', () => {
  test('renders badge with correct status label', () => {
    render(<ApplicationStatusBadge status="applied" />);
    const badge = screen.getByTestId('status-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('applied');
  });

  test('applies blue classes for applied status', () => {
    render(<ApplicationStatusBadge status="applied" />);
    const badge = screen.getByTestId('status-badge');
    expect(badge.className).toContain('bg-blue-50');
    expect(badge.className).toContain('text-blue-600');
  });

  test('applies emerald classes for hired status', () => {
    render(<ApplicationStatusBadge status="hired" />);
    const badge = screen.getByTestId('status-badge');
    expect(badge.className).toContain('bg-emerald-50');
    expect(badge.className).toContain('text-emerald-600');
  });

  test('applies slate classes for unknown or fallback status', () => {
    render(<ApplicationStatusBadge status="unknown_status" />);
    const badge = screen.getByTestId('status-badge');
    expect(badge.className).toContain('bg-slate-50');
    expect(badge.className).toContain('text-slate-600');
  });
});
