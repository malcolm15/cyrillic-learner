// ==================== ARTICLE SCRIPTS ====================
// Interactive functionality for articles
// Each article can have its own script function

const ArticleScripts = {};

// ==================== HELPER FUNCTIONS ====================

// Helper: Copy text to clipboard
function copyToClipboard(text, button) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function() {
            showCopiedFeedback(button);
        }).catch(function(err) {
            fallbackCopy(text, button);
        });
    } else {
        fallbackCopy(text, button);
    }
}

function fallbackCopy(text, button) {
    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
        showCopiedFeedback(button);
    } catch (err) {
        console.error('Copy failed');
    }
    document.body.removeChild(textarea);
}

function showCopiedFeedback(button) {
    button.classList.add('copied');
    setTimeout(function() {
        button.classList.remove('copied');
    }, 1500);
}

// ==================== ARTICLE SCRIPTS ====================

// Cyrillic Copy-Paste Interactive Functionality
ArticleScripts['cyrillic-copy-paste'] = function() {
    if (typeof CYRILLIC_DATA === 'undefined') return;
    
    var uppercaseContainer = document.getElementById('uppercase-container');
    var lowercaseContainer = document.getElementById('lowercase-container');
    var specialContainer = document.getElementById('special-container');
    
    if (!uppercaseContainer || !lowercaseContainer || !specialContainer) return;

    var uppercase = [];
    var lowercase = [];
    var special = ['Ё', 'ё', 'Ъ', 'ъ', 'Ь', 'ь', 'Ы', 'ы', 'Э', 'э', 'Ю', 'ю', 'Я', 'я'];

    // Collect all letters from CYRILLIC_DATA
    var groupKeys = Object.keys(CYRILLIC_DATA);
    for (var i = 0; i < groupKeys.length; i++) {
        var group = CYRILLIC_DATA[groupKeys[i]];
        var charKeys = Object.keys(group.chars);
        for (var j = 0; j < charKeys.length; j++) {
            var data = group.chars[charKeys[j]];
            uppercase.push(data.upper);
            lowercase.push(data.lower);
        }
    }

    function removeDuplicates(arr) {
        var unique = [];
        for (var i = 0; i < arr.length; i++) {
            if (unique.indexOf(arr[i]) === -1) {
                unique.push(arr[i]);
            }
        }
        return unique.sort();
    }

    var uniqueUpper = removeDuplicates(uppercase);
    var uniqueLower = removeDuplicates(lowercase);

    function createCopyButton(char) {
        var btn = document.createElement('button');
        btn.className = 'copy-char-btn';
        btn.textContent = char;
        
        var feedback = document.createElement('span');
        feedback.className = 'copy-feedback';
        feedback.textContent = 'Copied!';
        btn.appendChild(feedback);
        
        btn.onclick = function() {
            copyToClipboard(char, btn);
        };
        
        return btn;
    }

    // Build uppercase buttons
    for (var i = 0; i < uniqueUpper.length; i++) {
        if (special.indexOf(uniqueUpper[i]) === -1) {
            uppercaseContainer.appendChild(createCopyButton(uniqueUpper[i]));
        }
    }

    // Build lowercase buttons
    for (var i = 0; i < uniqueLower.length; i++) {
        if (special.indexOf(uniqueLower[i]) === -1) {
            lowercaseContainer.appendChild(createCopyButton(uniqueLower[i]));
        }
    }

    // Build special character buttons
    for (var i = 0; i < special.length; i++) {
        specialContainer.appendChild(createCopyButton(special[i]));
    }
};

