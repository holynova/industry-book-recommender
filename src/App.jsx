import { useMemo, useState } from 'react'
import './App.css'

const industries = [
  {
    id: 'software',
    label: '软件与数据',
    accent: '技术系统',
    books: {
      start: {
        title: '编码：隐匿在计算机软硬件背后的语言',
        author: 'Charles Petzold',
        note: '从硬件、二进制到程序，适合先建立系统直觉。',
      },
      deepen: {
        title: '机器学习',
        author: '周志华',
        note: '面向已有编程基础，系统进入机器学习的核心方法。',
      },
    },
    alternatives: ['C Primer Plus', '深度学习入门：基于 Python 的理论与实践'],
  },
  {
    id: 'finance',
    label: '金融与投资',
    accent: '市场判断',
    books: {
      start: {
        title: '经济学原理',
        author: 'N. Gregory Mankiw',
        note: '先用供需、激励与市场机制建立通用的经济分析框架。',
      },
      deepen: {
        title: '漫步华尔街',
        author: 'Burton G. Malkiel',
        note: '把投资决策放回风险、概率与长期回报的视角。',
      },
    },
    alternatives: ['基础会计', '置身事内：中国政府与经济发展'],
  },
  {
    id: 'legal',
    label: '法律与合规',
    accent: '规则推理',
    books: {
      start: {
        title: '洞穴奇案',
        author: 'Peter Suber',
        note: '通过一个案件理解法律解释、责任与价值冲突。',
      },
      deepen: {
        title: '法治及其本土资源',
        author: '苏力',
        note: '从制度与现实环境理解法律如何真正运作。',
      },
    },
    alternatives: ['西窗法雨', '正义的决疑'],
  },
  {
    id: 'design',
    label: '设计与创意',
    accent: '形式与体验',
    books: {
      start: {
        title: '设计中的设计',
        author: '原研哉',
        note: '从材料、感知与留白理解设计判断的起点。',
      },
      deepen: {
        title: '现代艺术150年',
        author: 'Will Gompertz',
        note: '补足现代艺术脉络，建立更宽的视觉判断坐标。',
      },
    },
    alternatives: ['设计的觉醒', '艺术的故事'],
  },
  {
    id: 'marketing',
    label: '品牌与广告',
    accent: '传播表达',
    books: {
      start: {
        title: '一个广告人的自白',
        author: 'David Ogilvy',
        note: '理解广告表达如何围绕产品事实和受众注意力展开。',
      },
      deepen: {
        title: 'Taking Sides 系列',
        author: '精选议题读本',
        note: '适合训练多立场阅读与有证据的表达。',
      },
    },
    alternatives: ['传播学概论', '好的英语：反套路英文写作'],
  },
  {
    id: 'education',
    label: '教育与培训',
    accent: '学习设计',
    books: {
      start: {
        title: '教育学原理',
        author: '教育学基础读物',
        note: '先厘清教育目标、课程与评价之间的基本关系。',
      },
      deepen: {
        title: '教育心理学',
        author: '学习科学方向',
        note: '把注意、动机和反馈转化为可执行的教学设计。',
      },
    },
    alternatives: ['心理学与生活', '发展心理学'],
  },
  {
    id: 'health',
    label: '医疗与健康',
    accent: '人体与照护',
    books: {
      start: {
        title: '医路向前：巍子给中国人的救护指南',
        author: '贾大成',
        note: '从日常急救和风险识别切入，面向非专业读者。',
      },
      deepen: {
        title: '系统解剖学',
        author: '医学基础教材',
        note: '需要更扎实的生物与医学基础，适合作为专业延伸。',
      },
    },
    alternatives: ['明明白白心电图', '中国居民膳食指南'],
  },
  {
    id: 'engineering',
    label: '工程与制造',
    accent: '空间与结构',
    books: {
      start: {
        title: '工程制图',
        author: '工程基础教材',
        note: '用图纸语言理解尺寸、结构与制造沟通。',
      },
      deepen: {
        title: '材料科学与工程基础',
        author: '材料科学基础教材',
        note: '从材料的性能、结构与工艺建立工程决策视角。',
      },
    },
    alternatives: ['电路', '普通地质学'],
  },
  {
    id: 'city',
    label: '城市与建筑',
    accent: '空间与公共性',
    books: {
      start: {
        title: '城市发展史',
        author: 'Lewis Mumford',
        note: '从城市演变理解技术、制度与生活方式如何互相塑造。',
      },
      deepen: {
        title: '美国大城市的生与死',
        author: 'Jane Jacobs',
        note: '用街道尺度观察城市活力、秩序与公共空间。',
      },
    },
    alternatives: ['中国建筑史', '清式营造则例'],
  },
  {
    id: 'media',
    label: '媒体与内容',
    accent: '信息与叙事',
    books: {
      start: {
        title: '传播学概论',
        author: '传播学基础读物',
        note: '先掌握媒介、受众和信息扩散的基本概念。',
      },
      deepen: {
        title: '故事',
        author: 'Robert McKee',
        note: '从冲突、结构与人物目标训练内容叙事能力。',
      },
    },
    alternatives: ['认识电影', '救猫咪'],
  },
  {
    id: 'people',
    label: '人力与咨询',
    accent: '行为与协作',
    books: {
      start: {
        title: '心理学与生活',
        author: 'Richard J. Gerrig / Philip G. Zimbardo',
        note: '从认知、动机和行为切入，建立理解人的基础。',
      },
      deepen: {
        title: '社会心理学',
        author: '社会心理学方向',
        note: '理解群体、偏见、说服与组织协作中的常见机制。',
      },
    },
    alternatives: ['这才是心理学', '发展心理学'],
  },
  {
    id: 'public',
    label: '公共事务',
    accent: '制度与治理',
    books: {
      start: {
        title: '置身事内：中国政府与经济发展',
        author: '兰小欢',
        note: '用财政与组织结构理解地方治理和经济发展的关系。',
      },
      deepen: {
        title: '政治哲学关键词',
        author: '政治哲学方向',
        note: '从概念层面梳理自由、正义、权力与公共选择。',
      },
    },
    alternatives: ['中国历代政治得失', '民主四讲'],
  },
]

