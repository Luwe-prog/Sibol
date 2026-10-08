import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AuthContext } from '../context/useAuth.js'
import LoginPage from './LoginPage.jsx'

const failWith = (response) => vi.fn(() => Promise.reject({ response }))

async function tryToLogIn(login) {
  const user = userEvent.setup()

  render(
    <AuthContext.Provider value={{ login }}>
      <LoginPage />
    </AuthContext.Provider>,
  )

  await user.type(screen.getByLabelText('Email address'), 'maria@example.com')
  await user.type(screen.getByLabelText('Password'), 'secret-word')
  await user.click(screen.getByRole('button', { name: 'Log in' }))

  return user
}

describe('login page', () => {
  it('logs in with the typed email and password', async () => {
    const login = vi.fn(() => Promise.resolve())

    await tryToLogIn(login)

    expect(login).toHaveBeenCalledWith('maria@example.com', 'secret-word')
    expect(screen.getByRole('alert')).toBeEmptyDOMElement()
  })

  it('on wrong details keeps the email, clears the password and moves focus to it', async () => {
    await tryToLogIn(failWith({ status: 422, data: { errors: { email: ['The email or password is incorrect.'] } } }))

    expect(await screen.findByText('The email or password is incorrect.')).toBeInTheDocument()
    expect(screen.getByLabelText('Email address')).toHaveValue('maria@example.com')
    expect(screen.getByLabelText('Email address')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Password')).toHaveValue('')
    expect(screen.getByLabelText('Password')).toHaveFocus()
  })

  it('explains a deactivated account without marking the fields as wrong', async () => {
    await tryToLogIn(failWith({ status: 403, data: { code: 'account_deactivated' } }))

    expect(await screen.findByText('This account has been deactivated.')).toBeInTheDocument()
    expect(screen.getByText('Ask your Super Admin to turn it back on.')).toBeInTheDocument()
    expect(screen.getByLabelText('Email address')).toHaveAttribute('aria-invalid', 'false')
  })

  it('after too many tries, disables the button and counts down', async () => {
    await tryToLogIn(failWith({ status: 429, data: {}, headers: { 'retry-after': '45' } }))

    expect(await screen.findByText('Too many tries.')).toBeInTheDocument()

    const button = screen.getByRole('button', { name: /Try again in 0:4\d/ })
    expect(button).toBeDisabled()
  })

  it('keeps both values when the server cannot be reached, so a retry is one tap', async () => {
    await tryToLogIn(vi.fn(() => Promise.reject({})))

    expect(await screen.findByText('Cannot reach the server.')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toHaveValue('secret-word')
    expect(screen.getByRole('button', { name: 'Log in' })).toBeEnabled()
  })

  it('shows and hides the password', async () => {
    const user = userEvent.setup()
    render(
      <AuthContext.Provider value={{ login: vi.fn() }}>
        <LoginPage />
      </AuthContext.Provider>,
    )

    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password')

    await user.click(screen.getByRole('button', { name: 'Show password' }))
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'text')

    await user.click(screen.getByRole('button', { name: 'Hide password' }))
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password')
  })
})
