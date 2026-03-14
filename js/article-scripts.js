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

// ==================== MINI QUIZ: FALSE FRIENDS ====================
// Isolated state for embedded mini quiz (doesn't interfere with main quiz)
let miniQuizState = {
    chars: {
        'В': { upper: 'В', lower: 'в', roman: 'v', audio: 'audio/v.mp3' },
        'Н': { upper: 'Н', lower: 'н', roman: 'n', audio: 'audio/n.mp3' },
        'Р': { upper: 'Р', lower: 'р', roman: 'r', audio: 'audio/r.mp3' },
        'С': { upper: 'С', lower: 'с', roman: 's', audio: 'audio/s.mp3' },
        'У': { upper: 'У', lower: 'у', roman: 'u', audio: 'audio/u.mp3' },
        'Х': { upper: 'Х', lower: 'х', roman: 'kh', audio: 'audio/kh.mp3' }
    },
    charKeys: ['В', 'Н', 'Р', 'С', 'У', 'Х'],
    currentChar: null,
    currentIndex: 0,
    correctCount: 0,
    incorrectCount: 0,
    streak: 0,
    answered: false,
    questionsAsked: 0
};

function startMiniQuiz() {
    // Reset state
    miniQuizState.currentIndex = 0;
    miniQuizState.correctCount = 0;
    miniQuizState.incorrectCount = 0;
    miniQuizState.streak = 0;
    miniQuizState.questionsAsked = 0;
    
    // Shuffle the character order for variety
    miniQuizState.charKeys = ['В', 'Н', 'Р', 'С', 'У', 'Х'].sort(() => Math.random() - 0.5);
    
    // Show quiz, hide completion screen
    document.getElementById('mini-quiz-active').style.display = 'block';
    document.getElementById('mini-quiz-complete').style.display = 'none';
    
    // Attach Enter key listener to input
    const miniInput = document.getElementById('mini-answer-input');
    if (miniInput) {
        // Remove any existing listeners to avoid duplicates
        const newInput = miniInput.cloneNode(true);
        miniInput.parentNode.replaceChild(newInput, miniInput);
        
        // Add Enter key listener
        newInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                checkMiniAnswer();
            }
        });
        
        // Auto-submit if global setting enabled
        newInput.addEventListener('input', function(e) {
            if (typeof autoSubmit !== 'undefined' && autoSubmit && !miniQuizState.answered) {
                const input = e.target.value.trim().toLowerCase();
                const correct = miniQuizState.chars[miniQuizState.currentChar]?.roman.toLowerCase();
                if (input === correct) {
                    checkMiniAnswer();
                }
            }
        });
    }
    
    // Load first question
    nextMiniQuestion();
}

function nextMiniQuestion() {
    // Check if we've gone through all 6 letters
    if (miniQuizState.currentIndex >= miniQuizState.charKeys.length) {
        showMiniQuizComplete();
        return;
    }
    
    miniQuizState.currentChar = miniQuizState.charKeys[miniQuizState.currentIndex];
    miniQuizState.answered = false;
    
    const charData = miniQuizState.chars[miniQuizState.currentChar];
    
    // Update display
    document.getElementById('mini-current-char').textContent = charData.upper;
    document.getElementById('mini-current-char-lower').textContent = charData.lower;
    document.getElementById('mini-answer-input').value = '';
    document.getElementById('mini-feedback').textContent = '';
    document.getElementById('mini-answer-input').focus();
    
    // Update progress
    miniQuizState.questionsAsked++;
    document.getElementById('mini-progress').textContent = miniQuizState.questionsAsked + '/6';
    
    // Setup audio button
    const audioBtn = document.getElementById('mini-audio-btn');
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
    updateMiniLowercaseDisplay();
    updateMiniStats();
}

