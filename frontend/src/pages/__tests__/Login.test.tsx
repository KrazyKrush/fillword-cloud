import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../../context/AuthContext'
import Login from '../Login'

vi.mock('../../api/client', () => ({
  default: {
    post: vi.fn(() => Promise.resolve({
      data: { userId: 1, username: 'testuser', role: 'user', accessToken: 'fake-token' },
    })),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}))

describe('Login page', () => {
  it('отображает форму входа', () => {
    render(<BrowserRouter><AuthProvider><Login /></AuthProvider></BrowserRouter>)
    expect(screen.getByText('Вход')).toBeDefined()
  })
})