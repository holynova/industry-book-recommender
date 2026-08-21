import { useEffect, useMemo, useState } from 'react'
import books from './data/books.json'
import './App.css'

const sortOptions = {
  likes: (a, b) => b.likes - a.likes || a.title.localeCompare(b.title, 'zh-CN'),
  title: (a, b) => a.title.localeCompare(b.title, 'zh-CN'),
  category: (a, b) => a.category.localeCompare(b.category, 'zh-CN') || a.title.localeCompare(b.title, 'zh-CN'),
}

function useDoubanMode() {
  const [mode, setMode] = useState('mobile')

  useEffect(() => {
    if (!window.matchMedia) return

    const desktopInput = window.matchMedia('(pointer: fine) and (hover: hover)')
    const mobileUserAgent = navigator.userAgentData?.mobile ?? /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
    const updateMode = () => setMode(!mobileUserAgent && desktopInput.matches ? 'desktop' : 'mobile')

    updateMode()
    desktopInput.addEventListener('change', updateMode)
    return () => desktopInput.removeEventListener('change', updateMode)
  }, [])

  return mode
}

function doubanSearchUrl(book, mode) {
  const terms = [book.title, book.author].filter(Boolean).join(' ')
  const encodedTerms = encodeURIComponent(terms)
  return mode === 'desktop'
    ? `https://www.douban.com/search?cat=1001&q=${encodedTerms}`
    : `https://m.douban.com/search?query=${encodedTerms}&type=1001`
}

function App() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('全部')
  const [sort, setSort] = useState('likes')
  const doubanMode = useDoubanMode()

  const categories = useMemo(
    () => ['全部', ...new Set(books.map((book) => book.category).sort((a, b) => a.localeCompare(b, 'zh-CN')))],
    [],
  )

  const visibleBooks = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase()
    return books
      .filter((book) => category === '全部' || book.category === category)
      .filter((book) => !normalizedQuery || [book.title, book.author, book.category, book.sourceAuthor].join(' ').toLocaleLowerCase().includes(normalizedQuery))
      .sort(sortOptions[sort])
  }, [category, query, sort])

  const filtersActive = query || category !== '全部' || sort !== 'likes'

  function resetFilters() {
    setQuery('')
    setCategory('全部')
    setSort('likes')
  }

  return (
    <main className="app-shell">
      <header className="masthead">
        <div>
          <p className="eyebrow">COMMENT-BASED BOOK INDEX</p>
          <h1>评论区图书列表</h1>
          <p className="intro">一次浏览全部评论书目候选。可按标题、作者、学科或评论者筛选，并直接前往豆瓣继续查找版本信息。</p>
        </div>
        <dl className="source-stats" aria-label="数据概览">
          <div><dt>书目候选</dt><dd>{books.length}</dd></div>
          <div><dt>已解析评论</dt><dd>578</dd></div>
          <div><dt>原帖评论</dt><dd>2,747</dd></div>
        </dl>
      </header>

      <section className="toolbar" aria-label="图书筛选">
        <label className="search-field" htmlFor="search">
          <span>搜索</span>
          <input id="search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="书名、作者、学科或评论者" />
        </label>
        <label htmlFor="category">
          <span>分类</span>
          <select id="category" value={category} onChange={(event) => setCategory(event.target.value)}>
            {categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label htmlFor="sort">
          <span>排序</span>
          <select id="sort" value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="likes">按评论点赞</option>
            <option value="title">按书名</option>
            <option value="category">按分类</option>
          </select>
        </label>
        <div className="toolbar-status" aria-live="polite">
          <span>{filtersActive ? `筛选结果 · ${visibleBooks.length} 条` : `全部书目 · ${books.length} 条`}</span>
          <button type="button" onClick={resetFilters} disabled={!filtersActive}>重置筛选</button>
        </div>
      </section>

      <section className="list-heading" aria-labelledby="list-title">
        <div>
          <p className="section-kicker">全部结果</p>
          <h2 id="list-title">图书列表</h2>
        </div>
        <p>显示 {visibleBooks.length} / {books.length} 条</p>
      </section>

      {visibleBooks.length ? (
        <section className="book-grid" aria-label="图书列表">
          {visibleBooks.map((book) => (
            <article className="book-card" key={`${book.title}-${book.category}`}>
              <div className="book-main">
                <div className="book-meta">
                  <span>{book.category}</span>
                  <span>{book.confidence}</span>
                </div>
                <h3>{book.title}</h3>
                <p className="author">{book.author || '作者信息待补充'}</p>
                <p className="comment-source">评论者：{book.sourceAuthor || '未记录'}{book.mentions ? ` · 提及 ${book.mentions} 次` : ''}</p>
              </div>
              <div className="book-footer">
                <p><strong>{book.likes}</strong> 原评论点赞</p>
                <a href={doubanSearchUrl(book, doubanMode)} target="_blank" rel="noreferrer">
                  在豆瓣搜索（{doubanMode === 'desktop' ? '桌面版' : '移动版'}） <span aria-hidden="true">↗</span>
                </a>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="empty-state" aria-live="polite">
          <h2>没有找到匹配书目</h2>
          <p>试试缩短关键词，或重置筛选后重新查找。</p>
          <button type="button" onClick={resetFilters}>重置筛选</button>
        </section>
      )}

      <footer>
        <p>书名来自小红书主评论与楼中楼文本解析。样本未覆盖全部评论，部分候选来自评论区汇总。</p>
        <p>豆瓣链接按“书名 + 作者”检索，以便你选择准确的版本。</p>
      </footer>
    </main>
  )
}

export default App
