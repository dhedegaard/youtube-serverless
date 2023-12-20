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
  const responseJson: unknown = await response.json()
  expect(responseJson).toMatchObject({
    error: 'Channel not found for params: {"channelId":"does-not-exist"}',
  })
})

test('/api/add-channel should return 206 if channel found by username, but should not save changes', async ({
  request,
}) => {
  const response = await request.post(
    `/api/add-channel?${new URLSearchParams({
      // No store arg, means that the channel is not persisted.
      username: 'mobiletechreview',
    })}`,
    {
      headers: {
        Authorization: SERVER_ENV.SECRET,
      },
    }
  )

  expect(response.status()).toBe(206)
  const responseJson: unknown = await response.json()
  expect(responseJson).toMatchObject({
    error: 'store is not "true", nothing is saved',
    channelTitle: 'MobileTechReview',
    channelId: 'UCW6J17hZ_Vgr6cQgd_kHt5A',
  })
})

test('/api/add-channel should return 206 if channel found by channelId, but should not save changes', async ({
  request,
}) => {
  const response = await request.post(
    `/api/add-channel?${new URLSearchParams({
      // No store arg, means that the channel is not persisted.
      channelId: 'UCW6J17hZ_Vgr6cQgd_kHt5A',
    })}`,
    {
      headers: {
        Authorization: SERVER_ENV.SECRET,
      },
    }
  )

  expect(response.status()).toBe(206)
  const responseJson: unknown = await response.json()
  expect(responseJson).toMatchObject({
    error: 'store is not "true", nothing is saved',
    channelTitle: 'MobileTechReview',
    channelId: 'UCW6J17hZ_Vgr6cQgd_kHt5A',
  })
})
