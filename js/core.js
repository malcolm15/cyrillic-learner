
// Settings
let includeLowercase = true; // Default ON - users learn both cases from the start
let autoSubmit = false;
let continuousPlay = false;
let repeatProblems = false;
let darkMode = false;
let problemChars = {}; // Track characters user got wrong

// Load settings from localStorage
function loadSettings() {
    const savedLowercase = localStorage.getItem('includeLowercase');
    const savedAutoSubmit = localStorage.getItem('autoSubmit');
    const savedContinuous = localStorage.getItem('continuousPlay');
    const savedRepeat = localStorage.getItem('repeatProblems');
    const savedDarkMode = localStorage.getItem('darkMode');
    
    if (savedLowercase !== null) {
        includeLowercase = savedLowercase === 'true';
        document.getElementById('lowercase-toggle').checked = includeLowercase;
    } else {
        // First time user - set toggle to match default (true)
        document.getElementById('lowercase-toggle').checked = true;
    }
    if (savedAutoSubmit !== null) {
        autoSubmit = savedAutoSubmit === 'true';
        document.getElementById('autosubmit-toggle').checked = autoSubmit;
    }
    if (savedContinuous !== null) {
        continuousPlay = savedContinuous === 'true';
        document.getElementById('continuous-toggle').checked = continuousPlay;
    }
    if (savedRepeat !== null) {
        repeatProblems = savedRepeat === 'true';
        document.getElementById('repeat-toggle').checked = repeatProblems;
    }
    if (savedDarkMode !== null) {
        darkMode = savedDarkMode === 'true';
        document.getElementById('darkmode-toggle').checked = darkMode;
        if (darkMode) {
            document.body.classList.add('dark-mode');
            // Start rain effect after page loads
            setTimeout(() => startCyrillicRain(), 2000);
        }
    }
    
    updateLowercaseDisplay();
}

function toggleLowercase() {
    includeLowercase = document.getElementById('lowercase-toggle').checked;
    localStorage.setItem('includeLowercase', includeLowercase);
    
    // Track setting change in Google Analytics
    if (typeof gtag !== 'undefined') {
        gtag('event', 'setting_changed', {
            'setting_name': 'lowercase',
            'setting_value': includeLowercase
        });
    }
    
    updateLowercaseDisplay();
}

function toggleAutoSubmit() {
    autoSubmit = document.getElementById('autosubmit-toggle').checked;
    localStorage.setItem('autoSubmit', autoSubmit);
    
    // Track setting change in Google Analytics
    if (typeof gtag !== 'undefined') {
        gtag('event', 'setting_changed', {
            'setting_name': 'auto_submit',
            'setting_value': autoSubmit
        });
    }
}

function toggleContinuous() {
    continuousPlay = document.getElementById('continuous-toggle').checked;
    localStorage.setItem('continuousPlay', continuousPlay);
    
    // Track setting change in Google Analytics
    if (typeof gtag !== 'undefined') {
        gtag('event', 'setting_changed', {
            'setting_name': 'continuous_play',
            'setting_value': continuousPlay
        });
    }
}

function toggleRepeat() {
    repeatProblems = document.getElementById('repeat-toggle').checked;
    localStorage.setItem('repeatProblems', repeatProblems);
    
    // Track setting change in Google Analytics
    if (typeof gtag !== 'undefined') {
        gtag('event', 'setting_changed', {
            'setting_name': 'repeat_problems',
            'setting_value': repeatProblems
        });
    }
}

function toggleDarkMode() {
    darkMode = document.getElementById('darkmode-toggle').checked;
    localStorage.setItem('darkMode', darkMode);
    
    if (darkMode) {
        document.body.classList.add('dark-mode');
        startCyrillicRain();
    } else {
        document.body.classList.remove('dark-mode');
        stopCyrillicRain();
    }
    
    // Track setting change in Google Analytics
    if (typeof gtag !== 'undefined') {
        gtag('event', 'setting_changed', {
            'setting_name': 'dark_mode',
            'setting_value': darkMode
        });
    }
}

// Cyrillic Rain Effect
let rainInterval = null;
const CYRILLIC_CHARS = ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ё', 'Ж', 'З', 'И', 'Й', 'К', 'Л', 'М', 'Н', 'О', 'П', 'Р', 'С', 'Т', 'У', 'Ф', 'Х', 'Ц', 'Ч', 'Ш', 'Щ', 'Ъ', 'Ы', 'Ь', 'Э', 'Ю', 'Я'];

