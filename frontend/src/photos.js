// Real product photos (from Wikimedia Commons, free licences), stored in public/images/products/<slug>.jpg.
// Credits for each photo are in photos.json and shown on the Photo credits page.
import { asset } from './api'
import PHOTOS from './photos.json'

export { PHOTOS }

const slugOf = (src) => (String(src || '').match(/products\/([a-z-]+)\.jpg/) || [])[1]

export const photoFor = (slug) => asset(PHOTOS[slug]?.file || `images/products/${slug}.jpg`)
export const creditFor = (src) => PHOTOS[slugOf(src)] || null

// Kept for compatibility: product photos are bundled with the site, so no fallback is needed
export function installPhotoFallback() {}
