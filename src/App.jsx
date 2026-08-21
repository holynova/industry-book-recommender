import { useEffect, useMemo, useState, useRef } from 'react'
import initialBooks from './data/books.json'
import './App.css'

function useDoubanMode() {
  const [mode, setMode] = useState('mobile')

  useEffect(() => {
    if (!window.matchMedia) return
    const desktopInput = window.matchMedia('(pointer: fine) and (hover: hover)')
    const mobileUserAgent =
      navigator.userAgentData?.mobile ??
      /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
    const updateMode = () =>
      setMode(!mobileUserAgent && desktopInput.matches ? 'desktop' : 'mobile')

    updateMode()
    desktopInput.addEventListener('change', updateMode)
    return () => desktopInput.removeEventListener('change', updateMode)
  }, [])

  return mode
}

function doubanSearchUrl(book, mode) {
  if (book.doubanUrl) return book.doubanUrl
  const terms = [book.title, book.author].filter(Boolean).join(' ')
  const encodedTerms = encodeURIComponent(terms)
  return mode === 'desktop'
    ? `https://www.douban.com/search?cat=1001&q=${encodedTerms}`
    : `https://m.douban.com/search?query=${encodedTerms}&type=1001`
}

/* ==========================================================================
   Clean Vector SVG Icons (No emoji clutters)
   ========================================================================== */