function createRainDrop() {
    const drop = document.createElement('div');
    drop.className = 'cyrillic-rain';
    
    // Create a trail of 6-10 characters (longer trail)
    const trailLength = 6 + Math.floor(Math.random() * 5);
    let chars = [];
    for (let i = 0; i < trailLength; i++) {
        chars.push(CYRILLIC_CHARS[Math.floor(Math.random() * CYRILLIC_CHARS.length)]);
    }
    
    // Main visible characters (first 3-4)
    const visibleChars = chars.slice(0, 3 + Math.floor(Math.random() * 2));
    drop.innerHTML = visibleChars.join('<br>');
    
    // Fading trail characters (rest)
    const trailChars = chars.slice(visibleChars.length);
    drop.setAttribute('data-trail', trailChars.join('\n'));
    
    // Random horizontal position
    const randomX = Math.random() * (window.innerWidth - 50);
    drop.style.left = randomX + 'px';
    
    document.body.appendChild(drop);
    
    // Morph characters rapidly as it falls
    let morphInterval = setInterval(() => {
        if (!document.body.contains(drop)) {
            clearInterval(morphInterval);
            return;
        }
        
        // Change 2-3 characters each cycle for more dynamic effect
        const numChanges = 2 + Math.floor(Math.random() * 2);
        for (let i = 0; i < numChanges; i++) {
            const charIndex = Math.floor(Math.random() * chars.length);
            chars[charIndex] = CYRILLIC_CHARS[Math.floor(Math.random() * CYRILLIC_CHARS.length)];
        }
        
        // Update display
        const newVisibleChars = chars.slice(0, visibleChars.length);
        const newTrailChars = chars.slice(visibleChars.length);
        drop.innerHTML = newVisibleChars.join('<br>');
        drop.setAttribute('data-trail', newTrailChars.join('\n'));
    }, 80); // Faster morphing (every 80ms)
    
    // Remove after animation completes
    setTimeout(() => {
        clearInterval(morphInterval);
        drop.remove();
    }, 2500);
}

function startCyrillicRain() {
    if (rainInterval) return; // Already running
    
    // Create first drop after a short delay
    setTimeout(createRainDrop, 2000);
    
    // Then create drops every 8-15 seconds
    function scheduleNextDrop() {
        const delay = 8000 + Math.random() * 7000; // 8-15 seconds
        rainInterval = setTimeout(() => {
            if (darkMode) { // Only if still in dark mode
                createRainDrop();
                scheduleNextDrop();
            }
        }, delay);
    }
    
    scheduleNextDrop();
}

function stopCyrillicRain() {
    if (rainInterval) {
        clearTimeout(rainInterval);
        rainInterval = null;
    }
    
    // Remove any existing drops
    document.querySelectorAll('.cyrillic-rain').forEach(drop => drop.remove());
}

// Confetti burst for correct answers
function createConfetti() {
    const colors = ['#FFC107', '#FF9800', '#4CAF50', '#2196F3', '#9C27B0'];
    const confettiCount = 15; // Subtle amount
    
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        
        // Random color
        confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
        
        // Start from center of screen
        confetti.style.left = (50 + (Math.random() - 0.5) * 30) + '%';
        confetti.style.top = '40%';
        
        // Random size (small)
        const size = 6 + Math.random() * 6;
        confetti.style.width = size + 'px';
        confetti.style.height = size + 'px';
        
        // Random rotation
        confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
        
        // Add slight random delay
        confetti.style.animationDelay = (Math.random() * 0.1) + 's';
        
        document.body.appendChild(confetti);
        
        // Remove after animation completes
        setTimeout(() => confetti.remove(), 1200);
    }
}

// Logo confetti burst function
function burstConfetti(event, letterElement) {
    // Create confetti animation
    
    const colors = ['#FFC107', '#FF6B35', '#4CAF50', '#2196F3', '#9C27B0'];
    const confettiCount = 15;
    
    // Get the position of the Л letter
    const rect = letterElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.bottom;
    
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.style.position = 'fixed';
        confetti.style.width = '8px';
        confetti.style.height = '8px';
        confetti.style.borderRadius = '50%';
        confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.pointerEvents = 'none';
        confetti.style.zIndex = '10000';
        
        // Start position (at the Л)
        confetti.style.left = centerX + 'px';
        confetti.style.top = centerY + 'px';
        
        // Random horizontal spread
        const randomX = (Math.random() - 0.5) * 60;
        const randomRotation = Math.random() * 720 - 360;
        
        // Animate with CSS
        confetti.style.transition = 'all 1.2s ease-out';
        
        document.body.appendChild(confetti);
        
        // Trigger animation after a tiny delay (for CSS transition to work)
        setTimeout(() => {
            confetti.style.transform = `translate(${randomX}px, 150px) rotate(${randomRotation}deg)`;
            confetti.style.opacity = '0';
        }, 10);
        
        // Remove after animation
        setTimeout(() => confetti.remove(), 1300);
    }
    
    // Don't stop propagation - let parent link work
    return true;
}

