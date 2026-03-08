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
