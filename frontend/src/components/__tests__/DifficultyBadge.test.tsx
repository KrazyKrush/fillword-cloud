import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import DifficultyBadge from '../DifficultyBadge';

describe('DifficultyBadge component', () => {
  it('отображает "Лёгкий" для easy', () => {
    render(<DifficultyBadge difficulty="easy" />);
    expect(screen.getByText('Лёгкий')).toBeDefined();
  });

  it('отображает "Средний" для medium', () => {
    render(<DifficultyBadge difficulty="medium" />);
    expect(screen.getByText('Средний')).toBeDefined();
  });

  it('отображает "Сложный" для hard', () => {
    render(<DifficultyBadge difficulty="hard" />);
    expect(screen.getByText('Сложный')).toBeDefined();
  });

  it('применяет зелёный класс для лёгкого', () => {
    render(<DifficultyBadge difficulty="easy" />);
    const badge = screen.getByText('Лёгкий');
    expect(badge.className).toContain('text-emerald');
  });

  it('применяет красный класс для сложного', () => {
    render(<DifficultyBadge difficulty="hard" />);
    const badge = screen.getByText('Сложный');
    expect(badge.className).toContain('text-red');
  });
});