// ==================== RUSSIAN ALPHABET CHART ====================
ArticleScripts['russian-alphabet-chart'] = function() {
    if (typeof CYRILLIC_DATA === 'undefined') return;
    
    var alphabetGrid = document.getElementById('alphabet-grid');
    var filterBtns = document.querySelectorAll('.filter-btn');
    var letterCount = document.getElementById('letter-count');
    
    if (!alphabetGrid) return;
    
    // Complete Russian alphabet with metadata
    var russianAlphabet = [
        // Vowels
        {char: 'А', lower: 'а', sound: 'ah', trans: 'a', example: 'автобус (bus)', type: 'vowel', difficulty: 'easy'},
        {char: 'Е', lower: 'е', sound: 'yeh', trans: 'ye/e', example: 'есть (to eat)', type: 'vowel', difficulty: 'easy'},
        {char: 'Ё', lower: 'ё', sound: 'yo', trans: 'yo', example: 'ёлка (tree)', type: 'vowel', difficulty: 'medium'},
        {char: 'И', lower: 'и', sound: 'ee', trans: 'i', example: 'имя (name)', type: 'vowel', difficulty: 'medium'},
        {char: 'О', lower: 'о', sound: 'oh', trans: 'o', example: 'окно (window)', type: 'vowel', difficulty: 'easy'},
        {char: 'У', lower: 'у', sound: 'oo', trans: 'u', example: 'утро (morning)', type: 'vowel', difficulty: 'medium'},
        {char: 'Ы', lower: 'ы', sound: 'ih', trans: 'y', example: 'мы (we)', type: 'vowel', difficulty: 'hard'},
        {char: 'Э', lower: 'э', sound: 'eh', trans: 'e', example: 'это (this)', type: 'vowel', difficulty: 'medium'},
        {char: 'Ю', lower: 'ю', sound: 'yoo', trans: 'yu', example: 'юг (south)', type: 'vowel', difficulty: 'medium'},
        {char: 'Я', lower: 'я', sound: 'ya', trans: 'ya', example: 'яблоко (apple)', type: 'vowel', difficulty: 'medium'},
        
        // Consonants
        {char: 'Б', lower: 'б', sound: 'b', trans: 'b', example: 'банк (bank)', type: 'consonant', difficulty: 'easy'},
        {char: 'В', lower: 'в', sound: 'v', trans: 'v', example: 'вода (water)', type: 'consonant', difficulty: 'medium'},
        {char: 'Г', lower: 'г', sound: 'g', trans: 'g', example: 'город (city)', type: 'consonant', difficulty: 'easy'},
        {char: 'Д', lower: 'д', sound: 'd', trans: 'd', example: 'дом (house)', type: 'consonant', difficulty: 'easy'},
        {char: 'Ж', lower: 'ж', sound: 'zh', trans: 'zh', example: 'жизнь (life)', type: 'consonant', difficulty: 'hard'},
        {char: 'З', lower: 'з', sound: 'z', trans: 'z', example: 'зима (winter)', type: 'consonant', difficulty: 'easy'},
        {char: 'Й', lower: 'й', sound: 'y', trans: 'y', example: 'мой (my)', type: 'consonant', difficulty: 'medium'},
        {char: 'К', lower: 'к', sound: 'k', trans: 'k', example: 'кот (cat)', type: 'consonant', difficulty: 'easy'},
        {char: 'Л', lower: 'л', sound: 'l', trans: 'l', example: 'лес (forest)', type: 'consonant', difficulty: 'easy'},
        {char: 'М', lower: 'м', sound: 'm', trans: 'm', example: 'мама (mom)', type: 'consonant', difficulty: 'easy'},
        {char: 'Н', lower: 'н', sound: 'n', trans: 'n', example: 'нет (no)', type: 'consonant', difficulty: 'medium'},
        {char: 'П', lower: 'п', sound: 'p', trans: 'p', example: 'папа (dad)', type: 'consonant', difficulty: 'easy'},
        {char: 'Р', lower: 'р', sound: 'r', trans: 'r', example: 'рука (hand)', type: 'consonant', difficulty: 'medium'},
        {char: 'С', lower: 'с', sound: 's', trans: 's', example: 'слово (word)', type: 'consonant', difficulty: 'medium'},
        {char: 'Т', lower: 'т', sound: 't', trans: 't', example: 'там (there)', type: 'consonant', difficulty: 'easy'},
        {char: 'Ф', lower: 'ф', sound: 'f', trans: 'f', example: 'фото (photo)', type: 'consonant', difficulty: 'easy'},
        {char: 'Х', lower: 'х', sound: 'kh', trans: 'kh', example: 'хлеб (bread)', type: 'consonant', difficulty: 'hard'},
        {char: 'Ц', lower: 'ц', sound: 'ts', trans: 'ts', example: 'цена (price)', type: 'consonant', difficulty: 'hard'},
        {char: 'Ч', lower: 'ч', sound: 'ch', trans: 'ch', example: 'час (hour)', type: 'consonant', difficulty: 'medium'},
        {char: 'Ш', lower: 'ш', sound: 'sh', trans: 'sh', example: 'школа (school)', type: 'consonant', difficulty: 'medium'},
        {char: 'Щ', lower: 'щ', sound: 'shch', trans: 'shch', example: 'щи (soup)', type: 'consonant', difficulty: 'hard'},
        
        // Signs
        {char: 'Ъ', lower: 'ъ', sound: 'hard sign', trans: '(none)', example: 'объект (object)', type: 'sign', difficulty: 'hard'},
        {char: 'Ь', lower: 'ь', sound: 'soft sign', trans: '(none)', example: 'день (day)', type: 'sign', difficulty: 'hard'}
    ];
    
    var currentFilter = 'all';
    
    // Difficulty colors
    var difficultyColors = {
        'easy': '#27ae60',
        'medium': '#f39c12',
        'hard': '#e74c3c'
    };
    
    function createLetterCard(letter) {
        var card = document.createElement('div');
        card.className = 'letter-card';
        card.setAttribute('data-type', letter.type);
        card.style.cssText = 'border: 2px solid ' + difficultyColors[letter.difficulty] + '; border-radius: 8px; padding: 15px; background: white; cursor: pointer; transition: all 0.2s;';
        
        // Add hover effect
        card.onmouseenter = function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        };
        card.onmouseleave = function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'none';
        };
        
        // Character display
        var charDisplay = document.createElement('div');
        charDisplay.style.cssText = 'font-size: 48px; font-weight: bold; text-align: center; color: #2c3e50; margin-bottom: 10px;';
        charDisplay.textContent = letter.char + ' ' + letter.lower;
        
        // Sound/pronunciation
        var soundDisplay = document.createElement('div');
        soundDisplay.style.cssText = 'font-size: 18px; font-weight: bold; color: ' + difficultyColors[letter.difficulty] + '; text-align: center; margin: 8px 0;';
        soundDisplay.textContent = letter.sound;
        
        // Transliteration
        var transDisplay = document.createElement('div');
        transDisplay.style.cssText = 'font-size: 14px; color: #7f8c8d; text-align: center; margin: 5px 0;';
        transDisplay.textContent = '(' + letter.trans + ')';
        
        // Example
        var exampleDisplay = document.createElement('div');
        exampleDisplay.style.cssText = 'font-size: 13px; color: #34495e; text-align: center; margin-top: 10px; padding-top: 10px; border-top: 1px solid #ecf0f1;';
        exampleDisplay.textContent = letter.example;
        
        // Audio button (if audio exists)
        var audioBtn = document.createElement('button');
        audioBtn.textContent = '🔊 Listen';
        audioBtn.style.cssText = 'width: 100%; padding: 8px; margin-top: 10px; background: ' + difficultyColors[letter.difficulty] + '; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;';
        audioBtn.onclick = function(e) {
            e.stopPropagation();
            playAudio(letter.char);
        };
        
        card.appendChild(charDisplay);
        card.appendChild(soundDisplay);
        card.appendChild(transDisplay);
        card.appendChild(exampleDisplay);
        card.appendChild(audioBtn);
        
        return card;
    }
    
    function playAudio(char) {
        console.log('playAudio called for:', char);
        
        // Look up the character in CYRILLIC_DATA to get the correct audio path
        if (typeof CYRILLIC_DATA === 'undefined') {
            console.log('CYRILLIC_DATA is undefined');
            return;
        }
        
        console.log('CYRILLIC_DATA exists');
        
        var audioPath = null;
        var groupKeys = Object.keys(CYRILLIC_DATA);
        
        // Search through all character groups to find this character
        for (var i = 0; i < groupKeys.length; i++) {
            var group = CYRILLIC_DATA[groupKeys[i]];
            if (group.chars && group.chars[char]) {
                audioPath = group.chars[char].audio;
                console.log('Found audio path:', audioPath);
                break;
            }
        }
        
        if (audioPath) {
            console.log('Attempting to play:', audioPath);
            // Make path absolute if it's not already
            const fullPath = audioPath.startsWith('/') ? audioPath : '/' + audioPath;
            var audio = new Audio(fullPath);
            audio.volume = 0.7;
            audio.play().then(function() {
                console.log('Audio playing successfully');
            }).catch(function(err) {
                console.log('Audio playback failed for ' + char + ':', err);
            });
        } else {
            console.log('No audio file found for ' + char);
        }
    }
    
    function renderAlphabet(filter) {
        alphabetGrid.innerHTML = '';
        var count = 0;
        
        for (var i = 0; i < russianAlphabet.length; i++) {
            var letter = russianAlphabet[i];
            
            // Apply filter
            if (filter === 'all' || 
                (filter === 'vowels' && letter.type === 'vowel') ||
                (filter === 'consonants' && letter.type === 'consonant')) {
                
                alphabetGrid.appendChild(createLetterCard(letter));
                count++;
            }
        }
        
        // Update count
        letterCount.textContent = count + ' letter' + (count !== 1 ? 's' : '');
    }
    
    // Setup filter buttons
    for (var i = 0; i < filterBtns.length; i++) {
        filterBtns[i].onclick = function() {
            // Update active state
            for (var j = 0; j < filterBtns.length; j++) {
                filterBtns[j].classList.remove('active');
                filterBtns[j].style.background = 'transparent';
                filterBtns[j].style.color = '#e74c3c';
            }
            this.classList.add('active');
            this.style.background = '#e74c3c';
            this.style.color = 'white';
            
            // Apply filter
            var filter = this.getAttribute('data-filter');
            currentFilter = filter;
            renderAlphabet(filter);
        };
    }
    
    // Initial render
    renderAlphabet('all');
};

