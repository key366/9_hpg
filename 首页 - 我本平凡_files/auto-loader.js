// 自动加载博客文章和周刊数据
// 由于浏览器安全限制，无法直接读取文件系统，这里提供一个解决方案

// 文章配置 - 需要手动维护文章列表，但会自动生成数据结构
const POSTS_CONFIG = [
    {
        filename: '2nd-nano-banana.md',
        id: '2nd-nano-banana',
        title: 'Gemini 2.5 Flash (Nano Banana) 图像编辑能力测试',
        date: '2025-08-28',
        tags: ['AI', 'Gemini', '图像编辑', '测试'],
        excerpt: '对 Gemini 2.5 Flash (Nano Banana) 的图像编辑能力进行了详细测试，发现其在一致性方面表现出色，但在可控性方面仍有不足。'
    },
    {
        filename: 'start.md',
        id: 'start',
        title: '第一篇博客',
        date: '2025-08-25',
        tags: ['起点'],
        excerpt: '最近打算重新写博客，希望给自己永远留下一块自留地。'
    },
    {
        filename: 'ai-blog-tutorial.md',
        id: 'ai-blog-tutorial',
        title: '小白也能用AI搭建个人博客：Trae + 静态网站完整攻略',
        date: '2025-01-25',
        tags: ['AI编程', '博客搭建', 'Trae', '教程', '新手指南'],
        excerpt: '从零开始，用AI编程工具Trae搭建一个功能完整的个人博客。包含文章管理、周刊系统、RSS订阅等功能，无需深厚编程基础。',
        published: false
    },
    {
        filename: 'ai-coding-experience.md',
        id: 'ai-coding-experience',
        title: 'AI 编程工具的使用体验与思考',
        date: '2025-01-15',
        tags: ['AI', '编程', '工具'],
        excerpt: '最近几个月深度使用了 Claude、Cursor 等 AI 编程工具，分享一些实际使用中的体验和对程序员工作方式变化的思考。',
        published: false
    },
    {
        filename: 'mermaid-latex-demo.md',
        id: 'mermaid-latex-demo',
        title: 'Mermaid 图表和 LaTeX 数学公式演示',
        date: '2025-01-15',
        tags: ['演示', 'Mermaid', 'LaTeX', '数学'],
        excerpt: '演示如何在博客中使用 Mermaid 图表和 LaTeX 数学公式，包含各种图表类型和数学公式示例。',
        published: false
    },
    {
        filename: 'study-abroad-preparation.md',
        id: 'study-abroad-preparation',
        title: '留学申请季的准备与心得',
        date: '2025-01-10',
        tags: ['留学', '申请', '经验分享'],
        excerpt: '回顾整个留学申请过程，从选校到文书写作，从语言考试到面试准备，分享一些实用的经验和踩过的坑。',
        published: false
    }
    // 添加新文章时，只需在这里添加配置即可
];

// 周刊配置
const WEEKLY_CONFIG = [
    {
        filename: 'weekly-005.md',
        id: 'weekly-005',
        title: '第5期 - 伦敦游记',
        date: '2025-09-21',
        cover: '/assets/images/weekly/weekly-005-cover.jpeg',
        content: '再次确认大城市不是我的菜',
        tags: ['旅行', 'AI产品', '生活', '城市观察']
    },
    {
        filename: 'weekly-004.md',
        id: 'weekly-004',
        title: '第4期 - 秋天到了',
        date: '2025-09-14',
        cover: '/assets/images/weekly/weekly-004-cover.jpeg',
        content: '鸟貌似是最喜欢人类翻土的生物，虫子相反',
        tags: ['AI产品', '生活', '技术研究', '秋天']
    },
    {
        filename: 'weekly-003.md',
        id: 'weekly-003',
        title: '第3期 - 苹果和菜',
        date: '2025-09-07',
        cover: '/assets/images/weekly/weekly-003-cover.jpeg',
        content: '依旧是尽可能接触自然的一周',
        tags: ['AI产品', '种植', '生活', '技术研究']
    },
    {
        filename: 'weekly-002.md',
        id: 'weekly-002',
        title: '第2期 - 破土而出',
        date: '2025-08-31',
        cover: '/assets/images/weekly/weekly-002-cover.jpeg',
        content: '种子破土而出，AI产品百花齐放，记录这个充满生机的周末',
        tags: ['AI产品', '种植', '生活', '科研']
    },
    {
        filename: 'weekly-001.md',
        id: 'weekly-001',
        title: '第1期 - 新的开始',
        date: '2025-08-25',
        cover: '/assets/images/weekly/weekly-001-cover.jpeg',
        content: '这是第一期周刊，纪念下周刊第一期和今天的所见',
        tags: ['开始', '记录', '生活']
    }
    // 添加新周刊时，只需在这里添加配置即可
]

// 自动生成文章数据
function generatePostsData() {
    return POSTS_CONFIG
        .filter(post => post.published !== false) // 过滤未发布的文章
        .map(post => ({
            id: post.id,
            title: post.title,
            date: post.date,
            excerpt: post.excerpt,
            tags: post.tags || []
        }))
        .sort((a, b) => new Date(b.date) - new Date(a.date)); // 按日期倒序排列
}

// 自动生成周刊数据
function generateWeeklyData() {
    return WEEKLY_CONFIG
        .filter(weekly => weekly.published !== false) // 过滤未发布的周刊
        .map(weekly => ({
            id: weekly.id,
            title: weekly.title,
            date: weekly.date,
            cover: weekly.cover,
            content: weekly.content,
            tags: weekly.tags || []
        }))
        .sort((a, b) => new Date(b.date) - new Date(a.date)); // 按日期倒序排列
}

// 导出函数供 main.js 使用
if (typeof window !== 'undefined') {
    window.generatePostsData = generatePostsData;
    window.generateWeeklyData = generateWeeklyData;
}

// Node.js 环境导出（如果需要）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        generatePostsData,
        generateWeeklyData,
        POSTS_CONFIG,
        WEEKLY_CONFIG
    };
}