function updateLowercaseDisplay() {
    const lowerElement = document.getElementById('current-char-lower');
    if (lowerElement) {
        lowerElement.style.display = includeLowercase ? 'inline-block' : 'none';
    }
}

// Page navigation
function showPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page-content').forEach(page => {
        page.classList.remove('active');
    });
    
    // CRITICAL FIX: Always hide article-view when navigating to main pages
    // This fixes the bug where articles remain visible when clicking nav tabs
    const articleView = document.getElementById('article-view');
    const articlesIndex = document.getElementById('articles-index');
    
    if (pageName === 'articles') {
        // Show articles index, hide article view
        if (articlesIndex) articlesIndex.style.display = 'block';
        if (articleView) articleView.style.display = 'none';
    } else {
        // Hide both articles components when navigating to other pages
        if (articlesIndex) articlesIndex.style.display = 'none';
        if (articleView) articleView.style.display = 'none';
    }
    
    // Show selected page
    document.getElementById(pageName + '-page').classList.add('active');
    
    // Update nav active state
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.classList.remove('active');
    });
    
    // Find and activate the correct nav link
    const activeLink = document.querySelector(`.nav-links a[onclick*="'${pageName}'"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
    
    // Update URL without page reload
    const urlPath = pageName === 'home' ? '/' : `/${pageName}`;
    if (window.location.pathname !== urlPath) {
        window.history.pushState({ page: pageName }, '', urlPath);
    }
    
    // Close mobile menu if open
    document.getElementById('nav-links').classList.remove('active');
    
    // Scroll to top
    window.scrollTo(0, 0);
    
    // Reset quiz if navigating away from home
    if (pageName !== 'home') {
        const refCard = document.querySelector('.char-reference');
        if (refCard) refCard.style.display = 'block';
        const quizContainer = document.getElementById('quiz-container');
        if (quizContainer) quizContainer.classList.remove('active');
    }
}

function toggleMenu() {
    document.getElementById('nav-links').classList.toggle('active');
}

// Close mobile menu on scroll
let lastScrollTop = 0;
window.addEventListener('scroll', function() {
    const navLinks = document.getElementById('nav-links');
    if (navLinks && navLinks.classList.contains('active')) {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Close menu if user scrolls more than 50px
        if (Math.abs(scrollTop - lastScrollTop) > 50) {
            navLinks.classList.remove('active');
        }
        lastScrollTop = scrollTop;
    }
});

// Article data

// Article display order (matches the categorized visual order on the articles page)
const ARTICLE_ORDER = [
    // 🚀 Getting Started
    'getting-started',
    'common-mistakes',
    'memory-tricks',
    'cyrillic-tier-list',
    'false-friends',
    'first-25-words',
    'easy-russian-words',
    // 📚 Alphabet Variants
    'serbian-cyrillic-vs-latin',
    'belarusian-alphabet',
    'montenegrin-alphabet',
    // 📖 History & Culture
    'history-of-cyrillic',
    'lost-letters',
    'glagolitic',
    'cyrillic-names-europe',
    'backwards-r-myth',
    'kazakhstan-latin-transition',
    'latin-vs-cyrillic-slavic',
    'cyrillic-pop-culture',
    // 🛠️ Learning Tools & Resources
    'cyrillic-copy-paste',
    'russian-alphabet-chart',
    'practice-writing-cyrillic',
    'cyrillic-alphabet-chart',
    'cyrillic-learning-resources',
    'common-cyrillic-mistakes'
];

// Article navigation functions
function showArticle(articleId) {
    const article = ARTICLES.find(a => a.id === articleId);
    if (!article) return;
    
    // Hide article index, show article view
    document.getElementById('articles-index').style.display = 'none';
    document.getElementById('article-view').style.display = 'block';
    
    // Load article content
    document.getElementById('article-title').textContent = article.title;
    document.getElementById('article-content').innerHTML = article.content;
    
    // Update URL
    window.history.pushState({ page: 'articles', article: articleId }, '', `/articles/${articleId}`);
    
    // Setup navigation buttons with looping (using visual categorized order)
    const currentIndex = ARTICLE_ORDER.findIndex(id => id === articleId);
    const prevBtn = document.getElementById('prev-article');
    const nextBtn = document.getElementById('next-article');
    
    // Previous button (loop to end if on first article)
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : ARTICLE_ORDER.length - 1;
    prevBtn.setAttribute('data-article-id', ARTICLE_ORDER[prevIndex]);
    
    // Next button (loop to beginning if on last article)
    const nextIndex = currentIndex < ARTICLE_ORDER.length - 1 ? currentIndex + 1 : 0;
    nextBtn.setAttribute('data-article-id', ARTICLE_ORDER[nextIndex]);
    
    // Scroll to top or to anchor if hash present
    const hash = window.location.hash;
    if (hash) {
        setTimeout(() => {
            const target = document.querySelector(hash);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    } else {
        window.scrollTo(0, 0);
    }
    
    // Setup anchor link handlers for TOC
    setTimeout(() => {
        const articleContent = document.getElementById('article-content');
        if (articleContent) {
            const anchorLinks = articleContent.querySelectorAll('a[href^="#"]');
            anchorLinks.forEach(link => {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    const targetId = this.getAttribute('href');
                    const targetElement = document.querySelector(targetId);
                    if (targetElement) {
                        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        history.replaceState(null, null, targetId);
                    }
                });
            });
        }
    }, 50);
    
    // Run article-specific script if it exists
    if (typeof ArticleScripts !== 'undefined' && ArticleScripts[articleId]) {
        setTimeout(() => {
            ArticleScripts[articleId]();
        }, 100);
    }
}

function showArticleIndex() {
    document.getElementById('articles-index').style.display = 'block';
    document.getElementById('article-view').style.display = 'none';
    
    // Update URL
    window.history.pushState({ page: 'articles' }, '', '/articles');
    
    // Scroll to top
    window.scrollTo(0, 0);
}

// Share button functions
function copyArticleLink(articleId, articleTitle) {
    const url = `https://cyrilica.com/articles/${articleId}`;
    
    // Copy to clipboard
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(() => {
            // Show feedback
            const btn = event.target.closest('.share-btn');
            const originalText = btn.innerHTML;
            btn.innerHTML = '✓ Copied!';
            btn.classList.add('copied');
            
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.classList.remove('copied');
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy:', err);
            // Fallback: show URL in alert
            prompt('Copy this link:', url);
        });
    } else {
        // Fallback for older browsers
        prompt('Copy this link:', url);
    }
}

