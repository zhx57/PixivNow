import { VercelRequest, VercelResponse } from '@vercel/node'
import { formatInTimeZone } from 'date-fns-tz'
import { PXIMG_BASEURL_I, ajax } from './utils.js'

export default async (req: VercelRequest, res: VercelResponse) => {
  const requestImage =
    (req.headers.accept?.includes('image') || req.query.format === 'image') &&
    req.query.format !== 'json'

  try {
    // Use ranking API as a reliable source for random/discovery content
    // /ajax/ranking/top returns { contents: [...] } after unwrapping in utils.ts
    const { data } = await ajax({
      url: '/ajax/ranking/top',
      params: {
        mode: 'daily',
        content: 'illust',
        limit: requestImage ? '1' : req.query.max ?? '18',
      },
      headers: req.headers,
    })

    const rawItems = (data as any).contents ?? []

    const illusts = rawItems.map((item: any) => {
      const id = item.illust_id
      // item.illust_upload_timestamp is unix timestamp (seconds)
      const date = new Date(item.illust_upload_timestamp * 1000)

      const middle = `img/${formatInTimeZone(
        date,
        'Asia/Tokyo',
        'yyyy/MM/dd/HH/mm/ss'
      )}/${id}`

      return {
        id: String(id),
        title: item.title,
        alt: item.title,
        userId: String(item.user_id),
        userName: item.user_name,
        updateDate: date.toISOString(),
        tags: item.tags || [],
        urls: {
          mini: `${PXIMG_BASEURL_I}c/48x48/img-master/${middle}_p0_square1200.jpg`,
          thumb: `${PXIMG_BASEURL_I}c/250x250_80_a2/img-master/${middle}_p0_square1200.jpg`,
          small: `${PXIMG_BASEURL_I}c/540x540_70/img-master/${middle}_p0_master1200.jpg`,
          regular: `${PXIMG_BASEURL_I}img-master/${middle}_p0_master1200.jpg`,
          original: `${PXIMG_BASEURL_I}img-original/${middle}_p0.jpg`,
        },
      }
    })

    if (requestImage) {
      if (illusts.length > 0) {
        res.redirect(illusts[0].urls.regular)
      } else {
        res.status(404).send('Not Found')
      }
      return
    } else {
      res.send(illusts)
      return
    }
  } catch (e: any) {
    console.error('Random API Error:', e)
    res.status(e?.response?.status ?? 500).send(e?.response?.data ?? e)
  }
}