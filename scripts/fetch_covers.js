import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const BOOKS_JSON_PATH = path.resolve(__dirname, '../src/data/books.json')
const COVERS_DIR = path.resolve(__dirname, '../public/covers')
const FORCE = process.argv.includes('--force')

if (!fs.existsSync(COVERS_DIR)) {
  fs.mkdirSync(COVERS_DIR, { recursive: true })
}

const books = JSON.parse(fs.readFileSync(BOOKS_JSON_PATH, 'utf8'))

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  Accept: 'application/json,text/html,*/*',
  Referer: 'https://book.douban.com/',
  Cookie: `bid=${Math.random().toString(36).slice(2, 13)}`,
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function sanitizeTitle(title) {
  return (title || '')
    .replace(/[《》]/g, '')
    .replace(/（[^）]*）/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

const PUNCTUATION = /[【】（）()〈〉《》·．.,，、:：;；!！?？'"“”‘’\-–—_/\\|~`@#$%^&*+=<>\s]+/g

function normalize(text) {
  return (text || '')
    .toLowerCase()
    .replace(PUNCTUATION, '')
    .replace(/\]/g, '')
    .replace(/\[/g, '')
}

function similarity(a, b) {
  const na = normalize(a)
  const nb = normalize(b)
  if (!na || !nb) return 0
  if (na === nb) return 1
  if (na.includes(nb) || nb.includes(na)) return Math.max(ratio(na, nb), 0.9)
  return ratio(na, nb)
}

function ratio(a, b) {
  if (!a.length || !b.length) return 0
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const curr = [i]
    for (let j = 1; j <= b.length; j++) {
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      )
    }
    prev = curr
  }
  return 1 - prev[b.length] / Math.max(a.length, b.length)
}

function coverId(url) {
  const match = /\/(s\d{6,}\.jpg)/.exec(url || '')
  return match ? match[1] : null
}

function stripTags(html) {
  return (html || '').replace(/<br\s*\/?>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

async function fetchDouban(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { headers: HEADERS })
      if (res.status === 403 || res.status === 429) {
        await sleep(3000 * (attempt + 1))
        continue
      }
      if (!res.ok) return null
      return await res.text()
    } catch {
      await sleep(1500)
    }
  }
  return null
}

async function suggestDouban(query) {
  const body = await fetchDouban(`https://book.douban.com/j/subject_suggest?q=${encodeURIComponent(query)}`)
  if (!body) return []
  let data
  try {
    data = JSON.parse(body)
  } catch {
    return []
  }
  if (!Array.isArray(data)) return []
  return data
    .filter((item) => item.type === 'b' && item.id)
    .map((item) => ({
      id: item.id,
      title: item.title,
      author: item.author_name,
      year: item.year,
      cover: item.pic,
      coverId: coverId(item.pic),
      url: `https://book.douban.com/subject/${item.id}/`,
    }))
}

async function fetchSubject(id) {
  const html = await fetchDouban(`https://book.douban.com/subject/${id}/`)
  if (!html) return null
  const infoBlock = (/<div id="info"[\s\S]{0,2000}?<\/div>/.exec(html) || [''])[0]
  const field = (label) => {
    const re = new RegExp(`<span class="pl">\\s*${label}\\s*:?\\s*</span>\\s*:?\\s*([\\s\\S]{0,400}?)(?:<br)`)
    const match = re.exec(infoBlock)
    return match ? stripTags(match[1]) : null
  }
  const rating = /property="v:average">\s*([\d.]+)/.exec(html)
  const votes = /property="v:votes">(\d+)/.exec(html)
  const pics = html.match(/\/(s\d{6,}\.jpg)/g) || []
  return {
    title: stripTags((/<span property="v:itemreviewed">\s*([^<]*)/.exec(html) || [])[1]),
    author: field('作者'),
    translator: field('译者'),
    publisher: field('出版社'),
    pubdate: field('出版年'),
    isbn: field('ISBN'),
    rating: rating ? rating[1] : null,
    votes: votes ? Number(votes[1]) : 0,
    coverId: pics.length ? pics[0].slice(1) : null,
  }
}

async function downloadImage(url, destPath) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': HEADERS['User-Agent'],
        Referer: 'https://book.douban.com/',
      },
    })
    if (!res.ok) return false
    const buffer = Buffer.from(await res.arrayBuffer())
    if (buffer.length < 2000) return false
    fs.writeFileSync(destPath, buffer)
    return true
  } catch {
    return false
  }
}

function buildMeta(subject) {
  return [subject.author, subject.translator, subject.publisher, subject.pubdate]
    .map((part) => (part || '').trim())
    .filter((part) => part && part !== 'None')
    .join(' / ')
}