function shareToBluesky(articleId, articleTitle) {
    const url = `https://cyrilica.com/articles/${articleId}`;
    const text = `${articleTitle} ${url}`;
    const blueskyUrl = `https://bsky.app/intent/compose?text=${encodeURIComponent(text)}`;
    window.open(blueskyUrl, '_blank');
}

function shareToReddit(articleId, articleTitle) {
    const url = `https://cyrilica.com/articles/${articleId}`;
    
    // Suggest subreddit based on article
    let subreddit = 'languagelearning'; // default
    
    // Map specific articles to relevant subreddits
    const subredditMap = {
        'cyrillic-pop-culture': 'gaming', // or movies
        'cyrillic-tier-list': 'languagelearning',
        'backwards-r-myth': 'movies',
        'latin-vs-cyrillic-slavic': 'history',
        'kazakhstan-latin-transition': 'geopolitics'
    };
    
    if (subredditMap[articleId]) {
        subreddit = subredditMap[articleId];
    }
    
    const redditUrl = `https://reddit.com/r/${subreddit}/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(articleTitle)}`;
    window.open(redditUrl, '_blank');
}

function nativeShare(articleId, articleTitle) {
    const url = `https://cyrilica.com/articles/${articleId}`;
    
    if (navigator.share) {
        navigator.share({
            title: articleTitle,
            text: `Check out: ${articleTitle}`,
            url: url
        }).catch(err => {
            // User cancelled, ignore
            if (err.name !== 'AbortError') {
                console.error('Share failed:', err);
            }
        });
    } else {
        // Fallback: copy to clipboard
        copyArticleLink(articleId, articleTitle);
    }
}

function navigateArticle(direction) {
    const btn = direction === 'prev' ? document.getElementById('prev-article') : document.getElementById('next-article');
    const articleId = btn.getAttribute('data-article-id');
    if (articleId) {
        showArticle(articleId);
    }
}