// ==================== GENERIC MINI QUIZ ENGINE ====================
// Supports multiple embedded quizzes on any page.
// Each quiz is identified by a DOM prefix (e.g. 'mini', 'mem', 'cg1').
// QUIZ_CONFIGS is keyed by prefix. initArticleQuizzes scans the DOM
// for any quiz whose elements exist and starts them automatically.

const quizInstances = {};

const QUIZ_CONFIGS = {
    // False Friends article
    'mini': {
        chars: {
            'В': { upper: 'В', lower: 'в', roman: 'v', audio: 'audio/v.mp3' },
            'Н': { upper: 'Н', lower: 'н', roman: 'n', audio: 'audio/n.mp3' },
            'Р': { upper: 'Р', lower: 'р', roman: 'r', audio: 'audio/r.mp3' },
            'С': { upper: 'С', lower: 'с', roman: 's', audio: 'audio/s.mp3' },
            'У': { upper: 'У', lower: 'у', roman: 'u', audio: 'audio/u.mp3' },
            'Х': { upper: 'Х', lower: 'х', roman: 'kh', audio: 'audio/kh.mp3' }
        }
    },
    // Memory Tricks article
    'mem': {
        chars: {
            'Ж': { upper: 'Ж', lower: 'ж', roman: 'zh', audio: 'audio/zh.mp3' },
            'Ш': { upper: 'Ш', lower: 'ш', roman: 'sh', audio: 'audio/sh.mp3' },
            'Щ': { upper: 'Щ', lower: 'щ', roman: 'shch', audio: 'audio/shch.mp3' },
            'Ы': { upper: 'Ы', lower: 'ы', roman: 'y', audio: 'audio/y2.mp3' },
            'Э': { upper: 'Э', lower: 'э', roman: 'e', audio: 'audio/e.mp3' },
            'Ю': { upper: 'Ю', lower: 'ю', roman: 'yu', audio: 'audio/yu.mp3' },
            'Я': { upper: 'Я', lower: 'я', roman: 'ya', audio: 'audio/ya.mp3' }
        }
    },
    // Chart article — Group 1: Easy Vowels
    'cg1': {
        chars: {
            'А': { upper: 'А', lower: 'а', roman: 'a', audio: 'audio/a.mp3' },
            'Е': { upper: 'Е', lower: 'е', roman: 'ye', audio: 'audio/ye.mp3' },
            'О': { upper: 'О', lower: 'о', roman: 'o', audio: 'audio/o.mp3' },
            'У': { upper: 'У', lower: 'у', roman: 'u', audio: 'audio/u.mp3' }
        }
    },
    // Chart article — Group 2: Tricky Vowels
    'cg2': {
        chars: {
            'И': { upper: 'И', lower: 'и', roman: 'i', audio: 'audio/i.mp3' },
            'Ы': { upper: 'Ы', lower: 'ы', roman: 'y', audio: 'audio/y2.mp3' },
            'Э': { upper: 'Э', lower: 'э', roman: 'e', audio: 'audio/e.mp3' },
            'Ё': { upper: 'Ё', lower: 'ё', roman: 'yo', audio: 'audio/yo.mp3' },
            'Ю': { upper: 'Ю', lower: 'ю', roman: 'yu', audio: 'audio/yu.mp3' },
            'Я': { upper: 'Я', lower: 'я', roman: 'ya', audio: 'audio/ya.mp3' }
        }
    },
    // Chart article — Group 3: False Friend Consonants
    'cg3': {
        chars: {
            'В': { upper: 'В', lower: 'в', roman: 'v', audio: 'audio/v.mp3' },
            'Н': { upper: 'Н', lower: 'н', roman: 'n', audio: 'audio/n.mp3' },
            'Р': { upper: 'Р', lower: 'р', roman: 'r', audio: 'audio/r.mp3' },
            'С': { upper: 'С', lower: 'с', roman: 's', audio: 'audio/s.mp3' },
            'Х': { upper: 'Х', lower: 'х', roman: 'kh', audio: 'audio/kh.mp3' }
        }
    },
    // Chart article — Group 4: Easy Consonants
    'cg4': {
        chars: {
            'Б': { upper: 'Б', lower: 'б', roman: 'b', audio: 'audio/b.mp3' },
            'Г': { upper: 'Г', lower: 'г', roman: 'g', audio: 'audio/g.mp3' },
            'Д': { upper: 'Д', lower: 'д', roman: 'd', audio: 'audio/d.mp3' },
            'З': { upper: 'З', lower: 'з', roman: 'z', audio: 'audio/z.mp3' },
            'К': { upper: 'К', lower: 'к', roman: 'k', audio: 'audio/k.mp3' },
            'Л': { upper: 'Л', lower: 'л', roman: 'l', audio: 'audio/l.mp3' },
            'М': { upper: 'М', lower: 'м', roman: 'm', audio: 'audio/m.mp3' },
            'П': { upper: 'П', lower: 'п', roman: 'p', audio: 'audio/p.mp3' },
            'Т': { upper: 'Т', lower: 'т', roman: 't', audio: 'audio/t.mp3' },
            'Ф': { upper: 'Ф', lower: 'ф', roman: 'f', audio: 'audio/f.mp3' }
        }
    },
    // Chart article — Group 5: Weird Unique Letters
    'cg5': {
        chars: {
            'Ж': { upper: 'Ж', lower: 'ж', roman: 'zh', audio: 'audio/zh.mp3' },
            'Й': { upper: 'Й', lower: 'й', roman: 'y', audio: null },
            'Ц': { upper: 'Ц', lower: 'ц', roman: 'ts', audio: 'audio/ts.mp3' },
            'Ч': { upper: 'Ч', lower: 'ч', roman: 'ch', audio: 'audio/ch.mp3' },
            'Ш': { upper: 'Ш', lower: 'ш', roman: 'sh', audio: 'audio/sh.mp3' },
            'Щ': { upper: 'Щ', lower: 'щ', roman: 'shch', audio: 'audio/shch.mp3' }
        }
    }
};

