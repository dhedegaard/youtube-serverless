import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'New youtube videos',
    short_name: 'Youtube',
    start_url: '/',
    display: 'standalone',
    background_color: '#212121',
    description: 'Showing the newest youtube videos from various channels.',
    icons: [
      {
        src: '/favicon.png',
        sizes: '256x256',
        type: 'image/png',
      },
    ],
  }
}
