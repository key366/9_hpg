// 博客配置
const CONFIG = {
    postsPerPage: 10,
    weeklyPerPage: 8,
    postsPath: 'posts/',
    weeklyPath: 'weekly/',
    dateFormat: 'YYYY-MM-DD',
    baseUrl: (window.location.hostname.includes('vercel.app') || window.location.hostname.includes('pingfan.me')) ? '' : '/pingfan-website' // 自动检测部署环境
};

// 文章数据 - 这里可以通过 API 或静态文件加载
let postsData = [];
let weeklyData = [];

// 当前页面状态
let currentPage = 1;
let currentSection = 'blog'; // 'blog', 'weekly', 'about'

// DOM 元素引用
const postsContainer = document.getElementById('posts-container');
const weeklyContainer = document.getElementById('weekly-grid');
const pagination = document.getElementById('pagination');

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // 根据 URL 确定当前页面
    const path = window.location.pathname;
    
    if (path.includes('/weekly/')) {
        currentSection = 'weekly';
        loadWeeklyData();
    } else if (path.includes('/about/')) {
        currentSection = 'about';
        // About 页面不需要动态加载
    } else {
        currentSection = 'blog';
        loadPostsData();
    }
    
    // 设置导航高亮
    updateNavigation();
}

// 加载博客文章数据
function loadPostsData() {
    // 使用自动加载器生成文章数据
    if (typeof generatePostsData === 'function') {
        postsData = generatePostsData();
    } else {
        // 降级方案：如果自动加载器未加载，使用默认数据
        postsData = [
            {
                id: 'start',
                title: '第一篇博客',
                date: '2025-01-25',
                excerpt: '最近打算重新写博客，希望给自己永远留下一块自留地。',
                tags: ['起点']
            }
        ];
    }
    
    renderPosts();
    initBlogIndex();
}

// 初始化博客索引功能
function initBlogIndex() {
    if (currentSection !== 'blog') return;
    
    // 生成标签导航
    renderBlogTagsNav();
    
    // 绑定搜索事件
    const searchInput = document.getElementById('blog-search-input');
    const searchBtn = document.getElementById('blog-search-btn');
    
    if (searchInput && searchBtn) {
        searchInput.addEventListener('input', debounce(searchBlogPosts, 300));
        searchBtn.addEventListener('click', () => searchBlogPosts());
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchBlogPosts();
            }
        });
    }
    
    // 绑定标签点击事件
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('tag')) {
            e.preventDefault();
            const tag = e.target.dataset.tag;
            filterPostsByTag(tag);
        }
    });
}

// 生成博客标签导航
function renderBlogTagsNav() {
    const tagsNavContainer = document.getElementById('blog-tags-nav');
    if (!tagsNavContainer) return;
    
    // 收集所有标签
    const allTags = new Set();
    postsData.forEach(post => {
        if (post.tags) {
            post.tags.forEach(tag => allTags.add(tag));
        }
    });
    
    const sortedTags = Array.from(allTags).sort();
    
    let navHTML = '<span class="nav-label">标签筛选:</span>';
    navHTML += '<span class="tag active" data-tag="all">全部 (' + postsData.length + ')</span>';
    
    sortedTags.forEach(tag => {
        const count = postsData.filter(post => post.tags && post.tags.includes(tag)).length;
        navHTML += `<span class="tag" data-tag="${tag}">${tag} (${count})</span>`;
    });
    
    tagsNavContainer.innerHTML = navHTML;
    
    // 绑定标签导航点击事件
    tagsNavContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('tag')) {
            e.preventDefault();
            
            // 更新激活状态
            tagsNavContainer.querySelectorAll('.tag').forEach(item => {
                item.classList.remove('active');
            });
            e.target.classList.add('active');
            
            // 过滤文章
            const tag = e.target.dataset.tag;
            filterPostsByTag(tag);
        }
    });
}

// 按标签过滤文章
function filterPostsByTag(tag) {
    let filteredData = postsData;
    
    if (tag !== 'all') {
        filteredData = postsData.filter(post => {
            return post.tags && post.tags.includes(tag);
        });
    }
    
    // 重置页码并渲染
    currentPage = 1;
    renderFilteredPosts(filteredData);
}