// Initialize all quizzes whose DOM elements exist on the current page
function initArticleQuizzes() {
    for (const prefix in QUIZ_CONFIGS) {
        const activeEl = document.getElementById(prefix + '-quiz-active');
        if (activeEl) {
            quizStart(prefix);
        }
    }
}

// --- Core engine functions (prefix-based) ---

function quizStart(prefix) {
    const config = QUIZ_CONFIGS[prefix];
    if (!config) return;
    
    const charKeys = Object.keys(config.chars).sort(() => Math.random() - 0.5);
    
    quizInstances[prefix] = {
        chars: config.chars,
        charKeys: charKeys,
        totalCount: charKeys.length,
        currentChar: null,
        currentIndex: 0,
        correctCount: 0,
        incorrectCount: 0,
        streak: 0,
        answered: false,
        questionsAsked: 0
    };
    
    // Show quiz, hide completion screen
    document.getElementById(prefix + '-quiz-active').style.display = 'block';
    document.getElementById(prefix + '-quiz-complete').style.display = 'none';
    
    // Setup input listeners (clone to remove old listeners)
    const input = document.getElementById(prefix + '-answer-input');
    if (input) {
        const newInput = input.cloneNode(true);
        input.parentNode.replaceChild(newInput, input);
        
        newInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') quizCheck(prefix);
        });
        
        newInput.addEventListener('input', function(e) {
            const state = quizInstances[prefix];
            if (typeof autoSubmit !== 'undefined' && autoSubmit && state && !state.answered) {
                const val = e.target.value.trim().toLowerCase();
                const correct = state.chars[state.currentChar]?.roman.toLowerCase();
                if (val === correct) quizCheck(prefix);
            }
        });
    }
    
    quizNext(prefix);
}