async function resolveBook(book) {
  const cleanTitle = sanitizeTitle(book.title)
  const queries = [`${cleanTitle} ${book.author || ''}`.trim(), cleanTitle].filter(Boolean)
  const pool = new Map()
  for (const query of queries) {
    for (const candidate of await suggestDouban(query)) {
      if (!pool.has(candidate.id)) pool.set(candidate.id, candidate)
    }
    await sleep(1200)
    if (pool.size >= 12) break
  }
  if (pool.size === 0) return { status: 'no-candidates' }

  // Same cover image already on the card means the same edition: nothing to fix.
  const currentCoverId = coverId(book.remoteCover)
  if (currentCoverId) {
    for (const candidate of pool.values()) {
      if (candidate.coverId === currentCoverId) {
        return { status: 'cover-match', candidate }
      }
    }
  }

  const ranked = [...pool.values()]
    .map((candidate) => ({
      candidate,
      score: 0.55 * similarity(cleanTitle, candidate.title) + 0.45 * similarity(book.author, candidate.author),
    }))
    .sort((a, b) => b.score - a.score)

  const best = ranked[0]
  const titleSim = similarity(cleanTitle, best.candidate.title)
  const authorSim = similarity(book.author, best.candidate.author)
  if (titleSim < 0.8 || authorSim < 0.4 || best.score < 0.65) {
    return {
      status: 'rejected',
      detail: `title ${titleSim.toFixed(2)} / author ${authorSim.toFixed(2)}`,
      candidates: ranked.slice(0, 3).map((r) => `${r.candidate.title} — ${r.candidate.author || '?'}`),
    }
  }
  return { status: 'matched', candidate: best.candidate }
}

async function main() {
  console.log(`Verifying covers against Douban for ${books.length} books (${FORCE ? 'force' : 'skip verified'})...`)
  let changed = 0
  let unchanged = 0
  let skipped = 0

  for (let i = 0; i < books.length; i++) {
    const book = books[i]
    const index = String(i + 1).padStart(3, '0')
    const coverPath = path.join(COVERS_DIR, `book_${index}.jpg`)

    if (!FORCE && book.doubanUrl && book.doubanMeta && fs.existsSync(coverPath)) {
      skipped++
      continue
    }

    process.stdout.write(`[${index}] ${book.title} ... `)
    const resolved = await resolveBook(book)

    if (resolved.status !== 'matched' && resolved.status !== 'cover-match') {
      const extra = resolved.detail ? ` (${resolved.detail})` : ''
      console.log(`${resolved.status}${extra} — left untouched`)
      if (resolved.candidates) resolved.candidates.forEach((c) => console.log(`        candidate: ${c}`))
      skipped++
      continue
    }

    const candidate = resolved.candidate
    const subject = await fetchSubject(candidate.id)
    if (!subject) {
      console.log('subject page unavailable — left untouched')
      skipped++
      await sleep(1500)
      continue
    }

    const meta = buildMeta(subject)
    const changes = []
    if (meta && meta !== book.doubanMeta) {
      book.doubanMeta = meta
      changes.push('meta')
    }
    if (subject.rating && subject.votes > 0 && book.rating !== subject.rating) {
      book.rating = subject.rating
      changes.push('rating')
    }
    if (book.doubanUrl !== candidate.url) {
      book.doubanUrl = candidate.url
      changes.push('url')
    }

    const coverChanged = coverId(book.remoteCover) !== subject.coverId
    if (coverChanged) {
      const ok = await downloadImage(
        `https://img9.doubanio.com/view/subject/l/public/${subject.coverId}`,
        coverPath,
      )
      if (ok) {
        book.cover = `covers/book_${index}.jpg`
        book.remoteCover = `https://img9.doubanio.com/view/subject/l/public/${subject.coverId}`
        changes.push('cover')
      } else {
        console.log('cover download failed — metadata kept, cover untouched')
      }
    }

    if (changes.length === 0) {
      unchanged++
      console.log('already correct')
    } else {
      changed++
      console.log(`updated: ${changes.join(', ')}`)
    }

    fs.writeFileSync(BOOKS_JSON_PATH, `${JSON.stringify(books, null, 2)}\n`, 'utf8')
    await sleep(1500)
  }

  fs.writeFileSync(BOOKS_JSON_PATH, `${JSON.stringify(books, null, 2)}\n`, 'utf8')
  console.log(`\nDone. updated ${changed}, already correct ${unchanged}, skipped ${skipped}`)
}

main().catch(console.error)