function IconSearch({ className = '' }) {
  return (
    <svg className={`svg-icon ${className}`} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function IconBook({ className = '' }) {
  return (
    <svg className={`svg-icon ${className}`} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  )
}

function IconGrid({ className = '' }) {
  return (
    <svg className={`svg-icon ${className}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  )
}

function IconList({ className = '' }) {
  return (
    <svg className={`svg-icon ${className}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  )
}

function IconShelf({ className = '' }) {
  return (
    <svg className={`svg-icon ${className}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 4v16" />
      <path d="M20 4v16" />
      <path d="M4 18h16" />
      <path d="M4 10h16" />
    </svg>
  )
}

function IconDice({ className = '' }) {
  return (
    <svg className={`svg-icon ${className}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <circle cx="15.5" cy="15.5" r="1.5" />
      <circle cx="15.5" cy="8.5" r="1.5" />
      <circle cx="8.5" cy="15.5" r="1.5" />
    </svg>
  )
}

function IconExternal({ className = '' }) {
  return (
    <svg className={`svg-icon ${className}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  )
}

function IconClose({ className = '' }) {
  return (
    <svg className={`svg-icon ${className}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

// Category color generator
function getCategoryColor(category) {
  let hash = 0
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hues = [215, 230, 25, 150, 190, 275, 340, 40]
  const hue = hues[Math.abs(hash) % hues.length]
  return `hsl(${hue}, 38%, 26%)`
}

// Star Rating Component
function RatingStars({ rating, showNumber = true }) {
  const num = parseFloat(rating)
  if (isNaN(num) || num <= 0) {
    return <span className="rating-none-text">暂无评分</span>
  }

  const fullStars = Math.floor(num / 2)
  const hasHalf = num % 2 >= 0.8
  const emptyStars = Math.max(0, 5 - fullStars - (hasHalf ? 1 : 0))

  return (
    <div className="rating-stars-row" title={`豆瓣参考评分 ${num} 分`}>
      <span className="rating-stars-icons" aria-hidden="true">
        {'★'.repeat(fullStars)}
        {hasHalf && '★'}
        {'☆'.repeat(emptyStars)}
      </span>
      {showNumber && <span className="rating-num-val">{num.toFixed(1)}</span>}
    </div>
  )
}

// Book Cover Component
function BookCover({ book, className = '', priority = false }) {
  const [imgSrc, setImgSrc] = useState(() => {
    if (book.cover) {
      const base = import.meta.env.BASE_URL.replace(/\/$/, '')
      return `${base}/${book.cover.replace(/^\//, '')}`
    }
    return book.remoteCover || null
  })
  const [hasError, setHasError] = useState(false)

  const handleImageError = () => {
    if (book.remoteCover && imgSrc !== book.remoteCover) {
      setImgSrc(book.remoteCover)
    } else {
      setHasError(true)
    }
  }

  const catColor = getCategoryColor(book.category)

  if (!imgSrc || hasError) {
    return (
      <div
        className={`custom-cover-fallback ${className}`}
        style={{ '--cover-bg': catColor }}
        aria-label={`《${book.title}》封面`}
      >
        <div className="fallback-spine-line" />
        <div className="fallback-category-pill">{book.category}</div>
        <div className="fallback-title-wrap">
          <p className="fallback-title">{book.title}</p>
          <p className="fallback-author">{book.author || '行业读者推荐'}</p>
        </div>
        <div className="fallback-bottom-tag">行业精选书目</div>
      </div>
    )
  }

  return (
    <div className={`custom-cover-wrap ${className}`}>
      <div className="cover-spine-shadow" aria-hidden="true" />
      <img
        src={imgSrc}
        alt={`《${book.title}》`}
        className="custom-cover-img"
        loading={priority ? 'eager' : 'lazy'}
        referrerPolicy="no-referrer"
        onError={handleImageError}
      />
    </div>
  )
}

function App() {
  const [books] = useState(initialBooks)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('全部')
  const [activeTab, setActiveTab] = useState('all') // 'all' | 'popular' | 'high_mentions' | 'high_rating' | 'bookmarks'
  const [sort, setSort] = useState('likes') // 'likes' | 'mentions' | 'rating' | 'title'
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list' | 'shelf'
  const [theme, setTheme] = useState(() => localStorage.getItem('industry_books_theme_v3') || 'navy')
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('industry_books_bookmarks_v3') || '[]')
    } catch {
      return []
    }
  })
  const [selectedBook, setSelectedBook] = useState(null)
  const [randomModalOpen, setRandomModalOpen] = useState(false)
  const [randomBook, setRandomBook] = useState(null)

  const searchInputRef = useRef(null)
  const doubanMode = useDoubanMode()

  // Sync theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('industry_books_theme_v3', theme)
  }, [theme])

  // Sync bookmarks
  useEffect(() => {
    localStorage.setItem('industry_books_bookmarks_v3', JSON.stringify(bookmarks))
  }, [bookmarks])

  // Keyboard shortcut '/' to search, 'Escape' to close dialogs
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current && !selectedBook && !randomModalOpen) {
        e.preventDefault()
        searchInputRef.current?.focus()
      } else if (e.key === 'Escape') {
        if (selectedBook) setSelectedBook(null)
        if (randomModalOpen) setRandomModalOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedBook, randomModalOpen])

  const toggleBookmark = (title, e) => {
    if (e) e.stopPropagation()
    setBookmarks((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    )
  }

  // Category counts
  const { categories, categoryCounts } = useMemo(() => {
    const counts = { 全部: books.length }
    books.forEach((b) => {
      counts[b.category] = (counts[b.category] || 0) + 1
    })
    const cats = ['全部', ...new Set(books.map((b) => b.category).sort((a, b) => a.localeCompare(b, 'zh-CN')))]
    return { categories: cats, categoryCounts: counts }
  }, [books])

  // Filtered & sorted books
  const visibleBooks = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase()
    return books
      .filter((book) => category === '全部' || book.category === category)
      .filter((book) => {
        if (activeTab === 'popular') return (book.likes || 0) >= 40
        if (activeTab === 'high_mentions') return (book.mentions || 0) >= 3
        if (activeTab === 'high_rating') return parseFloat(book.rating || 0) >= 9.0
        if (activeTab === 'bookmarks') return bookmarks.includes(book.title)
        return true
      })
      .filter((book) => {
        if (!normalizedQuery) return true
        const searchTarget = [
          book.title,
          book.author,
          book.category,
          book.sourceAuthor,
          book.doubanMeta,
          book.recommendationReason,
        ]
          .filter(Boolean)
          .join(' ')
          .toLocaleLowerCase()
        return searchTarget.includes(normalizedQuery)
      })
      .sort((a, b) => {
        if (sort === 'likes') {
          return (b.likes || 0) - (a.likes || 0) || (b.mentions || 0) - (a.mentions || 0) || a.title.localeCompare(b.title, 'zh-CN')
        }
        if (sort === 'mentions') {
          return (b.mentions || 0) - (a.mentions || 0) || (b.likes || 0) - (a.likes || 0) || a.title.localeCompare(b.title, 'zh-CN')
        }
        if (sort === 'rating') {
          const rateA = parseFloat(a.rating || 0)
          const rateB = parseFloat(b.rating || 0)
          return rateB - rateA || (b.likes || 0) - (a.likes || 0) || a.title.localeCompare(b.title, 'zh-CN')
        }
        if (sort === 'title') {
          return a.title.localeCompare(b.title, 'zh-CN')
        }
        return 0
      })
  }, [books, category, activeTab, bookmarks, query, sort])

  const filtersActive = query || category !== '全部' || activeTab !== 'all' || sort !== 'likes'

  function resetFilters() {
    setQuery('')
    setCategory('全部')
    setActiveTab('all')
    setSort('likes')
  }

  function handleRandomPick() {
    const pool = visibleBooks.length > 0 ? visibleBooks : books
    const randomIndex = Math.floor(Math.random() * pool.length)
    setRandomBook(pool[randomIndex])
    setRandomModalOpen(true)
  }

  return (
    <div className="main-app-shell">
      {/* 🧭 Brand Header Navigation */}
      <header className="brand-top-nav">
        <div className="nav-container">
          <div className="nav-brand-side">
            <a href="#home" className="brand-logo-link" onClick={resetFilters}>
              <IconBook className="brand-logo-icon" />
              <span className="brand-logo-title">各行各业读什么</span>
              <span className="brand-logo-tag">行业精选书架</span>
            </a>
          </div>

          <div className="nav-search-bar">
            <div className="search-input-wrapper">
              <input
                ref={searchInputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="检索书名、作者、行业门类、推荐人 (按 / 聚焦)"
                className="brand-search-input"
              />
              {query && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setQuery('')}
                  aria-label="清空搜索"
                >
                  <IconClose />
                </button>
              )}
              <span className="search-icon-badge" aria-hidden="true">
                <IconSearch />
              </span>
            </div>
          </div>

          <div className="nav-utilities">
            <div className="theme-selector-chips" title="切换视觉色调">
              <button
                type="button"
                className={`theme-dot-btn ${theme === 'navy' ? 'is-active' : ''}`}
                onClick={() => setTheme('navy')}
              >
                深蓝
              </button>
              <button
                type="button"
                className={`theme-dot-btn ${theme === 'warm' ? 'is-active' : ''}`}
                onClick={() => setTheme('warm')}
              >
                暖茶
              </button>
              <button
                type="button"
                className={`theme-dot-btn ${theme === 'dark' ? 'is-active' : ''}`}
                onClick={() => setTheme('dark')}
              >
                极夜
              </button>
            </div>

            <button
              type="button"
              className="random-discovery-btn"
              onClick={handleRandomPick}
              title="随机翻阅一本行业好书"
            >
              <IconDice />
              <span>随手翻书</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="content-container">
        {/* Editorial Masthead */}
        <section className="editorial-masthead">
          <h1 className="masthead-title">跨行业读者真实推荐书目索引</h1>
          <p className="masthead-intro">
            精选自小红书 578 条高赞讨论与深度楼中楼交流，收录 170 册经行业读者真实检验的入门与代表经典。包含原帖推荐理由、点赞热度及豆瓣参考评分。
          </p>
        </section>

        {/* Filter Cabinet & Controls */}
        <section className="shelf-control-cabinet" aria-label="书目筛选与视图设置">
          {/* Top Row: Reading Status / Recommendation Highlights */}
          <div className="recommendation-tabs-row">
            <button
              type="button"
              className={`rec-tab-btn ${activeTab === 'all' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              全部收录 ({books.length})
            </button>
            <button
              type="button"
              className={`rec-tab-btn ${activeTab === 'popular' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('popular')}
            >
              高赞精选 ({books.filter((b) => (b.likes || 0) >= 40).length})
            </button>
            <button
              type="button"
              className={`rec-tab-btn ${activeTab === 'high_mentions' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('high_mentions')}
            >
              多次热议 ({books.filter((b) => (b.mentions || 0) >= 3).length})
            </button>
            <button
              type="button"
              className={`rec-tab-btn ${activeTab === 'high_rating' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('high_rating')}
            >
              高分著作 9.0+ ({books.filter((b) => parseFloat(b.rating || 0) >= 9.0).length})
            </button>
            <button
              type="button"
              className={`rec-tab-btn bookmark-tab-btn ${activeTab === 'bookmarks' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('bookmarks')}
            >
              我的书签 ({bookmarks.length})
            </button>
          </div>

          {/* Middle Row: Category Tag Pills */}
          <div className="category-tags-section">
            <span className="category-section-title">门类：</span>
            <div className="category-pills-wrap">
              {categories.map((cat) => {
                const isSelected = category === cat
                const count = categoryCounts[cat] || 0
                return (
                  <button
                    key={cat}
                    type="button"
                    className={`category-pill-btn ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => setCategory(cat)}
                  >
                    {cat} <span className="cat-count">({count})</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Bottom Row: Sorting & View Switcher */}
          <div className="control-bottom-bar">
            <div className="sort-select-wrapper">
              <span className="sort-lead-text">排序：</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="sort-dropdown-menu"
              >
                <option value="likes">原帖获赞数 (高到低)</option>
                <option value="mentions">讨论提及次数 (多到少)</option>
                <option value="rating">豆瓣参考评分 (高到低)</option>
                <option value="title">书名拼音首字母</option>
              </select>
            </div>

            <div className="view-mode-group" role="radiogroup" aria-label="视图模式">
              <button
                type="button"
                className={`view-mode-btn ${viewMode === 'grid' ? 'is-active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="网格书架视图"
              >
                <IconGrid />
                <span>封面书架</span>
              </button>
              <button
                type="button"
                className={`view-mode-btn ${viewMode === 'list' ? 'is-active' : ''}`}
                onClick={() => setViewMode('list')}
                title="评论详列模式"
              >
                <IconList />
                <span>评论详列</span>
              </button>
              <button
                type="button"
                className={`view-mode-btn ${viewMode === 'shelf' ? 'is-active' : ''}`}
                onClick={() => setViewMode('shelf')}
                title="实木排架视图"
              >
                <IconShelf />
                <span>实木书架</span>
              </button>
            </div>
          </div>

          {/* Status feedback */}
          <div className="cabinet-status-line">
            <span className="status-total-text">
              已筛选出 <strong>{visibleBooks.length}</strong> 册书目
              {filtersActive && `（总书目库 ${books.length} 册）`}
            </span>
            {filtersActive && (
              <button
                type="button"
                className="reset-all-filters-btn"
                onClick={resetFilters}
              >
                重置所有筛选
              </button>
            )}
          </div>
        </section>

        {/* ================================================================= */}
        {/* VIEW 1: 封面书架网格 (Grid View) */}
        {/* ================================================================= */}
        {viewMode === 'grid' && visibleBooks.length > 0 && (
          <section className="shelf-grid-layout" aria-label="书目网格">
            {visibleBooks.map((book, idx) => {
              const isBookmarked = bookmarks.includes(book.title)
              return (
                <article
                  className="book-grid-card-item"
                  key={`${book.title}-${book.category}-${idx}`}
                  onClick={() => setSelectedBook(book)}
                >
                  <div className="card-cover-container">
                    <BookCover book={book} className="grid-cover-frame" priority={idx < 8} />
                    
                    {book.likes >= 50 && (
                      <span className="card-hot-badge" title={`原帖获得 ${book.likes} 赞`}>
                        {book.likes} 赞
                      </span>
                    )}

                    <button
                      type="button"
                      className={`card-bookmark-btn ${isBookmarked ? 'is-active' : ''}`}
                      onClick={(e) => toggleBookmark(book.title, e)}
                      title={isBookmarked ? '已收藏' : '收藏'}
                      aria-label={isBookmarked ? `取消收藏《${book.title}》` : `收藏《${book.title}》`}
                    >
                      {isBookmarked ? '★ 已藏' : '☆ 收藏'}
                    </button>
                  </div>

                  <div className="card-body-section">
                    <h3 className="card-book-title" title={book.title}>
                      {book.title}
                    </h3>
                    <p className="card-book-author">
                      {book.author || '作者信息见详情'}
                    </p>

                    {/* Practitioner Comment Highlight */}
                    <div className="card-xhs-comment-strip">
                      <div className="xhs-commenter-row">
                        <span className="xhs-commenter-name">
                          推荐人 · {book.sourceAuthor || '热心书友'}
                        </span>
                        <span className="xhs-likes-count">{book.likes} 赞</span>
                      </div>
                      {book.recommendationReason && (
                        <p className="xhs-card-reason-snippet">
                          {book.recommendationReason}
                        </p>
                      )}
                    </div>

                    <div className="card-bottom-rating-meta">
                      <RatingStars rating={book.rating} />
                      <span className="card-category-tag">{book.category}</span>
                    </div>
                  </div>
                </article>
              )
            })}
          </section>
        )}

        {/* ================================================================= */}
        {/* VIEW 2: 评论详列模式 (List View) */}
        {/* ================================================================= */}
        {viewMode === 'list' && visibleBooks.length > 0 && (
          <section className="shelf-list-layout" aria-label="评论详列列表">
            {visibleBooks.map((book, idx) => {
              const isBookmarked = bookmarks.includes(book.title)
              return (
                <article
                  className="book-list-row-item"
                  key={`${book.title}-${book.category}-${idx}`}
                  onClick={() => setSelectedBook(book)}
                >
                  <div className="list-cover-col">
                    <BookCover book={book} className="list-cover-frame" priority={idx < 6} />
                  </div>

                  <div className="list-info-col">
                    <div className="list-title-header">
                      <h3 className="list-book-title">{book.title}</h3>
                      <span className="list-category-badge">{book.category}</span>
                      {parseFloat(book.rating || 0) >= 9.0 && (
                        <span className="list-high-score-tag">9.0+ 高分著作</span>
                      )}
                    </div>

                    <p className="list-author-meta">
                      {book.doubanMeta || (book.author ? `著者：${book.author}` : '出版信息见详情')}
                    </p>

                    <div className="list-rating-row">
                      <RatingStars rating={book.rating} />
                    </div>

                    {/* Practitioner Comment Box */}
                    <div className="list-xhs-comment-card">
                      <div className="xhs-quote-header">
                        <span className="xhs-commenter-user">
                          推荐读者：<strong>{book.sourceAuthor || '热心书友'}</strong>
                        </span>
                        <span className="xhs-likes-badge">{book.likes} 赞</span>
                        {book.mentions > 1 && (
                          <span className="xhs-mentions-badge">讨论提及 {book.mentions} 次</span>
                        )}
                      </div>
                      <p className="xhs-quote-body">
                        {book.recommendationReason || `在行业入读讨论中被作为【${book.category}】门类的代表书目重点推荐。`}
                      </p>
                    </div>
                  </div>

                  <div className="list-actions-col">
                    <button
                      type="button"
                      className={`list-bookmark-btn ${isBookmarked ? 'is-active' : ''}`}
                      onClick={(e) => toggleBookmark(book.title, e)}
                    >
                      {isBookmarked ? '★ 已在书签' : '☆ 收入书签'}
                    </button>

                    <button
                      type="button"
                      className="list-view-detail-btn"
                      onClick={() => setSelectedBook(book)}
                    >
                      查看推荐档案
                    </button>

                    <a
                      href={doubanSearchUrl(book, doubanMode)}
                      target="_blank"
                      rel="noreferrer"
                      className="list-douban-link-btn"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span>在豆瓣查阅</span>
                      <IconExternal />
                    </a>
                  </div>
                </article>
              )
            })}
          </section>
        )}

        {/* ================================================================= */}
        {/* VIEW 3: 实木书架排架模式 (Wooden Shelf View) */}
        {/* ================================================================= */}
        {viewMode === 'shelf' && visibleBooks.length > 0 && (
          <section className="wooden-bookshelf-layout" aria-label="实木排架">
            <div className="wooden-shelf-instructions">
              <span>点击任意书籍展开推荐理由与版本详情</span>
            </div>

            <div className="wooden-tiers-wrapper">
              {Array.from({ length: Math.ceil(visibleBooks.length / 8) }).map((_, tierIdx) => {
                const tierBooks = visibleBooks.slice(tierIdx * 8, (tierIdx + 1) * 8)
                return (
                  <div className="wooden-shelf-level" key={`level-${tierIdx}`}>
                    <div className="wooden-shelf-books-row">
                      {tierBooks.map((book) => {
                        const isBookmarked = bookmarks.includes(book.title)
                        return (
                          <div
                            key={`${book.title}-${book.category}`}
                            className="standing-book-wrapper"
                            onClick={() => setSelectedBook(book)}
                          >
                            <BookCover book={book} className="standing-book-cover" />
                            <div className="standing-book-title" title={book.title}>
                              {book.title}
                            </div>
                            <div className="standing-xhs-tag">
                              <span>{book.likes} 赞</span>
                              {isBookmarked && <span className="standing-star">★</span>}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    {/* Shelf Wood Plank Floor */}
                    <div className="wooden-shelf-floor-plank" aria-hidden="true" />
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Empty State */}
        {visibleBooks.length === 0 && (
          <section className="empty-results-state" aria-live="polite">
            <div className="empty-dialog-card">
              <h2>未找到匹配的书目</h2>
              <p>
                {activeTab === 'bookmarks'
                  ? '您的书签列表为空，点击任意书卡上的「☆ 收藏」即可加入书单。'
                  : '未找到符合当前检索关键词或行业门类的书目，建议尝试缩短搜索词或重置筛选。'}
              </p>
              <button
                type="button"
                className="empty-reset-action-btn"
                onClick={resetFilters}
              >
                重置所有筛选
              </button>
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="brand-page-footer">
          <div className="footer-nav-links">
            <span>数据源：小红书行业入读书单评论精析</span>
            <span className="footer-dot">·</span>
            <span>总计收录 170 册代表书目</span>
            <span className="footer-dot">·</span>
            <span>精析 578 条评论</span>
          </div>
          <p className="footer-copyright-note">
            本项目基于公开讨论社区数据提炼，帮助各领域求知者快速发现经真实从业者与读者检验的经典著作。
          </p>
        </footer>
      </main>

      {/* ================================================================= */}
      {/* Book & Original Practitioner Comment Detail Modal */}
      {/* ================================================================= */}
      {selectedBook && (
        <div className="app-modal-backdrop" onClick={() => setSelectedBook(null)}>
          <div
            className="book-detail-dialog-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-title-id"
          >
            <button
              type="button"
              className="modal-close-cross"
              onClick={() => setSelectedBook(null)}
              aria-label="关闭详情窗口"
            >
              <IconClose />
            </button>

            <div className="modal-content-grid">
              {/* Left Column: Book Cover & Quick Actions */}
              <div className="modal-cover-side">
                <BookCover book={selectedBook} className="modal-large-cover" priority={true} />
                
                <div className="modal-cover-buttons">
                  <button
                    type="button"
                    className={`modal-bookmark-toggle ${bookmarks.includes(selectedBook.title) ? 'is-active' : ''}`}
                    onClick={() => toggleBookmark(selectedBook.title)}
                  >
                    {bookmarks.includes(selectedBook.title) ? '★ 已在我的书签' : '☆ 收入书签'}
                  </button>

                  <a
                    href={doubanSearchUrl(selectedBook, doubanMode)}
                    target="_blank"
                    rel="noreferrer"
                    className="modal-douban-link"
                  >
                    <span>在豆瓣查验版本</span>
                    <IconExternal />
                  </a>
                </div>
              </div>

              {/* Right Column: Title, Original Comments & Publication Info */}
              <div className="modal-info-side">
                {/* Book Title & Category */}
                <div className="modal-title-header">
                  <span className="modal-category-chip">{selectedBook.category}</span>
                  <h2 id="dialog-title-id" className="modal-book-name">{selectedBook.title}</h2>
                  <p className="modal-author-name">
                    {selectedBook.author ? `著者：${selectedBook.author}` : '著者信息见豆瓣'}
                  </p>
                </div>

                {/* Original Practitioner Comment Dossier */}
                <div className="modal-xhs-dossier-card">
                  <div className="dossier-header-bar">
                    <span className="dossier-badge">读者原帖推荐档案</span>
                    <span className="dossier-confidence">信度：{selectedBook.confidence || '书名号提及'}</span>
                  </div>

                  <div className="dossier-metrics-grid">
                    <div className="dossier-metric-item">
                      <span className="metric-label">推荐读者</span>
                      <span className="metric-val">{selectedBook.sourceAuthor || '热心书友'}</span>
                    </div>
                    <div className="dossier-metric-item">
                      <span className="metric-label">原帖点赞</span>
                      <span className="metric-val metric-hot">{selectedBook.likes} 赞</span>
                    </div>
                    <div className="dossier-metric-item">
                      <span className="metric-label">讨论区提及</span>
                      <span className="metric-val">{selectedBook.mentions} 次</span>
                    </div>
                  </div>

                  <div className="dossier-quote-content">
                    <div className="dossier-quote-box">
                      <p className="dossier-quote-text">
                        “{selectedBook.recommendationReason || `在小红书行业入读书单的热烈讨论中，本书被读者 ${selectedBook.sourceAuthor || '热心书友'} 作为【${selectedBook.category}】门类的必读/代表作重点推荐，并在楼中楼深度交流中累计获得 ${selectedBook.likes} 位读者的点赞共识。`}”
                      </p>
                    </div>
                  </div>
                </div>

                {/* Reference Publication info */}
                <div className="modal-douban-meta-block">
                  <h4 className="douban-meta-heading">出版与参考评分</h4>
                  <div className="douban-score-row">
                    <div className="score-badge-box">
                      <span className="score-big">{selectedBook.rating || '—'}</span>
                      <span className="score-unit">豆瓣参考分</span>
                    </div>
                    <div className="score-stars-col">
                      <RatingStars rating={selectedBook.rating} showNumber={false} />
                      <span className="score-desc">
                        {selectedBook.rating
                          ? parseFloat(selectedBook.rating) >= 9.0
                            ? '豆瓣 9.0+ 高分口碑著作'
                            : '读者评分数据已同步'
                          : '暂无直接评分，可点击左侧按钮前往豆瓣查阅'}
                      </span>
                    </div>
                  </div>

                  {selectedBook.doubanMeta && (
                    <p className="douban-cast-text">
                      <strong>版本出版：</strong>{selectedBook.doubanMeta}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* Random Discovery Modal */}
      {/* ================================================================= */}
      {randomModalOpen && randomBook && (
        <div className="app-modal-backdrop" onClick={() => setRandomModalOpen(false)}>
          <div
            className="random-pick-dialog-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="random-dialog-title"
          >
            <button
              type="button"
              className="modal-close-cross"
              onClick={() => setRandomModalOpen(false)}
              aria-label="关闭窗口"
            >
              <IconClose />
            </button>

            <div className="random-dialog-head">
              <h2 id="random-dialog-title" className="random-main-heading">为你偶遇一本好书</h2>
            </div>

            <div className="random-showcase-layout">
              <div className="random-left-cover">
                <BookCover book={randomBook} className="random-cover-box" priority={true} />
              </div>

              <div className="random-right-details">
                <span className="random-cat-chip">{randomBook.category}</span>
                <h3 className="random-book-title">{randomBook.title}</h3>
                <p className="random-author-line">{randomBook.author || '作者信息见详情'}</p>

                {/* XHS Highlight */}
                <div className="random-xhs-highlight-box">
                  <div className="random-xhs-recommender">
                    <span>推荐人：<strong>{randomBook.sourceAuthor || '热心书友'}</strong></span>
                    <span className="random-likes-count">{randomBook.likes} 赞</span>
                  </div>
                  <p className="random-context-line">
                    “{randomBook.recommendationReason || `小红书【${randomBook.category}】领域代表作，原帖获赞 ${randomBook.likes} 次。`}”
                  </p>
                </div>

                <div className="random-dialog-actions-row">
                  <button
                    type="button"
                    className="random-next-btn"
                    onClick={handleRandomPick}
                  >
                    再抽一本
                  </button>
                  <button
                    type="button"
                    className={`random-bookmark-btn ${bookmarks.includes(randomBook.title) ? 'is-active' : ''}`}
                    onClick={() => toggleBookmark(randomBook.title)}
                  >
                    {bookmarks.includes(randomBook.title) ? '★ 已在书签' : '☆ 收入书签'}
                  </button>
                  <a
                    href={doubanSearchUrl(randomBook, doubanMode)}
                    target="_blank"
                    rel="noreferrer"
                    className="random-douban-btn"
                  >
                    <span>在豆瓣查阅</span>
                    <IconExternal />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