function quizNext(prefix) {
    const state = quizInstances[prefix];
    if (!state) return;
    
    if (state.currentIndex >= state.charKeys.length) {
        quizShowComplete(prefix);
        return;
    }
    
    state.currentChar = state.charKeys[state.currentIndex];
    state.answered = false;
    
    const charData = state.chars[state.currentChar];
    
    document.getElementById(prefix + '-current-char').textContent = charData.upper;
    document.getElementById(prefix + '-current-char-lower').textContent = charData.lower;
    document.getElementById(prefix + '-answer-input').value = '';
    document.getElementById(prefix + '-feedback').textContent = '';
    document.getElementById(prefix + '-answer-input').focus();
    document.getElementById(prefix + '-progress').textContent = state.questionsAsked + '/' + state.totalCount;
    
    // Setup audio button
    const audioBtn = document.getElementById(prefix + '-audio-btn');
    if (charData.audio && audioBtn) {
        audioBtn.style.display = 'inline-block';
        audioBtn.onclick = () => {
            const audio = new Audio('/' + charData.audio);
            audio.volume = 0.7;
            audio.play().catch(err => console.log('Audio playback failed:', err));
        };
    } else if (audioBtn) {
        audioBtn.style.display = 'none';
    }
    
    // Update lowercase display based on global setting
    const lowerEl = document.getElementById(prefix + '-current-char-lower');
    if (lowerEl && typeof includeLowercase !== 'undefined') {
        lowerEl.style.display = includeLowercase ? 'inline-block' : 'none';
    }
    
    quizUpdateStats(prefix);
}