// 搜索博客文章
function searchBlogPosts() {
    const searchInput = document.getElementById('blog-search-input');
    if (!searchInput) return;
    
    const query = searchInput.value.trim().toLowerCase();
    
    if (!query) {
        // 如果搜索为空，显示所有文章
        currentPage = 1;
        renderPosts();
        // 重置标签导航状态
        const tagsNav = document.getElementById('blog-tags-nav');
        if (tagsNav) {
            tagsNav.querySelectorAll('.tag').forEach(item => {
                item.classList.remove('active');
            });
            const allTag = tagsNav.querySelector('[data-tag="all"]');
            if (allTag) allTag.classList.add('active');
        }
        return;
    }
    
    // 搜索匹配的文章
    const filteredData = postsData.filter(post => {
        return post.title.toLowerCase().includes(query) ||
               post.excerpt.toLowerCase().includes(query) ||
               (post.tags && post.tags.some(tag => tag.toLowerCase().includes(query)));
    });
    
    // 重置页码并渲染搜索结果
    currentPage = 1;
    renderFilteredPosts(filteredData);
    
    // 重置标签导航状态
    const tagsNav = document.getElementById('blog-tags-nav');
    if (tagsNav) {
        tagsNav.querySelectorAll('.tag').forEach(item => {
            item.classList.remove('active');
        });
    }
}

// 渲染过滤后的文章
function renderFilteredPosts(filteredData) {
    if (!postsContainer) return;
    
    const startIndex = (currentPage - 1) * CONFIG.postsPerPage;
    const endIndex = startIndex + CONFIG.postsPerPage;
    const currentPosts = filteredData.slice(startIndex, endIndex);
    
    if (currentPosts.length === 0) {
        postsContainer.innerHTML = '<div class="loading">未找到匹配的文章</div>';
        if (pagination) pagination.innerHTML = '';
        return;
    }
    
    const postsHTML = currentPosts.map(post => `
        <article class="post-item">
            <h2 class="post-title">
                <a href="${CONFIG.baseUrl}/posts/${post.id}/">${post.title}</a>
            </h2>
            <div class="post-meta">
                <time datetime="${post.date}">${formatDate(post.date)}</time>
            </div>
            ${post.tags ? `<div class="post-tags">${post.tags.map(tag => `<span class="tag" data-tag="${tag}">${tag}</span>`).join('')}</div>` : ''}
            <div class="post-excerpt">${post.excerpt}</div>
        </article>
    `).join('');
    
    postsContainer.innerHTML = postsHTML;
    
    // 渲染分页
    renderPagination(filteredData.length, CONFIG.postsPerPage);
}

// 加载周刊数据
function loadWeeklyData() {
    // 使用自动加载器生成周刊数据
    if (typeof generateWeeklyData === 'function') {
        weeklyData = generateWeeklyData();
    } else {
        // 降级方案：如果自动加载器未加载，使用默认数据
        weeklyData = [
            {
                id: 'weekly-001',
                title: '第1期 - 新的开始',
                date: '2025-08-25',
                cover: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=400&fit=crop',
                content: '这是第一期周刊，记录每周的学习、思考与生活点滴。希望通过这种方式，记录成长的轨迹。',
                tags: ['开始', '记录', '生活']
            }
        ];
    }
    
    renderWeekly();
}

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 渲染博客文章
function renderPosts() {
    if (!postsContainer) return;
    
    const startIndex = (currentPage - 1) * CONFIG.postsPerPage;
    const endIndex = startIndex + CONFIG.postsPerPage;
    const currentPosts = postsData.slice(startIndex, endIndex);
    
    if (currentPosts.length === 0) {
        postsContainer.innerHTML = '<div class="loading">暂无文章</div>';
        return;
    }
    
    const postsHTML = currentPosts.map(post => `
        <article class="post-item">
            <h2 class="post-title">
                <a href="${CONFIG.baseUrl}/posts/${post.id}/">${post.title}</a>
            </h2>
            <div class="post-meta">
                <time datetime="${post.date}">${formatDate(post.date)}</time>
                ${post.tags ? `<span class="post-tags">${post.tags.map(tag => `<span class="tag" data-tag="${tag}">${tag}</span>`).join('')}</span>` : ''}
            </div>
            <div class="post-excerpt">${post.excerpt}</div>
        </article>
    `).join('');
    
    postsContainer.innerHTML = postsHTML;
    
    // 渲染分页
    renderPagination(postsData.length, CONFIG.postsPerPage);
}

// 渲染周刊
function renderWeekly() {
    const container = weeklyContainer || postsContainer;
    if (!container) return;
    
    const startIndex = (currentPage - 1) * CONFIG.weeklyPerPage;
    const endIndex = startIndex + CONFIG.weeklyPerPage;
    const currentWeekly = weeklyData.slice(startIndex, endIndex);
    
    if (currentWeekly.length === 0) {
        container.innerHTML = '<div class="loading">暂无周刊</div>';
        return;
    }
    
    const weeklyHTML = currentWeekly.map(weekly => `
        <article class="weekly-card">
            <a href="${CONFIG.baseUrl}/weekly/${weekly.id}/" class="weekly-link">
                <div class="weekly-image">
                    ${weekly.cover ? `<img src="${weekly.cover}" alt="${weekly.title}" loading="lazy">` : '<div class="weekly-placeholder">📰</div>'}
                </div>
                <div class="weekly-content">
                    <h3 class="weekly-title">${weekly.title}</h3>
                    <time class="weekly-date" datetime="${weekly.date}">${formatDate(weekly.date)}</time>
                    <p class="weekly-excerpt">${weekly.content}</p>
                </div>
            </a>
        </article>
    `).join('');
    
    container.innerHTML = weeklyHTML;
    
    // 渲染分页
    renderPagination(weeklyData.length, CONFIG.weeklyPerPage);
}

