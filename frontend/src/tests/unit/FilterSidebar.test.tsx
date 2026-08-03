import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { FilterSidebar } from '../../components/FilterSidebar';


describe('FilterSidebar Component', () => {
  const defaultProps = {
    locationVal: 'San Francisco',
    setLocationVal: vi.fn(),
    selectedJobTypes: ['full-time'],
    toggleJobType: vi.fn(),
    remoteOnly: false,
    setRemoteOnly: vi.fn(),
    salaryMin: '90000',
    setSalaryMin: vi.fn(),
    selectedExp: 'Senior Level',
    setSelectedExp: vi.fn(),
    selectedSkills: ['React'],
    toggleSkill: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders all filter fields with default values', () => {
    render(<FilterSidebar {...defaultProps} />);

    // Location
    const locationInput = screen.getByPlaceholderText(/e.g. Remote, San Francisco/i) as HTMLInputElement;
    expect(locationInput).toBeInTheDocument();
    expect(locationInput.value).toBe('San Francisco');

    // Job types checkboxes
    const fullTimeCheckbox = screen.getByLabelText(/Full Time/i) as HTMLInputElement;
    expect(fullTimeCheckbox).toBeInTheDocument();
    expect(fullTimeCheckbox.checked).toBe(true);

    const partTimeCheckbox = screen.getByLabelText(/Part Time/i) as HTMLInputElement;
    expect(partTimeCheckbox.checked).toBe(false);

    // Remote Only toggle button
    const remoteToggle = screen.getByRole('button', { name: /Toggle remote only/i });
    expect(remoteToggle).toBeInTheDocument();

    // Min Salary
    const salaryInput = screen.getByPlaceholderText(/e.g. 80000/i) as HTMLInputElement;
    expect(salaryInput).toBeInTheDocument();
    expect(salaryInput.value).toBe('90000');

    // Experience Level dropdown
    const experienceSelect = screen.getByRole('combobox') as HTMLSelectElement;
    expect(experienceSelect).toBeInTheDocument();
    expect(experienceSelect.value).toBe('Senior Level');

    // Skills buttons
    const reactButton = screen.getByRole('button', { name: 'React' });
    expect(reactButton).toBeInTheDocument();
    expect(reactButton.className).toContain('bg-primary'); // active color class
  });

  test('triggers callback on location change', () => {
    render(<FilterSidebar {...defaultProps} />);
    const locationInput = screen.getByPlaceholderText(/e.g. Remote, San Francisco/i);
    fireEvent.change(locationInput, { target: { value: 'New York' } });
    expect(defaultProps.setLocationVal).toHaveBeenCalledWith('New York');
  });

  test('triggers callback on job type checkbox click', () => {
    render(<FilterSidebar {...defaultProps} />);
    const partTimeCheckbox = screen.getByLabelText(/Part Time/i);
    fireEvent.click(partTimeCheckbox);
    expect(defaultProps.toggleJobType).toHaveBeenCalledWith('part-time');
  });

  test('triggers callback on remote toggle click', () => {
    render(<FilterSidebar {...defaultProps} />);
    const remoteToggle = screen.getByRole('button', { name: /Toggle remote only/i });
    fireEvent.click(remoteToggle);
    expect(defaultProps.setRemoteOnly).toHaveBeenCalledWith(true);
  });

  test('triggers callback on min salary change', () => {
    render(<FilterSidebar {...defaultProps} />);
    const salaryInput = screen.getByPlaceholderText(/e.g. 80000/i);
    fireEvent.change(salaryInput, { target: { value: '120000' } });
    expect(defaultProps.setSalaryMin).toHaveBeenCalledWith('120000');
  });

  test('triggers callback on experience level select change', () => {
    render(<FilterSidebar {...defaultProps} />);
    const experienceSelect = screen.getByRole('combobox');
    fireEvent.change(experienceSelect, { target: { value: 'Entry Level' } });
    expect(defaultProps.setSelectedExp).toHaveBeenCalledWith('Entry Level');
  });

  test('triggers callback on skill tag click', () => {
    render(<FilterSidebar {...defaultProps} />);
    const nodeButton = screen.getByRole('button', { name: 'Node.js' });
    fireEvent.click(nodeButton);
    expect(defaultProps.toggleSkill).toHaveBeenCalledWith('Node.js');
  });
});
