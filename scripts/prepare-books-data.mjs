import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const sourcePath = process.argv[2]
const outputPath = resolve('src/data/books.json')

if (!sourcePath) {
  throw new Error('Usage: node scripts/prepare-books-data.mjs /path/to/books.generated.json')
}

const source = JSON.parse(await readFile(resolve(sourcePath), 'utf8'))
const books = source.books.map(({ title, author, category, confidence, likes, sourceAuthor, mentions }) => ({
  title,
  author,
  category,
  confidence,
  likes,
  sourceAuthor,
  mentions,
}))

await writeFile(outputPath, `${JSON.stringify(books, null, 2)}\n`)
console.log(`Wrote ${books.length} books to ${outputPath}`)