// 渲染分页
function renderPagination(totalItems, itemsPerPage) {
    if (!pagination) return;
    
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // 上一页
    if (currentPage > 1) {
        paginationHTML += `<a href="#" onclick="changePage(${currentPage - 1})">&laquo; 上一页</a>`;
    }
    
    // 页码
    for (let i = 1; i <= totalPages; i++) {
        if (i === currentPage) {
            paginationHTML += `<span class="current">${i}</span>`;
        } else {
            paginationHTML += `<a href="#" onclick="changePage(${i})">${i}</a>`;
        }
    }
    
    // 下一页
    if (currentPage < totalPages) {
        paginationHTML += `<a href="#" onclick="changePage(${currentPage + 1})">下一页 &raquo;</a>`;
    }
    
    pagination.innerHTML = paginationHTML;
}

// 切换页面
function changePage(page) {
    currentPage = page;
    
    if (currentSection === 'weekly') {
        renderWeekly();
    } else {
        renderPosts();
    }
    
    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 更新导航高亮
function updateNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
        
        const href = link.getAttribute('href');
        if ((currentSection === 'blog' && href === '/') ||
            (currentSection === 'weekly' && href === '/weekly/') ||
            (currentSection === 'about' && href === '/about/')) {
            link.classList.add('active');
        }
    });
}

// 格式化日期
function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 搜索功能（可选）
function searchPosts(query) {
    if (!query.trim()) {
        renderPosts();
        return;
    }
    
    const filteredPosts = postsData.filter(post => 
        post.title.toLowerCase().includes(query.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(query.toLowerCase()) ||
        (post.tags && post.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase())))
    );
    
    // 渲染搜索结果
    const searchHTML = filteredPosts.map(post => `
        <article class="post-item">
            <h2 class="post-title">
                <a href="${CONFIG.baseUrl}/posts/${post.id}/">${post.title}</a>
            </h2>
            <div class="post-meta">
                <time datetime="${post.date}">${formatDate(post.date)}</time>
                ${post.tags ? `<span class="tags"> · ${post.tags.join(', ')}</span>` : ''}
            </div>
            <div class="post-excerpt">${post.excerpt}</div>
        </article>
    `).join('');
    
    postsContainer.innerHTML = searchHTML || '<div class="loading">未找到相关文章</div>';
    pagination.innerHTML = '';
}

// 代码块复制功能
function initCodeCopyButtons() {
    // 为所有代码块添加复制按钮
    const codeBlocks = document.querySelectorAll('pre code');
    
    codeBlocks.forEach((codeBlock, index) => {
        const pre = codeBlock.parentElement;
        
        // 创建复制按钮容器
        const copyContainer = document.createElement('div');
        copyContainer.className = 'code-copy-container';
        
        // 创建复制按钮
        const copyButton = document.createElement('button');
        copyButton.className = 'code-copy-btn';
        copyButton.innerHTML = '📋 复制';
        copyButton.setAttribute('data-index', index);
        
        // 添加点击事件
        copyButton.addEventListener('click', function() {
            const code = codeBlock.textContent;
            
            // 使用现代 API 复制到剪贴板
            if (navigator.clipboard) {
                navigator.clipboard.writeText(code).then(() => {
                    copyButton.innerHTML = '✅ 已复制';
                    setTimeout(() => {
                        copyButton.innerHTML = '📋 复制';
                    }, 2000);
                }).catch(() => {
                    fallbackCopyTextToClipboard(code, copyButton);
                });
            } else {
                fallbackCopyTextToClipboard(code, copyButton);
            }
        });
        
        copyContainer.appendChild(copyButton);
        pre.appendChild(copyContainer);
    });
}

// 降级复制方案
function fallbackCopyTextToClipboard(text, button) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        button.innerHTML = '✅ 已复制';
        setTimeout(() => {
            button.innerHTML = '📋 复制';
        }, 2000);
    } catch (err) {
        button.innerHTML = '❌ 复制失败';
        setTimeout(() => {
            button.innerHTML = '📋 复制';
        }, 2000);
    }
    
    document.body.removeChild(textArea);
}

// 页面加载完成后初始化复制按钮
document.addEventListener('DOMContentLoaded', function() {
    // 延迟执行，确保 markdown 内容已渲染
    setTimeout(initCodeCopyButtons, 500);
});

// 导出全局函数
window.changePage = changePage;
window.searchPosts = searchPosts;
window.initCodeCopyButtons = initCodeCopyButtons;