// Cyrillic character data with romanizations
const CYRILLIC_DATA = {
    vowels_1: {
        title: 'Vowels 1',
        chars: {
            'А': { upper: 'А', lower: 'а', roman: 'a', audio: 'audio/a.mp3' },
            'Е': { upper: 'Е', lower: 'е', roman: 'ye', audio: 'audio/ye.mp3' },
            'И': { upper: 'И', lower: 'и', roman: 'i', audio: 'audio/i.mp3' },
            'О': { upper: 'О', lower: 'о', roman: 'o', audio: 'audio/o.mp3' },
            'У': { upper: 'У', lower: 'у', roman: 'u', audio: 'audio/u.mp3' }
        }
    },
    vowels_2: {
        title: 'Vowels 2',
        chars: {
            'Ё': { upper: 'Ё', lower: 'ё', roman: 'yo', audio: 'audio/yo.mp3' },
            'Ы': { upper: 'Ы', lower: 'ы', roman: 'y', audio: 'audio/y2.mp3' },
            'Э': { upper: 'Э', lower: 'э', roman: 'e', audio: 'audio/e.mp3' },
            'Ю': { upper: 'Ю', lower: 'ю', roman: 'yu', audio: 'audio/yu.mp3' },
            'Я': { upper: 'Я', lower: 'я', roman: 'ya', audio: 'audio/ya.mp3' }
        }
    },
    consonants_1: {
        title: 'Consonants 1',
        chars: {
            'Б': { upper: 'Б', lower: 'б', roman: 'b', audio: 'audio/b.mp3' },
            'В': { upper: 'В', lower: 'в', roman: 'v', audio: 'audio/v.mp3' },
            'Г': { upper: 'Г', lower: 'г', roman: 'g', audio: 'audio/g.mp3' },
            'Д': { upper: 'Д', lower: 'д', roman: 'd', audio: 'audio/d.mp3' },
            'Ж': { upper: 'Ж', lower: 'ж', roman: 'zh', audio: 'audio/zh.mp3' },
            'З': { upper: 'З', lower: 'з', roman: 'z', audio: 'audio/z.mp3' }
        }
    },
    consonants_2: {
        title: 'Consonants 2',
        chars: {
            'К': { upper: 'К', lower: 'к', roman: 'k', audio: 'audio/k.mp3' },
            'Л': { upper: 'Л', lower: 'л', roman: 'l', audio: 'audio/l.mp3' },
            'М': { upper: 'М', lower: 'м', roman: 'm', audio: 'audio/m.mp3' },
            'Н': { upper: 'Н', lower: 'н', roman: 'n', audio: 'audio/n.mp3' },
            'П': { upper: 'П', lower: 'п', roman: 'p', audio: 'audio/p.mp3' },
            'Р': { upper: 'Р', lower: 'р', roman: 'r', audio: 'audio/r.mp3' }
        }
    },
    consonants_3: {
        title: 'Consonants 3',
        chars: {
            'С': { upper: 'С', lower: 'с', roman: 's', audio: 'audio/s.mp3' },
            'Т': { upper: 'Т', lower: 'т', roman: 't', audio: 'audio/t.mp3' },
            'Ф': { upper: 'Ф', lower: 'ф', roman: 'f', audio: 'audio/f.mp3' },
            'Х': { upper: 'Х', lower: 'х', roman: 'kh', audio: 'audio/kh.mp3' },
            'Ц': { upper: 'Ц', lower: 'ц', roman: 'ts', audio: 'audio/ts.mp3' },
            'Ч': { upper: 'Ч', lower: 'ч', roman: 'ch', audio: 'audio/ch.mp3' }
        }
    },
    consonants_4: {
        title: 'Consonants 4',
        chars: {
            'Ш': { upper: 'Ш', lower: 'ш', roman: 'sh', audio: 'audio/sh.mp3' },
            'Щ': { upper: 'Щ', lower: 'щ', roman: 'shch', audio: 'audio/shch.mp3' },
            'Ъ': { upper: 'Ъ', lower: 'ъ', roman: '"', audio: 'audio/hard.mp3' },
            'Ь': { upper: 'Ь', lower: 'ь', roman: "'", audio: 'audio/soft.mp3' }
        }
    }
};

// Audio playback function
function playPronunciation(audioPath) {
    if (!audioPath) return;
    const audio = new Audio(audioPath);
    audio.volume = 0.7;
    audio.play().catch(error => {
        console.log('Audio playback blocked:', error);
    });
}

