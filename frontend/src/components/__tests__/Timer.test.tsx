import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Timer from '../Timer'

describe('Timer component', () => {
  it('отображает начальное время 00:00', () => {
    render(<Timer startTime={new Date().toISOString()} isCompleted={false} />)
    expect(screen.getByText('00:00')).toBeDefined()
  })

  it('отображает финальное время после завершения', () => {
    render(<Timer startTime="2024-01-01T00:00:00Z" isCompleted={true} finalTime={125} />)
    expect(screen.getByText('02:05')).toBeDefined()
  })

  it('применяет зелёный цвет после завершения', () => {
    const { container } = render(<Timer startTime="2024-01-01T00:00:00Z" isCompleted={true} finalTime={60} />)
    const div = container.firstChild as HTMLElement
    expect(div.className).toContain('text-emerald')
  })

  it('применяет синий цвет во время разгадывания', () => {
    const { container } = render(<Timer startTime={new Date().toISOString()} isCompleted={false} />)
    const div = container.firstChild as HTMLElement
    expect(div.className).toContain('text-indigo')
  })
})