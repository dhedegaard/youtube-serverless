import test, { expect } from '@playwright/test'
import { SERVER_ENV } from '../src/utils/server-env'

test('/api/fetch-data should return 200', async ({ request }) => {
  const response = await request.post('/api/fetch-data', {
    headers: {
      Authorization: SERVER_ENV.SECRET,
    },
  })

  expect(response.status()).toBe(200)
})

test('/api/refresh-channels should return 200', async ({ request }) => {
  const response = await request.post('/api/refresh-channels', {
    headers: {
      Authorization: SERVER_ENV.SECRET,
    },
  })

  expect(response.status()).toBe(200)
})

test('/api/dump-channels should return 200', async ({ request }) => {
  const response = await request.get('/api/dump-channels', {
    headers: {
      Authorization: SERVER_ENV.SECRET,
    },
  })

  expect(response.status()).toBe(200)
})

test('/api/add-channel should return 404 if channel not found', async ({ request }) => {
  const response = await request.post(
    `/api/add-channel?${new URLSearchParams({
      // No store arg, means that the channel is not persisted.
      channelId: 'does-not-exist',
    })}`,
    {
      headers: {
        Authorization: SERVER_ENV.SECRET,
      },
    }
  )

  expect(response.status()).toBe(404)
})