// App state
let selectedGroups = new Set();
let studyChars = {};
let currentChar = null;
let questionCount = 0;
let correctCount = 0;
let incorrectCount = 0;
let currentStreak = 0;
let answered = false;

// Initialize character reference guide (now also handles selection)
function initReference() {
    const container = document.getElementById('reference-container');
    
    Object.entries(CYRILLIC_DATA).forEach(([key, group]) => {
        const section = document.createElement('div');
        section.className = 'reference-section';
        section.dataset.group = key;
        
        const title = document.createElement('div');
        title.className = 'section-title';
        title.textContent = group.title;
        section.appendChild(title);
        
        const grid = document.createElement('div');
        grid.className = 'reference-grid';
        
        Object.entries(group.chars).forEach(([letter, data]) => {
            const item = document.createElement('div');
            item.className = 'char-ref-item';
            item.innerHTML = `
                <span class="char-ref-cyrillic">${data.upper}</span>
                <span class="char-ref-roman">${data.roman}</span>
            `;
            grid.appendChild(item);
        });
        
        section.appendChild(grid);
        
        // Add click handler for group selection
        section.addEventListener('click', () => toggleGroup(key, section));
        
        container.appendChild(section);
    });
}

function toggleGroup(groupKey, element) {
    if (selectedGroups.has(groupKey)) {
        selectedGroups.delete(groupKey);
        element.classList.remove('selected');
    } else {
        selectedGroups.add(groupKey);
        element.classList.add('selected');
    }
    
    updateStartButton();
}

function selectAllGroups() {
    // Get all group elements
    const groupElements = document.querySelectorAll('.reference-section');
    
    // Select all groups
    groupElements.forEach(element => {
        const groupKey = element.dataset.group;
        if (groupKey && !selectedGroups.has(groupKey)) {
            selectedGroups.add(groupKey);
            element.classList.add('selected');
        }
    });
    
    updateStartButton();
}

function clearAllGroups() {
    // Get all group elements
    const groupElements = document.querySelectorAll('.reference-section');
    
    // Clear all selections
    groupElements.forEach(element => {
        const groupKey = element.dataset.group;
        if (groupKey && selectedGroups.has(groupKey)) {
            selectedGroups.delete(groupKey);
            element.classList.remove('selected');
        }
    });
    
    updateStartButton();
}

function updateStartButton() {
    const btn = document.getElementById('start-btn');
    btn.disabled = selectedGroups.size === 0;
}

function startQuiz() {
    // Build study character set
    studyChars = {};
    selectedGroups.forEach(groupKey => {
        Object.assign(studyChars, CYRILLIC_DATA[groupKey].chars);
    });
    
    // Reset stats only if continuous play is off
    if (!continuousPlay) {
        questionCount = 0;
        correctCount = 0;
        incorrectCount = 0;
        currentStreak = 0;
        problemChars = {};
    }
    
    // Track quiz start in Google Analytics
    if (typeof gtag !== 'undefined') {
        gtag('event', 'quiz_started', {
            'character_groups': Array.from(selectedGroups).join(', '),
            'num_characters': Object.keys(studyChars).length
        });
    }
    
    // Hide reference and show quiz
    document.querySelector('.char-reference').style.display = 'none';
    document.getElementById('quiz-container').classList.add('active');
    
    // Load first question
    nextQuestion();
}

function nextQuestion() {
    // Pick random character, weighted towards problem characters if enabled
    let randomChar;
    const chars = Object.keys(studyChars);
    
    // If only one character is being studied, we can't avoid repeats
    if (chars.length === 1) {
        randomChar = chars[0];
    } else {
        // Keep picking until we get a different character than current one
        do {
            if (repeatProblems && Object.keys(problemChars).length > 0 && Math.random() < 0.4) {
                // 40% chance to pick from problem characters
                const problemKeys = Object.keys(problemChars);
                randomChar = problemKeys[Math.floor(Math.random() * problemKeys.length)];
            } else {
                // Pick any character
                randomChar = chars[Math.floor(Math.random() * chars.length)];
            }
        } while (randomChar === currentChar && chars.length > 1);
    }
    
    // Update currentChar (this becomes the "last" char for next time)
    currentChar = randomChar;
    
    // Update display
    questionCount++;
    answered = false;
    document.getElementById('current-char').textContent = studyChars[currentChar].upper;
    document.getElementById('current-char-lower').textContent = studyChars[currentChar].lower;
    document.getElementById('progress').textContent = `Question ${questionCount}`;
    document.getElementById('answer-input').value = '';
    document.getElementById('feedback').textContent = '';
    document.getElementById('answer-input').focus();
    
    // Setup audio button
    const audioBtn = document.getElementById('audio-btn');
    if (studyChars[currentChar].audio && audioBtn) {
        audioBtn.style.display = 'block';
        audioBtn.onclick = () => playPronunciation(studyChars[currentChar].audio);
    } else if (audioBtn) {
        audioBtn.style.display = 'none';
    }
    
    updateLowercaseDisplay();
    updateStats();
}