function App() {
  const [industryId, setIndustryId] = useState('software')
  const [level, setLevel] = useState('start')

  const industry = useMemo(
    () => industries.find((item) => item.id === industryId) ?? industries[0],
    [industryId],
  )
  const book = industry.books[level]

  return (
    <main className="app-shell">
      <header className="masthead">
        <div>
          <p className="eyebrow">COMMENT-BASED READING GUIDE</p>
          <h1>按行业推荐一本书</h1>
          <p className="intro">选择你所在的行业和阅读目标，获得一条能立刻开始的阅读建议。</p>
        </div>
        <p className="source-mark">来源于 578 条已解析评论<br />不替代专业书单或课程</p>
      </header>

      <section className="workspace" aria-label="推荐设置">
        <div className="control-panel">
          <div className="control-heading">
            <span>01</span>
            <h2>选择你的场景</h2>
          </div>

          <label className="field-label" htmlFor="industry">
            所在行业
            <select id="industry" value={industryId} onChange={(event) => setIndustryId(event.target.value)}>
              {industries.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </label>

          <fieldset>
            <legend>阅读目标</legend>
            <div className="segment-control">
              <button className={level === 'start' ? 'selected' : ''} type="button" onClick={() => setLevel('start')} aria-pressed={level === 'start'}>
                快速入门
              </button>
              <button className={level === 'deepen' ? 'selected' : ''} type="button" onClick={() => setLevel('deepen')} aria-pressed={level === 'deepen'}>
                专业延伸
              </button>
            </div>
          </fieldset>

          <p className="selection-note">当前方向：<strong>{industry.accent}</strong></p>
        </div>

        <article className="recommendation" aria-live="polite">
          <div className="recommendation-topline">
            <span>{industry.label}</span>
            <span>{level === 'start' ? '快速入门' : '专业延伸'}</span>
          </div>
          <p className="recommendation-label">今日只读这一本</p>
          <h2>{book.title}</h2>
          <p className="author">{book.author}</p>
          <p className="reason">{book.note}</p>
          <div className="evidence">
            <span className="evidence-dot" aria-hidden="true"></span>
            评论文本书目候选
          </div>
        </article>
      </section>

      <section className="alternatives" aria-labelledby="alternatives-heading">
        <div>
          <p className="section-kicker">同一方向</p>
          <h2 id="alternatives-heading">还可以读</h2>
        </div>
        <ul>
          {industry.alternatives.map((title) => <li key={title}>{title}</li>)}
        </ul>
      </section>

      <footer>
        <p>书目源自小红书评论文本与楼中楼解析。当前样本未覆盖全部评论，部分书籍来自评论汇总。</p>
        <p>共 12 个行业方向 · 每次只推荐一本</p>
      </footer>
    </main>
  )
}

export default App
