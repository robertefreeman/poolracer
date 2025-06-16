// Cloudflare Worker for Rolling Hills Racers
// Serves static assets and handles routing

import { getAssetFromKV, mapRequestToAsset } from '@cloudflare/kv-asset-handler'

/**
 * The DEBUG flag will do two things that help during development:
 * 1. we will skip caching on the edge, which makes it easier to
 *    debug.
 * 2. we will return an error message on exception in your Response rather
 *    than the default 404.html page.
 */
const DEBUG = false

addEventListener('fetch', event => {
  try {
    event.respondWith(handleEvent(event))
  } catch (e) {
    if (DEBUG) {
      return event.respondWith(
        new Response(e.message || e.toString(), {
          status: 500,
        }),
      )
    }
    event.respondWith(new Response('Internal Error', { status: 500 }))
  }
})

async function handleEvent(event) {
  const url = new URL(event.request.url)
  let options = {}

  /**
   * You can add custom logic to how we fetch your assets
   * by configuring the function `mapRequestToAsset`
   */
  options.mapRequestToAsset = request => {
    // Handle root path
    if (url.pathname === '/') {
      return new Request(`${url.origin}/index.html`, request)
    }
    // Return the request as-is for other paths
    return request
  }

  try {
    if (DEBUG) {
      // customize caching
      options.cacheControl = {
        bypassCache: true,
      }
    }

    // Add security headers
    const response = await getAssetFromKV(event, options)
    
    // Clone the response so we can modify headers
    const newResponse = new Response(response.body, response)
    
    // Add security and performance headers
    newResponse.headers.set('X-Frame-Options', 'DENY')
    newResponse.headers.set('X-Content-Type-Options', 'nosniff')
    newResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    newResponse.headers.set('Permissions-Policy', 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()')
    
    // Cache static assets
    if (url.pathname.includes('/src/') || url.pathname.includes('.js') || url.pathname.includes('.css')) {
      newResponse.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
    } else if (url.pathname.includes('.html') || url.pathname === '/') {
      newResponse.headers.set('Cache-Control', 'public, max-age=3600')
    }

    return newResponse

  } catch (e) {
    // if an error is thrown try to serve the asset at 404.html
    if (!DEBUG) {
      try {
        let notFoundResponse = await getAssetFromKV(event, {
          mapRequestToAsset: req => new Request(`${new URL(req.url).origin}/404.html`, req),
        })

        return new Response(notFoundResponse.body, { ...notFoundResponse, status: 404 })
      } catch (e) {}
    }

    return new Response(e.message || e.toString(), { status: 500 })
  }
}