function checkMiniAnswer() {
    if (miniQuizState.answered) return;
    
    const input = document.getElementById('mini-answer-input').value.trim().toLowerCase();
    const correct = miniQuizState.chars[miniQuizState.currentChar].roman.toLowerCase();
    const feedback = document.getElementById('mini-feedback');
    
    miniQuizState.answered = true;
    
    if (input === correct) {
        feedback.textContent = '✓ Correct!';
        feedback.className = 'feedback correct';
        miniQuizState.correctCount++;
        miniQuizState.streak++;
        
        // Small confetti burst
        createMiniConfetti();
        
        // Auto-play audio if setting enabled (uses global setting)
        if (typeof autoPlayAudio !== 'undefined' && autoPlayAudio && miniQuizState.chars[miniQuizState.currentChar].audio) {
            const audio = new Audio('/' + miniQuizState.chars[miniQuizState.currentChar].audio);
            audio.volume = 0.7;
            audio.play().catch(err => console.log('Audio playback failed:', err));
        }
        
        updateMiniStats();
        
        // Move to next question
        setTimeout(() => {
            miniQuizState.currentIndex++;
            nextMiniQuestion();
        }, 600);
    } else {
        feedback.textContent = `✗ Wrong. Correct: ${miniQuizState.chars[miniQuizState.currentChar].roman}`;
        feedback.className = 'feedback incorrect';
        miniQuizState.incorrectCount++;
        miniQuizState.streak = 0;
        
        updateMiniStats();
        
        setTimeout(() => {
            miniQuizState.currentIndex++;
            nextMiniQuestion();
        }, 900);
    }
}

function skipMiniQuestion() {
    const feedback = document.getElementById('mini-feedback');
    feedback.textContent = `Answer: ${miniQuizState.chars[miniQuizState.currentChar].roman}`;
    feedback.className = 'feedback';
    miniQuizState.answered = true;
    
    miniQuizState.incorrectCount++;
    miniQuizState.streak = 0;
    
    updateMiniStats();
    
    setTimeout(() => {
        miniQuizState.currentIndex++;
        nextMiniQuestion();
    }, 1200);
}

function resetMiniQuiz() {
    startMiniQuiz();
}

function updateMiniStats() {
    const total = miniQuizState.correctCount + miniQuizState.incorrectCount;
    document.getElementById('mini-score').textContent = miniQuizState.correctCount + '/' + total;
    document.getElementById('mini-streak').textContent = miniQuizState.streak;
}

function updateMiniLowercaseDisplay() {
    // Use global setting if available
    const lowerElement = document.getElementById('mini-current-char-lower');
    if (lowerElement && typeof includeLowercase !== 'undefined') {
        lowerElement.style.display = includeLowercase ? 'inline-block' : 'none';
    }
}

function showMiniQuizComplete() {
    document.getElementById('mini-quiz-active').style.display = 'none';
    document.getElementById('mini-quiz-complete').style.display = 'block';
    
    const total = miniQuizState.correctCount + miniQuizState.incorrectCount;
    const percentage = total > 0 ? Math.round((miniQuizState.correctCount / total) * 100) : 0;
    
    document.getElementById('mini-final-score').textContent = 
        `You got ${miniQuizState.correctCount} out of ${total} correct (${percentage}%)!`;
}

function createMiniConfetti() {
    const colors = ['#FFC107', '#FF9800', '#4CAF50', '#2196F3', '#9C27B0'];
    const confettiCount = 8; // Smaller burst for mini quiz
    
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        
        confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.left = (50 + (Math.random() - 0.5) * 20) + '%';
        confetti.style.top = '40%';
        
        const size = 4 + Math.random() * 4;
        confetti.style.width = size + 'px';
        confetti.style.height = size + 'px';
        confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
        confetti.style.animationDelay = (Math.random() * 0.1) + 's';
        
        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 1200);
    }
}

// Expose functions globally
window.startMiniQuiz = startMiniQuiz;
window.checkMiniAnswer = checkMiniAnswer;
window.skipMiniQuestion = skipMiniQuestion;
window.resetMiniQuiz = resetMiniQuiz;