function quizCheck(prefix) {
    const state = quizInstances[prefix];
    if (!state || state.answered) return;
    
    const input = document.getElementById(prefix + '-answer-input').value.trim().toLowerCase();
    const correct = state.chars[state.currentChar].roman.toLowerCase();
    const feedback = document.getElementById(prefix + '-feedback');
    
    state.answered = true;
    
    if (input === correct) {
        feedback.textContent = '✓ Correct!';
        feedback.className = 'feedback correct';
        state.correctCount++;
        state.streak++;
        
        quizConfetti();
        
        // Auto-play audio if setting enabled
        if (typeof autoPlayAudio !== 'undefined' && autoPlayAudio && state.chars[state.currentChar].audio) {
            const audio = new Audio('/' + state.chars[state.currentChar].audio);
            audio.volume = 0.7;
            audio.play().catch(err => console.log('Audio playback failed:', err));
        }
        
        quizUpdateStats(prefix);
        state.questionsAsked++;
        
        setTimeout(() => { state.currentIndex++; quizNext(prefix); }, 600);
    } else {
        feedback.textContent = `✗ Wrong. Correct: ${state.chars[state.currentChar].roman}`;
        feedback.className = 'feedback incorrect';
        state.incorrectCount++;
        state.streak = 0;
        
        quizUpdateStats(prefix);
        state.questionsAsked++;
        
        setTimeout(() => { state.currentIndex++; quizNext(prefix); }, 900);
    }
}

