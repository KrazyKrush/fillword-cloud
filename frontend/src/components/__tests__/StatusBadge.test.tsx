import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import StatusBadge from '../StatusBadge';

describe('StatusBadge component', () => {
  it('отображает "На модерации" для pending', () => {
    render(<StatusBadge status="pending" />);
    expect(screen.getByText('На модерации')).toBeDefined();
  });

  it('отображает "Опубликован" для published', () => {
    render(<StatusBadge status="published" />);
    expect(screen.getByText('Опубликован')).toBeDefined();
  });

  it('отображает "Отклонён" для rejected', () => {
    render(<StatusBadge status="rejected" />);
    expect(screen.getByText('Отклонён')).toBeDefined();
  });

  it('применяет жёлтый класс для pending', () => {
    render(<StatusBadge status="pending" />);
    const badge = screen.getByText('На модерации');
    expect(badge.className).toContain('text-amber');
  });

  it('применяет зелёный класс для published', () => {
    render(<StatusBadge status="published" />);
    const badge = screen.getByText('Опубликован');
    expect(badge.className).toContain('text-emerald');
  });
});