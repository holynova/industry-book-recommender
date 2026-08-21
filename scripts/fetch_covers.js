import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const BOOKS_JSON_PATH = path.resolve(__dirname, '../src/data/books.json')
const COVERS_DIR = path.resolve(__dirname, '../public/covers')

if (!fs.existsSync(COVERS_DIR)) {
  fs.mkdirSync(COVERS_DIR, { recursive: true })
}

const books = JSON.parse(fs.readFileSync(BOOKS_JSON_PATH, 'utf8'))

function sanitizeTitle(title) {
  return title
    .replace(/[《》]/g, '')
    .replace(/（[^）]+）/g, '')
    .replace(/\([^)]+\)/g, '')
    .trim()
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function searchDoubanBook(query) {
  const url = `https://www.douban.com/search?cat=1001&q=${encodeURIComponent(query)}`
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Cookie': 'bid=' + Math.random().toString(36).substring(2, 11),
      },
    })
    if (!res.ok) return null
    const html = await res.text()

    const imgMatch = html.match(/src="(https:\/\/[^"']+\.doubanio\.com\/view\/subject\/[^"]+)"/)
    const ratingMatch = html.match(/<span class="rating_nums">([\d.]+)<\/span>/)
    const metaMatch = html.match(/<span class="subject-cast">([\s\S]*?)<\/span>/)
    const linkMatch = html.match(/href="(https:\/\/book\.douban\.com\/subject\/\d+\/)"/)

    let coverUrl = imgMatch ? imgMatch[1].replace('/s/public/', '/l/public/') : null
    let rating = ratingMatch ? ratingMatch[1] : null
    let meta = metaMatch ? metaMatch[1].trim().replace(/\s+/g, ' ') : null
    let doubanUrl = linkMatch ? linkMatch[1] : null

    return { coverUrl, rating, meta, doubanUrl, source: 'douban' }
  } catch {
    return null
  }
}

async function searchWereadBook(query) {
  const url = `https://weread.qq.com/web/search/global?keyword=${encodeURIComponent(query)}`
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
      },
    })
    if (!res.ok) return null
    const data = await res.json()
    const firstBook = data.books?.[0]?.bookInfo
    if (!firstBook) return null

    let coverUrl = firstBook.cover
    if (coverUrl) {
      coverUrl = coverUrl.replace('/s_', '/t6_')
    }

    const ratingVal = firstBook.newRating ? (firstBook.newRating / 100).toFixed(1) : null
    const meta = [firstBook.author, firstBook.publisher].filter(Boolean).join(' / ')

    return {
      coverUrl,
      rating: ratingVal,
      meta,
      author: firstBook.author,
      publisher: firstBook.publisher,
      intro: firstBook.intro,
      source: 'weread',
    }
  } catch {
    return null
  }
}

async function downloadImage(url, destPath) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': url.includes('doubanio') ? 'https://book.douban.com/' : 'https://weread.qq.com/',
      },
    })
    if (!res.ok) return false
    const buffer = Buffer.from(await res.arrayBuffer())
    if (buffer.length < 500) return false
    fs.writeFileSync(destPath, buffer)
    return true
  } catch (err) {
    console.error(`Error downloading image ${url}:`, err.message)
    return false
  }
}

async function main() {
  console.log(`Starting comprehensive cover and metadata collection for ${books.length} books...`)
  let updatedCount = 0
  let downloadedCount = 0

  for (let i = 0; i < books.length; i++) {
    const book = books[i]
    const bookIndexStr = String(i + 1).padStart(3, '0')
    const localCoverFilename = `book_${bookIndexStr}.jpg`
    const localCoverPath = path.join(COVERS_DIR, localCoverFilename)
    const relativeCoverUrl = `covers/${localCoverFilename}`

    const cleanTitle = sanitizeTitle(book.title)
    const searchTerms = [cleanTitle, book.author].filter(Boolean).join(' ')

    // If local cover already exists and valid, skip
    if (fs.existsSync(localCoverPath) && fs.statSync(localCoverPath).size > 1000 && book.cover && book.rating) {
      continue
    }

    process.stdout.write(`[${i + 1}/${books.length}] ${book.title}... `)

    // Try Douban first
    let data = await searchDoubanBook(searchTerms)

    // If Douban didn't return cover, fallback to Weread
    if (!data || !data.coverUrl) {
      const wereadData = await searchWereadBook(cleanTitle)
      if (wereadData && wereadData.coverUrl) {
        data = {
          ...data,
          coverUrl: wereadData.coverUrl,
          rating: data?.rating || wereadData.rating,
          meta: data?.meta || wereadData.meta,
          author: wereadData.author,
          source: 'weread',
        }
      }
    }

    if (data && data.coverUrl) {
      if (data.rating) book.rating = data.rating
      if (data.doubanUrl) book.doubanUrl = data.doubanUrl
      if (data.meta) book.doubanMeta = data.meta
      if ((!book.author || book.author.trim() === '') && data.author) {
        book.author = data.author
      }

      const ok = await downloadImage(data.coverUrl, localCoverPath)
      if (ok) {
        book.cover = relativeCoverUrl
        book.remoteCover = data.coverUrl
        downloadedCount++
        process.stdout.write(`OK (${data.source}: ${data.rating || '—'}) ✓\n`)
      } else {
        book.remoteCover = data.coverUrl
        process.stdout.write(`Remote OK\n`)
      }
      updatedCount++
    } else {
      process.stdout.write(`No cover\n`)
    }

    if (i % 10 === 0 || i === books.length - 1) {
      fs.writeFileSync(BOOKS_JSON_PATH, JSON.stringify(books, null, 2), 'utf8')
    }

    await sleep(250)
  }

  fs.writeFileSync(BOOKS_JSON_PATH, JSON.stringify(books, null, 2), 'utf8')
  console.log(`\nFinished! Total updated: ${updatedCount}, newly downloaded: ${downloadedCount}`)
}

main().catch(console.error)