function checkAnswer() {
    if (answered) return;
    
    const input = document.getElementById('answer-input').value.trim().toLowerCase();
    const correct = studyChars[currentChar].roman.toLowerCase();
    const feedback = document.getElementById('feedback');
    
    answered = true;
    
    if (input === correct) {
        feedback.textContent = '✓ Correct!';
        feedback.className = 'feedback correct';
        correctCount++;
        currentStreak++;
        
        // Trigger confetti burst
        createConfetti();
        
        // Remove from problem characters if they got it right
        if (problemChars[currentChar]) {
            delete problemChars[currentChar];
        }
        
        // Track correct answer in Google Analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'question_answered', {
                'result': 'correct',
                'character': currentChar,
                'streak': currentStreak
            });
        }
        
        updateStats();
        
        // If auto-submit is enabled, advance immediately without delay
        if (autoSubmit) {
            nextQuestion();
        } else {
            // Otherwise, show feedback and auto-advance after delay
            setTimeout(() => {
                nextQuestion();
            }, 750); // Perfect for correct answers
        }
    } else {
        feedback.textContent = `✗ Wrong. Correct: ${studyChars[currentChar].roman}`;
        feedback.className = 'feedback incorrect';
        incorrectCount++;
        currentStreak = 0;
        // Add to problem characters if repeat is enabled
        if (repeatProblems) {
            problemChars[currentChar] = true;
        }
        
        // Track incorrect answer in Google Analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'question_answered', {
                'result': 'incorrect',
                'character': currentChar,
                'user_answer': input
            });
        }
        
        updateStats();
        
        // Show wrong answer feedback for LONGER to let users read the correct answer
        setTimeout(() => {
            nextQuestion();
        }, 900); // 20% longer than correct answers (750ms → 900ms)
    }
}

function updateStats() {
    const total = correctCount + incorrectCount;
    document.getElementById('score').textContent = `Score: ${correctCount}/${total}`;
    document.getElementById('correct-count').textContent = correctCount;
    document.getElementById('incorrect-count').textContent = incorrectCount;
    document.getElementById('streak-count').textContent = currentStreak;
}

function skipQuestion() {
    const feedback = document.getElementById('feedback');
    feedback.textContent = `Answer: ${studyChars[currentChar].roman}`;
    feedback.className = 'feedback';
    answered = true;
    
    // Count skip as incorrect and reset streak
    incorrectCount++;
    currentStreak = 0;
    
    // Add to problem characters if repeat is enabled
    if (repeatProblems) {
        problemChars[currentChar] = true;
    }
    
    // Track skip in Google Analytics
    if (typeof gtag !== 'undefined') {
        gtag('event', 'question_skipped', {
            'character': currentChar
        });
    }
    
    updateStats();
    
    setTimeout(() => {
        nextQuestion();
    }, 1500);
}

function resetStats() {
    correctCount = 0;
    incorrectCount = 0;
    currentStreak = 0;
    
    // Track reset in Google Analytics
    if (typeof gtag !== 'undefined') {
        gtag('event', 'quiz_reset');
    }
    
    updateStats();
    
    // Refocus input so user can keep typing
    document.getElementById('answer-input').focus();
}

function newSession() {
    document.querySelector('.char-reference').style.display = 'block';
    document.getElementById('quiz-container').classList.remove('active');
}

function resumeLearning() {
    // Check if there's an active quiz session
    const quizActive = document.getElementById('quiz-container').classList.contains('active');
    
    if (quizActive) {
        // If quiz is already running, just go back to it
        showPage('home');
    } else if (selectedGroups.size > 0) {
        // If groups are selected but quiz isn't running, start it
        showPage('home');
        startQuiz();
    } else {
        // No groups selected, go to home to select them
        showPage('home');
    }
}

