// Medium RSS Feed Integration for medium.funfyp.com
// Using rss2json API to convert Medium RSS to JSON

const RSS_URL = 'https://medium.com/feed/@Funfyp';
const API_URL = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(RSS_URL)}`;

// Load articles when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadArticles();
});

// Main function to fetch and display articles
async function loadArticles() {
    showLoading();
    
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        
        if (data.status === 'ok' && data.items && data.items.length > 0) {
            displayArticles(data.items);
        } else {
            showError();
        }
    } catch (error) {
        console.error('Error fetching articles:', error);
        showError();
    }
}

// Display articles in the grid
function displayArticles(articles) {
    const container = document.getElementById('articles-container');
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    
    // Hide loading and error states
    loading.style.display = 'none';
    error.style.display = 'none';
    
    // Clear container and add articles
    container.innerHTML = '';
    
    articles.forEach((article, index) => {
        const articleCard = createArticleCard(article, index);
        container.appendChild(articleCard);
    });
}

// Create individual article card
function createArticleCard(article, index) {
    const card = document.createElement('div');
    card.className = 'article-card';
    card.style.animationDelay = `${(index + 1) * 0.1}s`;
    
    // Extract image from content or use placeholder
    const imageMatch = article.content.match(/<img[^>]+src="([^">]+)"/g);
    const imageUrl = imageMatch ? imageMatch[1] : null;
    
    // Clean up excerpt (remove HTML tags)
    const excerpt = stripHtml(article.content).substring(0, 200) + '...';
    
    // Format date
    const date = new Date(article.pubDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    
    // Extract reading time estimate (approximate)
    const wordCount = stripHtml(article.content).split(' ').length;
    const readingTime = Math.ceil(wordCount / 200); // Average reading speed
    
    card.innerHTML = `
        ${imageUrl ? `<img src="${imageUrl}" alt="${article.title}" class="article-image" loading="lazy">` : '<div class="article-image" style="background: linear-gradient(45deg, #667eea, #764ba2); display: flex; align-items: center; justify-content: center; color: white; font-size: 1.2rem; font-weight: 600;">📖</div>'}
        <div class="article-content">
            <h3 class="article-title">${article.title}</h3>
            <p class="article-excerpt">${excerpt}</p>
            <div class="article-meta">
                <span class="article-date">${date}</span>
                <span class="reading-time">${readingTime} min read</span>
            </div>
            <div class="article-tags">
                ${extractTags(article.categories).map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
            <a href="${article.link}" target="_blank" class="read-more">Read Full Article</a>
        </div>
    `;
    
    // Add click handler for the entire card
    card.addEventListener('click', function(e) {
        if (e.target.tagName !== 'A') {
            window.open(article.link, '_blank');
        }
    });
    
    return card;
}

// Helper function to strip HTML tags
function stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
}

// Extract and format tags/categories
function extractTags(categories) {
    if (!categories || categories.length === 0) {
        return ['Article'];
    }
    return categories.slice(0, 3); // Limit to first 3 tags
}

// Show loading state
function showLoading() {
    document.getElementById('loading').style.display = 'flex';
    document.getElementById('error').style.display = 'none';
    document.getElementById('articles-container').innerHTML = '';
}

// Show error state
function showError() {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error').style.display = 'block';
    document.getElementById('articles-container').innerHTML = '';
}

// Auto-refresh articles every 30 minutes
setInterval(loadArticles, 30 * 60 * 1000);

// Add smooth scrolling for internal links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add intersection observer for animation triggers
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe article cards when they're added
function observeArticleCards() {
    const cards = document.querySelectorAll('.article-card');
    cards.forEach(card => observer.observe(card));
}

// Call after articles are loaded
const originalDisplayArticles = displayArticles;
displayArticles = function(articles) {
    originalDisplayArticles(articles);
    setTimeout(observeArticleCards, 100);
};

// Handle offline/online status
window.addEventListener('online', function() {
    console.log('Connection restored, refreshing articles...');
    loadArticles();
});

window.addEventListener('offline', function() {
    console.log('Connection lost');
    // Could show an offline indicator here
});

// Keyboard navigation for accessibility
document.addEventListener('keydown', function(e) {
    if (e.key === 'r' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        loadArticles();
    }
});

console.log('📖 Medium.funfyp.com loaded successfully!');
console.log('🔄 Articles will auto-refresh every 30 minutes');
console.log('⌨️  Press Ctrl+R (Cmd+R) to manually refresh articles');