function quizSkip(prefix) {
    const state = quizInstances[prefix];
    if (!state) return;
    
    const feedback = document.getElementById(prefix + '-feedback');
    feedback.textContent = `Answer: ${state.chars[state.currentChar].roman}`;
    feedback.className = 'feedback';
    state.answered = true;
    state.incorrectCount++;
    state.streak = 0;
    
    quizUpdateStats(prefix);
    state.questionsAsked++;
    
    setTimeout(() => { state.currentIndex++; quizNext(prefix); }, 1200);
}

function quizReset(prefix) {
    quizStart(prefix);
}

function quizUpdateStats(prefix) {
    const state = quizInstances[prefix];
    if (!state) return;
    const total = state.correctCount + state.incorrectCount;
    document.getElementById(prefix + '-score').textContent = state.correctCount + '/' + total;
    document.getElementById(prefix + '-streak').textContent = state.streak;
}

function quizShowComplete(prefix) {
    const state = quizInstances[prefix];
    if (!state) return;
    
    document.getElementById(prefix + '-quiz-active').style.display = 'none';
    document.getElementById(prefix + '-quiz-complete').style.display = 'block';
    
    const total = state.correctCount + state.incorrectCount;
    const pct = total > 0 ? Math.round((state.correctCount / total) * 100) : 0;
    document.getElementById(prefix + '-final-score').textContent =
        `You got ${state.correctCount} out of ${total} correct (${pct}%)!`;
}

function quizConfetti() {
    const colors = ['#FFC107', '#FF9800', '#4CAF50', '#2196F3', '#9C27B0'];
    for (let i = 0; i < 8; i++) {
        const c = document.createElement('div');
        c.className = 'confetti';
        c.style.background = colors[Math.floor(Math.random() * colors.length)];
        c.style.left = (50 + (Math.random() - 0.5) * 20) + '%';
        c.style.top = '40%';
        const size = 4 + Math.random() * 4;
        c.style.width = size + 'px';
        c.style.height = size + 'px';
        c.style.transform = `rotate(${Math.random() * 360}deg)`;
        c.style.animationDelay = (Math.random() * 0.1) + 's';
        document.body.appendChild(c);
        setTimeout(() => c.remove(), 1200);
    }
}

// --- Backward-compatible wrappers for False Friends (prefix: mini) ---
function startMiniQuiz()    { quizStart('mini'); }
function checkMiniAnswer()  { quizCheck('mini'); }
function skipMiniQuestion() { quizSkip('mini'); }
function resetMiniQuiz()    { quizReset('mini'); }

// --- Wrappers for Memory Tricks quiz (prefix: mem) ---
function startMemQuiz()     { quizStart('mem'); }
function checkMemAnswer()   { quizCheck('mem'); }
function skipMemQuestion()  { quizSkip('mem'); }
function resetMemQuiz()     { quizReset('mem'); }

// --- Wrappers for Chart Group quizzes (prefix: cg1-cg5) ---
function checkCgAnswer(n)   { quizCheck('cg' + n); }
function skipCgQuestion(n)  { quizSkip('cg' + n); }
function resetCgQuiz(n)     { quizReset('cg' + n); }

// Expose all functions globally
window.startMiniQuiz = startMiniQuiz;
window.checkMiniAnswer = checkMiniAnswer;
window.skipMiniQuestion = skipMiniQuestion;
window.resetMiniQuiz = resetMiniQuiz;
window.startMemQuiz = startMemQuiz;
window.checkMemAnswer = checkMemAnswer;
window.skipMemQuestion = skipMemQuestion;
window.resetMemQuiz = resetMemQuiz;
window.checkCgAnswer = checkCgAnswer;
window.skipCgQuestion = skipCgQuestion;
window.resetCgQuiz = resetCgQuiz;
window.initArticleQuizzes = initArticleQuizzes;

