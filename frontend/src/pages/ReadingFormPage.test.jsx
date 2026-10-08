import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../api/client.js'
import ReadingFormPage from './ReadingFormPage.jsx'

vi.mock('../api/client.js', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
  readError: (error) => {
    const fields = {}
    Object.entries(error.response?.data?.errors ?? {}).forEach(([field, messages]) => {
      fields[field] = messages[0]
    })
    return { message: error.response?.data?.message ?? 'Something went wrong.', fields }
  },
}))

const zone = {
  id: 7,
  name: 'Bed A',
  environment: 'rooftop',
  crop: { name: 'Pechay', soil_moisture_min: 60, soil_moisture_max: 80, temp_min: 18, temp_max: 30, humidity_min: 60, humidity_max: 80 },
}

const rejectWith = (status, data) => Promise.reject({ response: { status, data } })

async function openFormAndFill(soil, temperature, humidity) {
  const user = userEvent.setup()

  render(
    <MemoryRouter initialEntries={['/zones/7/readings/new']}>
      <Routes>
        <Route path="/zones/:zoneId/readings/new" element={<ReadingFormPage />} />
        <Route path="/readings/:readingId" element={<p>result page</p>} />
      </Routes>
    </MemoryRouter>,
  )

  await user.type(await screen.findByLabelText('Soil moisture'), soil)
  await user.type(screen.getByLabelText('Temperature'), temperature)
  await user.type(screen.getByLabelText('Humidity'), humidity)

  return user
}

describe('reading entry form', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.get.mockResolvedValue({ data: { zone } })
  })

  it('shows the crop ideal range as a hint and goes to the result after saving', async () => {
    api.post.mockResolvedValue({ data: { reading: { id: 31 } } })

    const user = await openFormAndFill('45', '25', '70')

    expect(screen.getByText('Ideal for Pechay: 60–80%')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Save and see result' }))

    expect(await screen.findByText('result page')).toBeInTheDocument()
    expect(api.post).toHaveBeenCalledTimes(1)

    const [url, payload] = api.post.mock.calls[0]
    expect(url).toBe('/zones/7/readings')
    expect(payload).toMatchObject({ soil_moisture: '45', temperature: '25', humidity: '70', confirm_suspicious: false, notes: null })
  })

  it('asks for confirmation on an unusual reading, then saves it when confirmed', async () => {
    api.post
      .mockImplementationOnce(() => rejectWith(409, { code: 'suspicious_reading', reasons: ['Temperature is above 45 °C.'] }))
      .mockResolvedValueOnce({ data: { reading: { id: 32 } } })

    const user = await openFormAndFill('70', '48', '70')
    await user.click(screen.getByRole('button', { name: 'Save and see result' }))

    expect(await screen.findByText('Temperature is above 45 °C.')).toBeInTheDocument()
    expect(screen.queryByText('result page')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Save anyway' }))

    expect(await screen.findByText('result page')).toBeInTheDocument()
    expect(api.post.mock.calls[1][1]).toMatchObject({ temperature: '48', confirm_suspicious: true })
  })

  it('hides the unusual-reading warning once a value is corrected', async () => {
    api.post.mockImplementationOnce(() => rejectWith(409, { code: 'suspicious_reading', reasons: ['Temperature is above 45 °C.'] }))

    const user = await openFormAndFill('70', '48', '70')
    await user.click(screen.getByRole('button', { name: 'Save and see result' }))
    await screen.findByText('Temperature is above 45 °C.')

    await user.clear(screen.getByLabelText('Temperature'))

    expect(screen.queryByText('Temperature is above 45 °C.')).not.toBeInTheDocument()
  })

  it('shows the server message beside a rejected field', async () => {
    api.post.mockImplementationOnce(() =>
      rejectWith(422, { message: 'The reading time cannot be in the future.', errors: { recorded_at: ['The reading time cannot be in the future.'] } }),
    )

    const user = await openFormAndFill('70', '25', '70')
    await user.click(screen.getByRole('button', { name: 'Save and see result' }))

    expect(await screen.findAllByText('The reading time cannot be in the future.')).toHaveLength(2)
    expect(screen.queryByText('result page')).not.toBeInTheDocument()
  })
})