// Event listeners
document.getElementById('start-btn').addEventListener('click', startQuiz);
document.getElementById('answer-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        checkAnswer();
    }
});
document.getElementById('skip-btn').addEventListener('click', skipQuestion);
document.getElementById('reset-btn').addEventListener('click', resetStats);
document.getElementById('home-btn').addEventListener('click', newSession);

// Add input listener for auto-submit
document.getElementById('answer-input').addEventListener('input', (e) => {
    // Auto-submit if enabled and answer is correct
    if (autoSubmit && !answered) {
        const input = e.target.value.trim().toLowerCase();
        const correct = studyChars[currentChar].roman.toLowerCase();
        if (input === correct) {
            checkAnswer();
        }
    }
});

// Initialize app
loadSettings();
initReference();

// Handle browser back/forward buttons
window.addEventListener('popstate', (event) => {
    const path = window.location.pathname;
    let pageName = 'home';
    
    if (path === '/' || path === '/home' || path === '') {
        pageName = 'home';
    } else if (path.startsWith('/articles/')) {
        // Article detail page
        const articleId = path.substring(10); // Remove '/articles/'
        showPage('articles');
        showArticle(articleId);
        return;
    } else if (path.startsWith('/')) {
        pageName = path.substring(1); // Remove leading slash
    }
    
    // Check if page exists
    const pageElement = document.getElementById(pageName + '-page');
    if (pageElement) {
        // Temporarily show without updating URL (to avoid loop)
        document.querySelectorAll('.page-content').forEach(page => {
            page.classList.remove('active');
        });
        pageElement.classList.add('active');
        
        // If articles page, show index
        if (pageName === 'articles') {
            document.getElementById('articles-index').style.display = 'block';
            document.getElementById('article-view').style.display = 'none';
        }
        
        // Update nav active state
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.classList.remove('active');
        });
        const activeLink = document.querySelector(`.nav-links a[onclick*="'${pageName}'"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
        
        window.scrollTo(0, 0);
    } else {
        // Invalid page, go to home
        showPage('home');
    }
});

// Load correct page on initial page load based on URL
(function() {
    // Check if redirected from 404.html (direct URL visit)
    const redirect = sessionStorage.getItem('redirect');
    if (redirect) {
        sessionStorage.removeItem('redirect');
        // Use the redirect path
        window.history.replaceState({}, '', redirect);
    }
    
    const path = window.location.pathname;
    let pageName = 'home';
    
    if (path === '/' || path === '/home' || path === '') {
        pageName = 'home';
    } else if (path.startsWith('/articles/')) {
        // Article detail page - load article
        const articleId = path.substring(10);
        pageName = 'articles';
        
        // Show articles page first
        document.querySelectorAll('.page-content').forEach(page => {
            page.classList.remove('active');
        });
        document.getElementById('articles-page').classList.add('active');
        
        // Then show the specific article
        showArticle(articleId);
        
        // Upd          
        // Update nav
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.classList.remove('active');
        });
        const activeLink = document.querySelector(`.nav-links a[onclick*="'articles'"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
        return;
    } else if (path.startsWith('/')) {
        const pathName = path.substring(1);
        // Check if page exists
        if (document.getElementById(pathName + '-page')) {
            pageName = pathName;
        }
    }
    
    // Show the correct page on load
    if (pageName !== 'home') {
        document.querySelectorAll('.page-content').forEach(page => {
            page.classList.remove('active');
        });
        document.getElementById(pageName + '-page').classList.add('active');
        
        // If articles page, show index
        if (pageName === 'articles') {
            document.getElementById('articles-index').style.display = 'block';
            document.getElementById('article-view').style.display = 'none';
        }
        
        // Update nav
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.classList.remove('active');                    link.classList.remove('active');
        });
        const activeLink = document.querySelector(`.nav-links a[onclick*="'${pageName}'"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }
});

// Ensure key functions are accessible globally from inline event handlers
window.showArticle = showArticle;
window.showArticleIndex = showArticleIndex;
window.showPage = showPage;
window.navigateArticle = navigateArticle;
window.burstConfetti = burstConfetti;
window.toggleMenu = toggleMenu;
window.selectAllGroups = selectAllGroups;
window.clearAllGroups = clearAllGroups;
window.checkAnswer = checkAnswer;
window.skipQuestion = skipQuestion;
window.resumeLearning = resumeLearning;
window.toggleLowercase = toggleLowercase;
window.copyArticleLink = copyArticleLink;
window.shareToBluesky = shareToBluesky;
window.shareToReddit = shareToReddit;
window.nativeShare = nativeShare;