// ==================== CHART ARTICLE: GROUP QUIZZES ====================
// Generates quiz HTML dynamically for placeholder divs in the chart article

function generateGroupQuizHTML(prefix, groupNum, count, title, subtitle) {
    return `
        <div class="mini-quiz-container">
            <div class="mini-quiz-header">
                <h3 style="margin: 0 0 10px 0;">${title}</h3>
                <p style="margin: 0; color: #666; font-size: 0.95rem;">${subtitle}</p>
            </div>
            <div id="${prefix}-quiz-content" class="quiz-content">
                <div id="${prefix}-quiz-active">
                    <div class="mini-quiz-question">
                        <div class="mini-char-display">
                            <span id="${prefix}-current-char"></span>
                            <span id="${prefix}-current-char-lower" class="quiz-char-lower" style="display: none;"></span>
                            <button class="audio-btn" id="${prefix}-audio-btn" style="display: none; margin-left: 10px;" title="Hear pronunciation">🔊</button>
                        </div>
                        <div class="mini-input-area">
                            <input type="text" id="${prefix}-answer-input" class="quiz-answer-input" placeholder="Type romanization..." autocomplete="off" autocapitalize="off">
                            <button class="btn" onclick="checkCgAnswer(${groupNum})">Submit</button>
                        </div>
                        <div id="${prefix}-feedback" class="feedback quiz-feedback"></div>
                    </div>
                    <div class="mini-quiz-stats">
                        <div class="mini-stat">
                            <span class="mini-stat-label">Progress:</span>
                            <span id="${prefix}-progress">0/${count}</span>
                        </div>
                        <div class="mini-stat">
                            <span class="mini-stat-label">Score:</span>
                            <span id="${prefix}-score">0/0</span>
                        </div>
                        <div class="mini-stat">
                            <span class="mini-stat-label">Streak:</span>
                            <span id="${prefix}-streak">0</span>
                        </div>
                    </div>
                    <div class="mini-quiz-controls">
                        <button class="btn btn-secondary" onclick="skipCgQuestion(${groupNum})">Skip</button>
                        <button class="btn btn-secondary" onclick="resetCgQuiz(${groupNum})">Reset</button>
                    </div>
                </div>
                <div id="${prefix}-quiz-complete" style="display: none; text-align: center; padding: 15px;">
                    <h4 style="color: var(--red); margin-bottom: 8px;">🎉 Group ${groupNum} complete!</h4>
                    <p id="${prefix}-final-score" style="font-size: 1.1rem; margin-bottom: 12px;"></p>
                    <button class="btn" onclick="resetCgQuiz(${groupNum})">Practice Again</button>
                </div>
            </div>
        </div>`;
}

ArticleScripts['cyrillic-alphabet-chart'] = function() {
    const quizGroups = [
        { num: 1, prefix: 'cg1', count: 4, title: 'Drill: Easy Vowels', subtitle: 'Quick round — 4 letters you already know.' },
        { num: 2, prefix: 'cg2', count: 6, title: 'Drill: Tricky Vowels', subtitle: '6 vowels that don\'t exist in English. Let\'s see how you do.' },
        { num: 3, prefix: 'cg3', count: 5, title: 'Drill: False Friend Consonants', subtitle: '5 letters that look familiar but sound different. Watch out.' },
        { num: 4, prefix: 'cg4', count: 10, title: 'Drill: Easy Consonants', subtitle: 'The big round — 10 consonants. New shapes, familiar sounds.' },
        { num: 5, prefix: 'cg5', count: 6, title: 'Drill: Weird Unique Letters', subtitle: '6 letters unlike anything in English. The final challenge.' }
    ];

    quizGroups.forEach(g => {
        const placeholder = document.getElementById(g.prefix + '-quiz-placeholder');
        if (placeholder) {
            placeholder.innerHTML = generateGroupQuizHTML(g.prefix, g.num, g.count, g.title, g.subtitle);
        }
    });
};
