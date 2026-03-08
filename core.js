        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-WZ9MYG6HGE');
    </script>
    
    <!-- Google AdSense Verification -->
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5821564771189825"
     crossorigin="anonymous"></script>
    
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=IBM+Plex+Mono:wght@400;600&family=Merriweather:wght@300&display=swap" rel="stylesheet">
    <style>
        :root {
            --cream: #F5F1E8;
            --red: #D32F2F;
            --dark-blue: #1A237E;
            --gold: #FFC107;
            --charcoal: #2C2C2C;
            --paper: #FDFBF7;
            
            /* Matrix Mode Colors - Optimized for Night Viewing */
            --matrix-black: #0d0d0d;
            --matrix-card: #1a1a1a;
            --matrix-green: #00cc33;
            --matrix-green-dim: #009922;
            --matrix-green-bright: #00ff44;
            --matrix-text: #d0d0d0;
            --matrix-text-dim: #888888;
            --matrix-border: #1a3a1a;
            
            /* Modern Design Tokens */
            --border-radius: 12px;
            --border-radius-sm: 6px;
            --border-radius-lg: 16px;
            
            --shadow-sm: 0 1px 3px rgba(44, 44, 44, 0.12), 0 1px 2px rgba(44, 44, 44, 0.08);
            --shadow-md: 0 4px 6px rgba(44, 44, 44, 0.1), 0 2px 4px rgba(44, 44, 44, 0.06);
            --shadow-lg: 0 10px 15px rgba(44, 44, 44, 0.1), 0 4px 6px rgba(44, 44, 44, 0.05);
            --shadow-xl: 0 20px 25px rgba(44, 44, 44, 0.15), 0 10px 10px rgba(44, 44, 44, 0.08);
            
            --transition-fast: 0.15s cubic-bezier(0.4, 0, 0.2, 1);
            --transition-base: 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            --transition-slow: 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        html {
            scroll-behavior: smooth;
        }

        body {
            font-family: 'IBM Plex Mono', monospace;
            background: linear-gradient(135deg, var(--cream) 0%, #E8E4D9 100%);
            color: var(--charcoal);
            min-height: 100vh;
            padding: 0;
            padding-top: 80px;
            position: relative;
            overflow-x: hidden;
            display: flex;
            flex-direction: column;
            align-items: center;
            transition: background 0.3s ease, color 0.3s ease;
            scroll-behavior: smooth;
        }

        /* Matrix Mode / Dark Mode */
        body.dark-mode {
            background: var(--matrix-black);
            color: var(--matrix-text);
        }

        /* Scanline effect for Matrix mode */
        body.dark-mode::after {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: repeating-linear-gradient(
                0deg,
                rgba(0, 255, 65, 0.03) 0px,
                transparent 1px,
                transparent 2px,
                rgba(0, 255, 65, 0.03) 3px
            );
            pointer-events: none;
            z-index: 9999;
            animation: scanlines 8s linear infinite;
        }

        @keyframes scanlines {
            0% { transform: translateY(0); }
            100% { transform: translateY(10px); }
        }

        /* Cyrillic Rain Effect (Matrix Mode only) */
        .cyrillic-rain {
            position: fixed;
            top: -100px;
            font-family: 'IBM Plex Mono', monospace;
            font-size: 1.3rem;
            color: var(--matrix-green);
            pointer-events: none;
            z-index: 9998;
            line-height: 1.4;
            letter-spacing: 2px;
            animation: rainFall 2.5s linear forwards;
            filter: blur(0px);
        }

        .cyrillic-rain::after {
            content: attr(data-trail);
            position: absolute;
            top: 100%;
            left: 0;
            width: 100%;
            color: var(--matrix-green-dim);
            opacity: 0.3;
            white-space: pre-line;
        }

        @keyframes rainFall {
            0% {
                opacity: 0;
                transform: translateY(0);
                filter: blur(0px);
            }
            3% {
                opacity: 1;
            }
            97% {
                opacity: 0.9;
            }
            100% {
                opacity: 0;
                transform: translateY(100vh);
                filter: blur(1px);
            }
        }

        /* Navigation */
        nav {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: var(--dark-blue);
            border-bottom: 4px solid var(--charcoal);
            z-index: 1000;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            transition: background 0.3s ease, border-color 0.3s ease;
        }

        body.dark-mode nav {
            background: var(--matrix-black);
            border-bottom: 4px solid var(--matrix-green);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        }

        .nav-container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 0 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            height: 70px;
        }

        .nav-logo {
            font-family: 'Bebas Neue', sans-serif;
            font-size: 2rem;
            letter-spacing: 6px;
            color: white;
            text-decoration: none;
            transition: color 0.3s ease;
            display: inline-block;
        }

        body.dark-mode .nav-logo {
            color: var(--matrix-green);
        }

        .nav-logo .letter-l,
        h1 .letter-l {
            color: var(--gold);
            position: relative;
            display: inline-block;
            margin: 0 3px;
            font-size: 1.1em;
            cursor: pointer;
        }

        body.dark-mode .nav-logo .letter-l,
        body.dark-mode h1 .letter-l {
            color: var(--matrix-green-bright);
        }

        /* Confetti container - hidden by default */
        .letter-l .confetti-burst {
            position: fixed;
            pointer-events: none;
            z-index: 10000;
            display: none;
        }

        /* Show confetti on hover or when clicked */
        .letter-l:hover .confetti-burst,
        .letter-l.burst-active .confetti-burst {
            display: block;
        }

        /* Individual confetti piece animation */
        .letter-l .conf {
            position: fixed;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            pointer-events: none;
        }

        /* Confetti falling animation - just like in-game! */
        @keyframes confettiFall {
            0% {
                transform: translateY(0) rotate(0deg);
                opacity: 1;
            }
            100% {
                transform: translateY(150px) rotate(360deg);
                opacity: 0;
            }
        }

        .letter-l.burst-active .conf {
            animation: confettiFall 1.2s ease-out forwards;
        }

        /* Stagger the confetti timing like in-game */
        .letter-l.burst-active .conf:nth-child(1) { animation-delay: 0s; }
        .letter-l.burst-active .conf:nth-child(2) { animation-delay: 0.05s; }
        .letter-l.burst-active .conf:nth-child(3) { animation-delay: 0.1s; }
        .letter-l.burst-active .conf:nth-child(4) { animation-delay: 0.05s; }
        .letter-l.burst-active .conf:nth-child(5) { animation-delay: 0.15s; }
        .letter-l.burst-active .conf:nth-child(6) { animation-delay: 0.08s; }
        .letter-l.burst-active .conf:nth-child(7) { animation-delay: 0.12s; }
        .letter-l.burst-active .conf:nth-child(8) { animation-delay: 0.03s; }
        .letter-l.burst-active .conf:nth-child(9) { animation-delay: 0.18s; }
        .letter-l.burst-active .conf:nth-child(10) { animation-delay: 0.1s; }
        .letter-l.burst-active .conf:nth-child(11) { animation-delay: 0.06s; }
        .letter-l.burst-active .conf:nth-child(12) { animation-delay: 0.14s; }
        .letter-l.burst-active .conf:nth-child(13) { animation-delay: 0.09s; }
        .letter-l.burst-active .conf:nth-child(14) { animation-delay: 0.11s; }
        .letter-l.burst-active .conf:nth-child(15) { animation-delay: 0.04s; }

        .nav-links {
            display: flex;
            gap: 0;
            list-style: none;
        }

        .nav-links a {
            display: block;
            padding: 25px 18px;
            color: white;
            text-decoration: none;
            font-weight: 600;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            font-size: 0.85rem;
            transition: all 0.3s;
            border-right: 2px solid rgba(255, 255, 255, 0.1);
        }

        body.dark-mode .nav-links a {
            color: var(--matrix-text);
            border-right: 2px solid var(--matrix-border);
        }

        .nav-links li:last-child a {
            border-right: none;
        }

        .nav-links a:hover,
        .nav-links a.active {
            background: var(--red);
            color: white;
        }

        body.dark-mode .nav-links a:hover,
        body.dark-mode .nav-links a.active {
            background: var(--matrix-green);
            color: var(--matrix-black);
        }

        /* Mobile menu toggle */
        .menu-toggle {
            display: none;
            background: none;
            border: none;
            color: white;
            font-size: 1.5rem;
            cursor: pointer;
            padding: 10px;
        }

        @media (max-width: 768px) {
            .menu-toggle {
                display: block;
            }

            .nav-links {
                position: absolute;
                top: 70px;
                left: 0;
                right: 0;
                background: var(--dark-blue);
                flex-direction: column;
                gap: 0;
                max-height: 0;
                overflow: hidden;
                transition: max-height 0.3s, background 0.3s;
            }

            body.dark-mode .nav-links {
                background: var(--matrix-card);
                border-top: 2px solid var(--matrix-green);
            }

            .nav-links.active {
                max-height: 400px;
            }

            .nav-links li {
                width: 100%;
            }

            .nav-links a {
                border-right: none;
                border-bottom: 2px solid rgba(255, 255, 255, 0.1);
                padding: 16px 20px;
                min-height: 54px;
                display: flex;
                align-items: center;
            }

            .nav-links li:last-child a {
                border-bottom: none;
                padding-bottom: 16px;
            }
        }

        /* Main content centered layout (no sidebars) */
        .main-content {
            max-width: 1000px;
            width: 100%;
            margin: 0 auto;
            padding: 20px;
        }

        /* Share buttons */
        .share-section {
            margin: 40px 0 30px 0;
            padding: 25px 0;
            border-top: 2px solid #e0e0e0;
            border-bottom: 2px solid #e0e0e0;
            text-align: center;
        }

        body.dark-mode .share-section {
            border-top-color: var(--matrix-border);
            border-bottom-color: var(--matrix-border);
        }

        .share-section p {
            margin-bottom: 15px;
            font-size: 0.95rem;
            color: #666;
        }

        body.dark-mode .share-section p {
            color: #888;
        }

        .share-buttons {
            display: flex;
            gap: 12px;
            justify-content: center;
            flex-wrap: wrap;
        }

        .share-btn {
            padding: 10px 18px;
            background: var(--paper);
            border: 2px solid var(--charcoal);
            border-radius: var(--border-radius);
            color: var(--charcoal);
            font-family: 'Roboto', sans-serif;
            font-size: 0.9rem;
            cursor: pointer;
            transition: all var(--transition-base);
            display: inline-flex;
            align-items: center;
            gap: 6px;
            text-decoration: none;
        }

        .share-btn:hover {
            background: var(--charcoal);
            color: var(--paper);
            transform: translateY(-2px);
            box-shadow: var(--shadow-md);
        }

        body.dark-mode .share-btn {
            background: var(--dark-bg);
            border-color: var(--matrix-green);
            color: var(--matrix-green);
        }

        body.dark-mode .share-btn:hover {
            background: var(--matrix-green);
            color: var(--dark-bg);
        }

        .share-btn.copied {
            background: #28a745;
            color: white;
            border-color: #28a745;
        }

        body.dark-mode .share-btn.copied {
            background: var(--matrix-green);
            color: var(--dark-bg);
            border-color: var(--matrix-green);
        }

        /* Decorative background pattern */
        body::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            opacity: 0.03;
            background-image: 
                repeating-linear-gradient(45deg, transparent, transparent 35px, var(--charcoal) 35px, var(--charcoal) 36px),
                repeating-linear-gradient(-45deg, transparent, transparent 35px, var(--charcoal) 35px, var(--charcoal) 36px);
            pointer-events: none;
            z-index: 0;
        }

        .container {
            width: 100%;
            max-width: 100%; /* Prevent overflow */
            position: relative;
            z-index: 1;
            overflow-x: hidden; /* Prevent horizontal scroll from wide content */
        }

        /* Page content styles */
        .page-content {
            display: none;
        }

        .page-content.active {
            display: block;
        }

        header {
            text-align: center;
            margin-bottom: 16px;
            animation: slideDown 0.6s ease-out;
        }

        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateY(-30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        h1 {
            font-family: 'Bebas Neue', sans-serif;
            font-size: 3.5rem;
            letter-spacing: 10px;
            color: var(--dark-blue);
            text-transform: uppercase;
            margin-bottom: 5px;
            line-height: 1;
            transition: color 0.3s ease;
            display: inline-block;
        }

        body.dark-mode h1 {
            color: var(--matrix-green);
        }

        .subtitle {
            font-family: 'Merriweather', serif;
            font-size: 0.9rem;
            color: var(--red);
            font-weight: 300;
            font-style: italic;
            letter-spacing: 1.5px;
            transition: color 0.3s ease;
        }

        body.dark-mode .subtitle {
            color: var(--matrix-green-dim);
        }

        .site-description {
            max-width: 600px;
            margin: 12px auto 18px auto;
            font-size: 0.9rem;
            line-height: 1.4;
            color: #555;
            text-align: center;
            font-family: 'Roboto', sans-serif;
        }

        body.dark-mode .site-description {
            color: #999;
        }

        .card {
            background: var(--paper);
            border: 2px solid var(--charcoal);
            border-radius: var(--border-radius);
            box-shadow: var(--shadow-md);
            padding: 24px;
            margin-bottom: 16px;
            position: relative;
            animation: fadeIn 0.6s ease-out;
            animation-delay: 0.2s;
            animation-fill-mode: backwards;
            transition: all var(--transition-base);
            max-width: 100%; /* Prevent cards from overflowing */
            box-sizing: border-box; /* Include padding in width calculation */
        }

        @media (hover: hover) {
            .card:hover {
                transform: translateY(-2px);
                box-shadow: var(--shadow-lg);
            }

            body.dark-mode .card:hover {
                box-shadow: var(--shadow-lg);
            }
        }

        body.dark-mode .card {
            background: var(--matrix-card);
            border: 2px solid var(--matrix-green);
            box-shadow: var(--shadow-md);
        }

        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .card::before {
            content: '';
            position: absolute;
            top: -4px;
            left: -4px;
            right: -4px;
            bottom: -4px;
            background: linear-gradient(45deg, var(--red), var(--gold), var(--dark-blue));
            z-index: -1;
            opacity: 0;
            transition: opacity 0.3s;
        }

        .card:hover::before {
            opacity: 0.1;
        }

        body.dark-mode .card:hover::before {
            opacity: 0;
        }

        h2 {
            font-family: 'Bebas Neue', sans-serif;
            font-size: 2rem;
            letter-spacing: 3px;
            color: var(--dark-blue);
            margin-bottom: 15px;
            border-bottom: 3px solid var(--red);
            padding-bottom: 8px;
            text-transform: uppercase;
            transition: color 0.3s ease, border-color 0.3s ease, text-shadow 0.3s ease;
        }

        body.dark-mode h2 {
            color: var(--matrix-green);
            border-bottom: 3px solid var(--matrix-green);
        }

        h3 {
            font-family: 'Bebas Neue', sans-serif;
            font-size: 1.5rem;
            letter-spacing: 2px;
            color: var(--dark-blue);
            margin-top: 0;
            margin-bottom: 5px;
            transition: color 0.3s ease;
        }

        body.dark-mode h3 {
            color: var(--matrix-green);
        }

        .content-text {
            font-size: 1rem;
            line-height: 1.8;
            margin-bottom: 20px;
        }

        .content-text a {
            color: var(--red);
            text-decoration: none;
            border-bottom: 2px solid var(--red);
            transition: all 0.2s;
        }

        body.dark-mode .content-text a {
            color: var(--matrix-green);
            border-bottom: 2px solid var(--matrix-green);
        }

        .reference-link {
            color: var(--red);
            font-weight: 600;
            text-decoration: none;
        }

        .reference-link:hover {
            opacity: 0.8;
        }

        body.dark-mode .reference-link {
            color: var(--matrix-text);
            font-weight: 600;
        }

        body.dark-mode .reference-link:hover {
            color: var(--matrix-green);
        }

        .content-text a:hover {
            color: var(--dark-blue);
            border-bottom-color: var(--dark-blue);
        }

        body.dark-mode .content-text a:hover {
            color: var(--matrix-green-bright);
            border-bottom-color: var(--matrix-green-bright);
        }

        /* Articles Styles */
        .articles-list {
            display: flex;
            flex-direction: column;
            gap: 0;
        }
        
        .article-category {
            margin-top: 40px;
        }
        
        .article-category:first-child {
            margin-top: 0;
        }
        
        .article-category-header {
            font-size: 1.1rem;
            font-weight: 600;
            color: var(--dark);
            margin-bottom: 8px;
            padding: 12px 20px;
            background: var(--cream);
            border-left: 4px solid var(--red);
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        body.dark-mode .article-category-header {
            color: var(--matrix-text);
            background: rgba(0, 255, 0, 0.05);
            border-left-color: var(--matrix-green);
        }
        
        .article-category-header .emoji {
            font-size: 1.3rem;
            line-height: 1;
        }
        
        .article-category-desc {
            font-size: 0.9rem;
            color: #666;
            padding: 0 20px 12px 20px;
            font-style: italic;
        }
        
        body.dark-mode .article-category-desc {
            color: rgba(0, 255, 0, 0.6);
        }

        .article-item {
            padding: 16px 20px;
            border-bottom: 1px solid #ddd;
            background: transparent;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: baseline;
            gap: 12px;
        }

        .article-item:first-child {
            border-top: 1px solid #ddd;
        }

        body.dark-mode .article-item {
            border-bottom-color: var(--matrix-border);
        }

        body.dark-mode .article-item:first-child {
            border-top-color: var(--matrix-border);
        }

        .article-item:hover {
            background: var(--cream);
            padding-left: 24px;
        }

        body.dark-mode .article-item:hover {
            background: rgba(0, 255, 65, 0.05);
        }

        .article-item::before {
            content: "→";
            color: var(--red);
            font-weight: bold;
            font-size: 1.2rem;
            flex-shrink: 0;
            transition: transform 0.2s;
        }

        body.dark-mode .article-item::before {
            color: var(--matrix-green);
        }

        .article-item:hover::before {
            transform: translateX(3px);
        }

        .article-item-content {
            flex: 1;
        }

        .article-item h3 {
            color: var(--dark-blue);
            margin: 0 0 4px 0;
            font-size: 1.1rem;
            font-family: 'Bebas Neue', sans-serif;
            letter-spacing: 0.5px;
            font-weight: 600;
        }

        body.dark-mode .article-item h3 {
            color: var(--matrix-green);
        }

        .article-item p {
            margin: 0;
            color: #666;
            font-size: 0.85rem;
            line-height: 1.4;
        }

        body.dark-mode .article-item p {
            color: var(--matrix-text-dim);
        }

        .article-header {
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid var(--red);
            position: relative;
        }

        .article-header h2 {
            margin: 0;
            padding-right: 100px; /* Space for button */
        }

        .article-back-btn {
            position: absolute;
            top: -10px;
            right: 0;
            padding: 8px 16px;
            background: var(--dark-blue);
            color: white;
            border: none;
            border-radius: 4px;
            font-family: 'Bebas Neue', sans-serif;
            font-size: 0.95rem;
            letter-spacing: 1px;
            cursor: pointer;
            transition: all 0.2s;
            white-space: nowrap;
        }

        .article-back-btn:hover {
            background: var(--red);
            transform: translateX(-3px);
        }

        body.dark-mode .article-back-btn {
            background: var(--matrix-card);
            color: var(--matrix-green);
            border: 1px solid var(--matrix-green);
        }

        body.dark-mode .article-back-btn:hover {
            background: var(--matrix-green);
            color: var(--dark-blue);
            box-shadow: none;
        }

        body.dark-mode .article-header {
            border-bottom-color: var(--matrix-green);
        }

        /* Table of Contents styling */
        .article-toc {
            background: #f5f5f5;
            border-left: 4px solid var(--red);
            padding: 20px;
            margin-bottom: 30px;
            border-radius: 4px;
        }

        .article-toc h4 {
            margin-top: 0;
            color: var(--dark-blue);
            font-family: 'Bebas Neue', sans-serif;
            font-size: 1.3rem;
        }

        .article-toc ul {
            list-style: none;
            padding: 0;
            margin: 0;
        }

        .article-toc li {
            margin-bottom: 8px;
        }

        .article-toc a {
            color: var(--dark-blue);
            text-decoration: none;
            font-weight: 500;
            transition: color 0.2s;
        }

        .article-toc a:hover {
            color: var(--red);
        }

        /* Matrix Mode TOC */
        body.dark-mode .article-toc {
            background: rgba(0, 255, 65, 0.05);
            border-left: 4px solid var(--matrix-green);
            box-shadow: none;
        }

        body.dark-mode .article-toc h4 {
            color: var(--matrix-green);
        }

        body.dark-mode .article-toc a {
            color: var(--matrix-green);
        }

        body.dark-mode .article-toc a:hover {
            color: var(--matrix-green-bright);
        }

        .article-content {
            margin-bottom: 40px;
            overflow-wrap: break-word; /* Break long words */
            word-wrap: break-word; /* Legacy support */
            max-width: 100%; /* Prevent overflow */
        }

        .article-content h3 {
            color: var(--dark-blue);
            font-family: 'Bebas Neue', sans-serif;
            font-size: 1.5rem;
            margin: 30px 0 15px 0;
            letter-spacing: 1px;
        }

        body.dark-mode .article-content h3 {
            color: var(--matrix-green);
        }

        .article-content ul, .article-content ol {
            margin: 15px 0 15px 30px;
            line-height: 1.8;
        }

        .article-content li {
            margin-bottom: 10px;
        }

        .article-navigation {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 10px;
            padding-top: 30px;
            border-top: 2px solid #e0e0e0;
            flex-wrap: wrap;
        }

        body.dark-mode .article-navigation {
            border-top-color: var(--matrix-border);
        }

        .article-navigation .btn {
            flex: 1 1 auto;
            min-width: 120px;
            text-align: center;
        }

        .article-navigation .btn:nth-child(2) {
            flex: 1 1 auto;
            max-width: none;
        }

        @media (max-width: 768px) {
            .article-navigation {
                flex-direction: column;
                align-items: stretch;
                gap: 10px;
            }

            .article-navigation .btn {
                width: 100%;
                min-width: unset;
                text-align: center;
            }
        }

        /* Articles Index */
        .article-list {
            list-style: none;
            padding: 0;
        }

        .article-list li {
            margin-bottom: 16px;
        }

        .article-list a {
            font-size: 1.1rem;
            font-weight: 600;
            color: var(--dark-blue);
            text-decoration: none;
            border-bottom: 2px dotted var(--dark-blue);
            transition: all var(--transition-base);
            display: inline-block;
        }

        body.dark-mode .article-list a {
            color: var(--matrix-green);
            border-bottom-color: var(--matrix-green);
        }

        .article-list a:hover {
            color: var(--red);
            border-bottom-style: solid;
            transform: translateX(4px);
        }

        body.dark-mode .article-list a:hover {
            color: var(--matrix-green-bright);
        }

        /* Article Content */
        .article-content h2 {
            font-family: 'Bebas Neue', sans-serif;
            font-size: 1.8rem;
            color: var(--dark-blue);
            margin: 30px 0 15px 0;
            letter-spacing: 2px;
        }

        body.dark-mode .article-content h2 {
            color: var(--matrix-green);
        }

        .article-content h3 {
            font-size: 1.3rem;
            color: var(--dark-blue);
            margin: 25px 0 12px 0;
            font-weight: 600;
        }

        body.dark-mode .article-content h3 {
            color: var(--matrix-green-dim);
        }

        .article-content p {
            margin-bottom: 18px;
            line-height: 1.8;
        }

        .article-content ul,
        .article-content ol {
            margin: 15px 0 20px 30px;
            line-height: 1.8;
        }

        .article-content li {
            margin-bottom: 8px;
        }

        /* Article Navigation */
        .article-nav {
            display: flex;
            justify-content: space-between;
            gap: 15px;
            margin-top: 40px;
            padding-top: 30px;
            border-top: 2px solid var(--charcoal);
        }

        body.dark-mode .article-nav {
            border-top-color: var(--matrix-green);
        }

        .article-nav .btn {
            flex: 1;
            max-width: 200px;
        }

        .article-nav .btn:disabled {
            opacity: 0.3;
            cursor: not-allowed;
        }

        /* Character Reference Guide */
        .char-reference {
            margin-bottom: 20px;
        }

        .selection-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
            flex-wrap: wrap;
            gap: 10px;
        }

        .selection-header h2 {
            margin: 0;
            flex: 1;
            min-width: 200px;
            font-size: 1.4rem;
        }

        .selection-controls {
            display: flex;
            gap: 8px;
        }

        .btn-control {
            font-size: 0.9rem;
            padding: 8px 16px;
            white-space: nowrap;
        }

        /* Two-column grid for character groups */
        #reference-container {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 20px;
        }

        .reference-section {
            margin-bottom: 0;
            background: var(--cream);
            border: 2px solid var(--charcoal);
            border-radius: var(--border-radius);
            padding: 14px;
            cursor: pointer;
            transition: all var(--transition-base);
            position: relative;
            overflow: hidden;
            box-shadow: var(--shadow-sm);
        }

        body.dark-mode .reference-section {
            background: var(--matrix-card);
            border: 2px solid var(--matrix-border);
        }

        .reference-section::after {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: var(--red);
            transition: left var(--transition-base);
            z-index: 0;
        }

        body.dark-mode .reference-section::after {
            background: var(--matrix-green);
        }

        /* Hover effects - only on devices that support hover (desktop/trackpad) */
        @media (hover: hover) {
            .reference-section:hover::after {
                left: 0;
            }

            .reference-section:hover {
                transform: translateY(-4px);
                box-shadow: var(--shadow-md);
            }

            body.dark-mode .reference-section:hover {
                box-shadow: var(--shadow-md);
            }

            .reference-section:hover .section-title,
            .reference-section:hover .char-ref-item {
                color: white;
            }

            body.dark-mode .reference-section:hover .section-title,
            body.dark-mode .reference-section:hover .char-ref-item {
                color: var(--matrix-black);
            }

            /* Make the actual Cyrillic letters and roman text visible on green hover background */
            body.dark-mode .reference-section:hover .char-ref-cyrillic,
            body.dark-mode .reference-section:hover .char-ref-roman {
                color: var(--matrix-black) !important;
                position: relative;
                z-index: 1;
            }
        }

        .reference-section.selected {
            background: var(--red);
            border-color: var(--red);
            box-shadow: var(--shadow-lg);
            transform: translateY(-2px);
        }

        body.dark-mode .reference-section.selected {
            background: var(--matrix-green);
            border-color: var(--matrix-green-bright);
            box-shadow: var(--shadow-lg);
        }

        .reference-section.selected::after {
            left: 0;
        }

        .reference-section.selected .section-title {
            color: white;
        }

        body.dark-mode .reference-section.selected .section-title {
            color: var(--matrix-black);
        }

        .reference-section.selected .char-ref-item {
            color: white;
            border-color: rgba(255, 255, 255, 0.4);
        }

        body.dark-mode .reference-section.selected .char-ref-item {
            color: var(--matrix-black);
            border-color: rgba(10, 10, 10, 0.3);
        }

        .reference-section.selected .char-ref-cyrillic {
            color: white;
        }

        body.dark-mode .reference-section.selected .char-ref-cyrillic {
            color: var(--matrix-black);
        }

        .reference-section.selected .char-ref-roman {
            color: white;
        }

        body.dark-mode .reference-section.selected .char-ref-roman {
            color: var(--matrix-black);
        }

        .section-title {
            font-family: 'Bebas Neue', sans-serif;
            font-size: 1.1rem;
            letter-spacing: 2px;
            color: var(--dark-blue);
            margin-bottom: 8px;
            text-transform: uppercase;
            position: relative;
            z-index: 1;
            transition: color 0.3s;
        }

        body.dark-mode .section-title {
            color: var(--matrix-green);
        }

        .reference-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(52px, 1fr));
            gap: 5px;
            position: relative;
            z-index: 1;
        }

        .char-ref-item {
            background: transparent;
            border: 2px solid var(--charcoal);
            border-radius: var(--border-radius-sm);
            padding: 6px 4px;
            text-align: center;
            transition: all var(--transition-base);
            pointer-events: none;
        }

        body.dark-mode .char-ref-item {
            border: 2px solid var(--matrix-border);
        }

        .char-ref-cyrillic {
            font-size: 1.3rem;
            font-weight: bold;
            color: var(--dark-blue);
            display: block;
            margin-bottom: 2px;
            transition: color 0.3s;
        }

        body.dark-mode .char-ref-cyrillic {
            color: var(--matrix-green);
        }

        .char-ref-roman {
            font-size: 0.7rem;
            color: var(--charcoal);
            font-weight: 600;
            transition: color 0.3s;
        }

        body.dark-mode .char-ref-roman {
            color: var(--matrix-text-dim);
        }

        .start-btn {
            background: var(--dark-blue);
            color: white;
            border: none;
            padding: 14px 50px;
            font-family: 'Bebas Neue', sans-serif;
            font-size: 1.6rem;
            letter-spacing: 3px;
            cursor: pointer;
            width: 100%;
            transition: all 0.3s;
            text-transform: uppercase;
            box-shadow: 5px 5px 0 var(--charcoal);
            position: relative;
            overflow: hidden;
        }

        .start-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .start-btn:not(:disabled):hover {
            background: var(--red);
            transform: translateX(2px) translateY(-2px);
            box-shadow: 3px 7px 0 var(--charcoal);
        }

        .start-btn:not(:disabled):active {
            transform: translateX(5px) translateY(5px);
            box-shadow: 0 0 0 var(--charcoal);
        }

        body.dark-mode .start-btn {
            background: var(--matrix-black);
            color: var(--matrix-green);
            border: 4px solid var(--matrix-green);
            box-shadow: 5px 5px 0 var(--matrix-border);
        }

        body.dark-mode .start-btn:not(:disabled):hover {
            background: var(--matrix-green);
            color: var(--matrix-black);
            box-shadow: 3px 7px 0 var(--matrix-border);
        }

        #quiz-container {
            display: none;
        }

        #quiz-container.active {
            display: block;
        }

        .quiz-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            flex-wrap: wrap;
            gap: 10px;
        }

        .score {
            font-size: 1rem;
            font-weight: 600;
            padding: 8px 16px;
            background: var(--gold);
            border: 2px solid var(--charcoal);
            letter-spacing: 1px;
            transition: all 0.3s;
        }

        body.dark-mode .score {
            background: var(--matrix-card);
            border: 2px solid var(--matrix-green);
            color: var(--matrix-green);
        }

        .progress {
            font-size: 0.9rem;
            color: var(--dark-blue);
            font-weight: 600;
            transition: color 0.3s;
        }

        body.dark-mode .progress {
            color: var(--matrix-green);
        }

        .character-display {
            text-align: center;
            margin: 30px 0 20px 0;
            animation: scaleIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            position: relative;
        }

        @keyframes scaleIn {
            from {
                opacity: 0;
                transform: scale(0.5) rotate(-10deg);
            }
            to {
                opacity: 1;
                transform: scale(1) rotate(0deg);
            }
        }

        /* Audio pronunciation button */
        .audio-btn {
            position: absolute;
            right: 20%;
            top: 50%;
            transform: translateY(-50%);
            background: var(--dark-blue);
            color: white;
            border: none;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            font-size: 1.4rem;
            cursor: pointer;
            transition: all 0.2s;
            box-shadow: var(--shadow-sm);
        }

        .audio-btn:hover {
            background: var(--red);
            transform: translateY(-50%) scale(1.1);
            box-shadow: var(--shadow-md);
        }

        body.dark-mode .audio-btn {
            background: var(--matrix-green);
            color: var(--matrix-black);
        }

        body.dark-mode .audio-btn:hover {
            background: var(--matrix-green-bright);
        }

        .cyrillic-char {
            font-family: 'Bebas Neue', sans-serif;
            font-size: 9rem;
            color: var(--dark-blue);
            text-shadow: 5px 5px 0 var(--gold);
            line-height: 1;
            display: inline-block;
            animation: pulse 2s ease-in-out infinite;
            transition: color 0.3s ease, text-shadow 0.3s ease;
        }

        body.dark-mode .cyrillic-char {
            color: var(--matrix-green);
            text-shadow: 5px 5px 0 rgba(0, 0, 0, 0.5);
        }

        .cyrillic-char-lowercase {
            font-size: 6rem;
            color: var(--red);
            opacity: 0.8;
            margin-left: 15px;
            transition: color 0.3s ease, text-shadow 0.3s ease;
        }

        body.dark-mode .cyrillic-char-lowercase {
            color: var(--matrix-green-dim);
            text-shadow: none;
        }

        @keyframes pulse {
            0%, 100% {
                transform: scale(1);
            }
            50% {
                transform: scale(1.05);
            }
        }

        .input-section {
            text-align: center;
            margin-bottom: 20px;
        }

        .input-wrapper {
            display: flex;
            gap: 10px;
            justify-content: center;
            align-items: stretch;
            flex-wrap: wrap;
        }

        input[type="text"] {
            font-family: 'IBM Plex Mono', monospace;
            font-size: 1.8rem;
            padding: 16px 20px;
            border: 2px solid var(--charcoal);
            border-radius: var(--border-radius);
            background: white;
            flex: 1;
            max-width: 400px;
            min-width: 200px;
            text-align: center;
            letter-spacing: 2px;
            transition: all var(--transition-base);
            box-shadow: var(--shadow-sm);
        }

        .btn-submit {
            font-size: 1.1rem;
            padding: 16px 26px;
            white-space: nowrap;
            flex-shrink: 0;
        }

        body.dark-mode input[type="text"] {
            background: var(--matrix-black);
            border: 2px solid var(--matrix-green);
            color: var(--matrix-green);
            caret-color: var(--matrix-green);
        }

        input[type="text"]:focus {
            outline: none;
            border-color: var(--dark-blue);
            box-shadow: 0 0 0 3px rgba(26, 35, 126, 0.15), var(--shadow-md);
            transform: translateY(-2px);
        }

        body.dark-mode input[type="text"]:focus {
            border-color: var(--matrix-green-bright);
            box-shadow: 0 0 0 2px var(--matrix-green);
        }

        .feedback {
            margin-top: 15px;
            font-size: 1.6rem;
            font-weight: 700;
            min-height: 40px;
            letter-spacing: 1.5px;
            animation: bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            text-transform: uppercase;
        }

        @keyframes bounceIn {
            0% {
                opacity: 0;
                transform: scale(0.3) translateY(-20px);
            }
            60% {
                transform: scale(1.15) translateY(0);
            }
            100% {
                opacity: 1;
                transform: scale(1);
            }
        }

        .feedback.correct {
            color: #2E7D32;
        }

        body.dark-mode .feedback.correct {
            color: var(--matrix-green);
        }

        /* Confetti for correct answers */
        .confetti {
            position: fixed;
            width: 10px;
            height: 10px;
            background: #FFC107;
            border-radius: 50%;
            z-index: 10000;
            pointer-events: none;
            animation: confettiFall 1.2s ease-out forwards;
        }

        @keyframes confettiFall {
            0% {
                opacity: 1;
                transform: translateY(0) rotate(0deg);
            }
            100% {
                opacity: 0;
                transform: translateY(300px) rotate(720deg);
            }
        }

        .feedback.incorrect {
            color: var(--red);
        }

        .action-buttons {
            display: flex;
            gap: 12px;
            justify-content: center;
            flex-wrap: wrap;
            margin-top: 20px;
        }

        .btn {
            font-family: 'Bebas Neue', sans-serif;
            font-size: 1.1rem;
            padding: 12px 24px;
            border: 2px solid var(--charcoal);
            border-radius: var(--border-radius-sm);
            background: var(--paper);
            cursor: pointer;
            transition: all var(--transition-base);
            letter-spacing: 1.5px;
            text-transform: uppercase;
            box-shadow: var(--shadow-sm);
            position: relative;
            overflow: hidden;
        }

        .btn::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            transition: left var(--transition-slow);
        }

        @media (hover: hover) {
            .btn:hover::before {
                left: 100%;
            }

            .btn:hover {
                background: var(--charcoal);
                color: white;
                transform: translateY(-3px);
                box-shadow: var(--shadow-md);
            }

            body.dark-mode .btn:hover {
                background: var(--matrix-green);
                color: var(--matrix-black);
                box-shadow: var(--shadow-md);
            }

            .btn-settings:hover {
                background: var(--dark-blue);
                color: white;
            }

            body.dark-mode .btn-settings:hover {
                background: var(--matrix-green-bright);
                color: var(--matrix-black);
                box-shadow: none;
            }
        }

        .btn:active {
            transform: translateY(-1px);
            box-shadow: var(--shadow-sm);
        }

        body.dark-mode .btn {
            background: var(--matrix-black);
            border: 2px solid var(--matrix-green);
            color: var(--matrix-green);
        }

        /* Settings button - unique style */
        .btn-settings {
            background: var(--gold);
            color: var(--charcoal);
            border: 2px solid var(--charcoal);
            font-weight: 700;
            position: relative;
        }

        body.dark-mode .btn-settings {
            background: var(--matrix-green);
            color: var(--matrix-black);
            border: 2px solid var(--matrix-green-bright);
            box-shadow: none;
        }

        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-top: 30px;
        }

        .stat-item {
            background: var(--cream);
            border: 3px solid var(--charcoal);
            padding: 15px;
            text-align: center;
            transition: all 0.3s;
        }

        body.dark-mode .stat-item {
            background: var(--matrix-card);
            border: 3px solid var(--matrix-green);
        }

        .stat-value {
            font-size: 2.5rem;
            font-weight: 600;
            color: var(--red);
            display: block;
            font-family: 'Bebas Neue', sans-serif;
            letter-spacing: 2px;
            transition: color 0.3s, text-shadow 0.3s;
        }

        body.dark-mode .stat-value {
            color: var(--matrix-green);
        }

        .stat-label {
            font-size: 0.9rem;
            color: var(--dark-blue);
            text-transform: uppercase;
            letter-spacing: 1px;
            transition: color 0.3s;
        }

        body.dark-mode .stat-label {
            color: var(--matrix-text-dim);
        }

        /* Settings Styles */
        .settings-section {
            margin-bottom: 30px;
        }

        .settings-section-title {
            font-size: 0.85rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: var(--charcoal);
            margin: 0 0 15px 0;
            opacity: 0.6;
        }

        body.dark-mode .settings-section-title {
            color: var(--matrix-text);
            opacity: 0.5;
        }

        .setting-item {
            padding: 16px 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 20px;
            border-bottom: 1px solid rgba(0, 0, 0, 0.08);
            transition: all 0.2s;
        }

        .setting-item:last-child {
            border-bottom: none;
        }

        .setting-item:hover {
            padding-left: 8px;
        }

        body.dark-mode .setting-item {
            border-bottom: 1px solid rgba(0, 255, 65, 0.1);
        }

        .setting-info {
            flex: 1;
        }

        .setting-label {
            font-size: 1rem;
            font-weight: 600;
            margin-bottom: 3px;
            color: var(--charcoal);
        }

        body.dark-mode .setting-label {
            color: var(--matrix-text);
        }

        .setting-desc {
            font-size: 0.85rem;
            opacity: 0.65;
            line-height: 1.4;
        }

        .settings-tip {
            background: rgba(255, 107, 53, 0.08);
            border-left: 3px solid var(--red);
            padding: 12px 16px;
            margin: 25px 0;
            font-size: 0.9rem;
            border-radius: 4px;
        }

        body.dark-mode .settings-tip {
            background: rgba(0, 255, 65, 0.05);
            border-left: 3px solid var(--matrix-green);
            color: var(--matrix-text);
        }

        /* Toggle Switch - More Modern */
        .toggle-switch {
            position: relative;
            width: 50px;
            height: 26px;
            flex-shrink: 0;
        }

        .toggle-switch input {
            opacity: 0;
            width: 0;
            height: 0;
        }

        .toggle-slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: #cbd5e0;
            transition: 0.3s;
            border-radius: 26px;
        }

        body.dark-mode .toggle-slider {
            background-color: rgba(255, 255, 255, 0.1);
        }

        .toggle-slider:before {
            position: absolute;
            content: "";
            height: 20px;
            width: 20px;
            left: 3px;
            bottom: 3px;
            background-color: white;
            transition: 0.3s;
            border-radius: 50%;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        body.dark-mode .toggle-slider:before {
            background-color: rgba(255, 255, 255, 0.9);
        }

        input:checked + .toggle-slider {
            background-color: var(--dark-blue);
        }

        body.dark-mode input:checked + .toggle-slider {
            background-color: var(--matrix-green);
        }

        input:checked + .toggle-slider:before {
            transform: translateX(24px);
        }

        body.dark-mode input:checked + .toggle-slider:before {
            background-color: var(--matrix-black);
        }

        /* Footer */
        footer {
            width: 100%;
            background: var(--charcoal);
            color: white;
            padding: 30px 20px;
            margin-top: 50px;
            border-top: 4px solid var(--dark-blue);
            transition: all 0.3s;
        }

        body.dark-mode footer {
            background: var(--matrix-card);
            border-top: 4px solid var(--matrix-green);
            color: var(--matrix-text);
        }

        .footer-content {
            max-width: 1400px;
            margin: 0 auto;
            text-align: center;
        }

        .footer-content p {
            margin-bottom: 10px;
            font-size: 0.9rem;
            letter-spacing: 1px;
        }

        .footer-links {
            display: flex;
            gap: 20px;
            justify-content: center;
            margin-top: 15px;
            flex-wrap: wrap;
        }

        .footer-links a {
            color: var(--gold);
            text-decoration: none;
            font-weight: 600;
            transition: color 0.2s;
        }

        body.dark-mode .footer-links a {
            color: var(--matrix-green);
        }

        .footer-links a:hover {
            color: white;
        }

        body.dark-mode .footer-links a:hover {
            color: var(--matrix-green-bright);
        }

        @media (max-width: 768px) {
            body {
                padding-top: 70px;
            }

            h1 {
                font-size: 2.5rem;
                letter-spacing: 3px;
            }

            .nav-logo {
                font-size: 1.5rem;
                letter-spacing: 3px;
            }

            /* Compress quiz elements to fit more on screen */
            .quiz-header {
                margin-bottom: 16px;
                gap: 8px;
            }

            .score {
                font-size: 0.95rem;
                padding: 6px 14px;
                border: 2px solid var(--charcoal);
            }

            body.dark-mode .score {
                border: 2px solid var(--matrix-green);
            }

            .progress {
                font-size: 0.85rem;
            }

            .character-display {
                margin: 16px 0 24px 0;
            }

            .cyrillic-char {
                font-size: 5.5rem;
                text-shadow: 3px 3px 0 var(--gold);
            }

            .cyrillic-char-lowercase {
                font-size: 3.2rem;
            }

            /* Audio button - better positioning for mobile */
            .audio-btn {
                right: 8%;
                width: 45px;
                height: 45px;
                font-size: 1.2rem;
            }

            .input-section {
                margin-bottom: 16px;
            }

            .input-wrapper {
                flex-direction: column;
                align-items: stretch;
                margin-bottom: 10px;
            }

            input[type="text"] {
                font-size: 1.3rem;
                max-width: 100%;
                min-width: auto;
                padding: 14px 18px;
            }

            .btn-submit {
                width: 100%;
                font-size: 1.2rem;
                padding: 13px;
            }

            .feedback {
                font-size: 1.4rem;
                margin-top: 10px;
                min-height: 36px;
            }

            .action-buttons {
                margin-top: 16px;
                gap: 8px;
            }

            .action-buttons .btn {
                font-size: 0.95rem;
                padding: 10px 14px;
            }

            .selection-header {
                flex-direction: column;
                align-items: stretch;
                gap: 12px;
            }

            .selection-header h2 {
                text-align: center;
                min-width: auto;
            }

            .selection-controls {
                width: 100%;
                justify-content: center;
                gap: 8px;
            }

            .btn-control {
                flex: 1;
                max-width: 160px;
                font-size: 0.9rem;
                padding: 12px 16px;
            }

            /* Keep 2 columns on mobile - compact enough */
            #reference-container {
                grid-template-columns: 1fr 1fr;
                gap: 8px;
            }

            /* 2 columns of characters inside each group tile */
            .reference-grid {
                grid-template-columns: repeat(2, 1fr);
                gap: 4px;
            }

            /* Tighter tile padding on mobile */
            .reference-section {
                padding: 10px;
            }

            /* Slightly tighter char tiles */
            .char-ref-item {
                padding: 5px 3px;
            }

            /* Mobile-optimized reference tables - compress to avoid horizontal scroll */
            #reference-page table {
                font-size: 0.85rem;
            }

            #reference-page th {
                padding: 8px 4px !important;
                font-size: 0.75rem;
                line-height: 1.2;
                white-space: normal;
                word-wrap: break-word;
            }

            #reference-page td {
                padding: 8px 4px !important;
                font-size: 0.85rem;
            }

            /* Shrink the letter column on mobile */
            #reference-page td:first-child span {
                font-size: 1.3rem !important;
            }

            #reference-page td:first-child span:last-child {
                font-size: 1rem !important;
            }

            /* Mobile article back button - make smaller */
            .article-back-btn {
                padding: 6px 12px;
                font-size: 0.85rem;
            }

            .article-header h2 {
                padding-right: 90px; /* Less space on mobile */
            }
        }
    </style>

    <!-- Structured Data (Schema.org) for Rich Results -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "Cyrilica",
        "alternateName": "CyriЛica",
        "applicationCategory": "EducationalApplication",
        "applicationSubCategory": "Language Learning",
        "description": "Free interactive web app to learn the Cyrillic alphabet in 1-2 weeks. Master Russian, Ukrainian, Bulgarian, and Serbian letters through interactive practice with instant feedback and progress tracking.",
        "url": "https://cyrilica.com",
        "image": "https://cyrilica.com/og-image.png",
        "screenshot": "https://cyrilica.com/og-image.png",
        "operatingSystem": "Web browser (Chrome, Firefox, Safari, Edge)",
        "browserRequirements": "Requires JavaScript",
        "softwareVersion": "2.0",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD",
            "availability": "https://schema.org/InStock"
        },
        "featureList": [
            "Interactive character selection",
            "Instant feedback on answers",
            "Progress tracking and statistics",
            "Audio pronunciation for each letter",
            "Dark mode support",
            "Mobile-responsive design",
            "No account required"
        ],
        "educationalLevel": "Beginner",
        "teaches": "Cyrillic alphabet reading and recognition",
        "learningResourceType": "Interactive Exercise",
        "interactivityType": "active",
        "educationalUse": "self-assessment",
        "timeRequired": "PT14D",
        "inLanguage": "en",
        "targetProduct": {
            "@type": "Thing",
            "name": "Cyrillic script knowledge",
            "description": "Ability to read and recognize all 33 letters of the Cyrillic alphabet"
        },
        "about": [
            {
                "@type": "Thing",
                "name": "Cyrillic alphabet",
                "description": "Writing system used for Russian, Ukrainian, Bulgarian, Serbian, and other Slavic languages"
            },
            {
                "@type": "Thing",
                "name": "Russian alphabet"
            },
            {
                "@type": "Thing",
                "name": "Ukrainian alphabet"
            },
            {
                "@type": "Thing",
                "name": "Bulgarian alphabet"
            }
        ],
        "audience": {
            "@type": "EducationalAudience",
            "educationalRole": "student",
            "audienceType": [
                "Language learners",
                "Travelers",
                "Students",
                "Heritage speakers"
            ]
        },
        "author": {
            "@type": "Organization",
            "name": "Cyrilica",
            "url": "https://cyrilica.com"
        },
        "provider": {
            "@type": "Organization",
            "name": "Cyrilica",
            "url": "https://cyrilica.com"
        },
        "isAccessibleForFree": true,
        "usageInfo": "https://cyrilica.com/privacy",
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "5.0",
            "ratingCount": "1",
            "reviewCount": "1"
        }
    }
    </script>

    <!-- WebSite Schema for Sitelinks Search Box -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "CyriЛica",
        "alternateName": "Cyrilica",
        "url": "https://cyrilica.com",
        "description": "Learn the Cyrillic alphabet interactively",
        "inLanguage": "en"
    }
    </script>

    <!-- Organization Schema -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "CyriЛica",
        "url": "https://cyrilica.com",
        "logo": "https://cyrilica.com/favicon.svg",
        "sameAs": [
            "https://github.com/malcolm15/cyrillic-learner"
        ],
        "contactPoint": {
            "@type": "ContactPoint",
            "email": "hello@cyrilica.com",
            "contactType": "customer support"
        }
    }
    </script>

    <!-- BreadcrumbList for navigation -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://cyrilica.com/"
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": "About",
                "item": "https://cyrilica.com/about"
            },
            {
                "@type": "ListItem",
                "position": 3,
                "name": "Contact",
                "item": "https://cyrilica.com/contact"
            }
        ]
    }
    </script>
</head>
<body>
    <!-- Navigation -->
    <nav>
        <div class="nav-container">
            <a href="#" class="nav-logo" onclick="showPage('home'); return false;">CYRI<span class="letter-l" onclick="burstConfetti(event, this); showPage('home'); return false;">Л<span class="confetti-burst"></span></span>ICA</a>
            <button class="menu-toggle" onclick="toggleMenu()">☰</button>
            <ul class="nav-links" id="nav-links">
                <li><a href="#" class="active" onclick="showPage('home'); return false;">Home</a></li>
                <li><a href="#" onclick="showPage('settings'); return false;">Settings</a></li>
                <li><a href="#" onclick="showPage('about'); return false;">About</a></li>
                <li><a href="#" onclick="showPage('articles'); return false;">Articles</a></li>
                <li><a href="#" onclick="showPage('contact'); return false;">Contact</a></li>
                <li><a href="#" onclick="showPage('privacy'); return false;">Privacy</a></li>
            </ul>
        </div>
    </nav>

        <div class="main-content">
            <div class="container">
                <!-- HOME PAGE -->
                <div id="home-page" class="page-content active">
                    <header>
                        <h1>CYRI<span class="letter-l" onclick="burstConfetti(event, this)">Л<span class="confetti-burst"></span></span>ICA</h1>
                        <div class="subtitle">Master the Cyrillic Alphabet</div>
                        <p class="site-description">Free interactive tool to learn the Cyrillic alphabet. Practice with instant feedback and track your progress.</p>
                    </header>

                    <!-- Combined Character Reference & Selection -->
                    <div class="card char-reference">
                        <div class="selection-header">
                            <h2>Select Characters to Study</h2>
                            <div class="selection-controls">
                                <button class="btn btn-control" onclick="selectAllGroups()">Select All</button>
                                <button class="btn btn-control" onclick="clearAllGroups()">Clear All</button>
                            </div>
                        </div>
                        <p class="content-text" style="margin-bottom: 14px; font-size: 0.9rem;">Click a group to select it for practice. Selected groups highlight in red. <strong>New to Cyrillic?</strong> Check out our <a href="#" onclick="showPage('reference'); return false;" class="reference-link">Complete Alphabet Reference</a> first!</p>
                        <div id="reference-container"></div>
                        <button class="start-btn" id="start-btn" disabled>Begin Learning</button>
                    </div>

                    <div id="quiz-container">
                        <div class="card">
                            <div class="quiz-header">
                                <div class="score" id="score">Score: 0/0</div>
                                <div class="progress" id="progress">Question 1</div>
                            </div>

                            <div class="character-display">
                                <span class="cyrillic-char" id="current-char">А</span>
                                <span class="cyrillic-char cyrillic-char-lowercase" id="current-char-lower" style="display: none;">а</span>
                                <button class="audio-btn" id="audio-btn" style="display: none;" title="Hear pronunciation">🔊</button>
                            </div>

                            <div class="input-section">
                                <div class="input-wrapper">
                                    <input 
                                        type="text" 
                                        id="answer-input" 
                                        placeholder="Type romanization..."
                                        autocomplete="off"
                                    />
                                    <button class="btn btn-submit" id="submit-btn" onclick="checkAnswer()">Submit</button>
                                </div>
                                <div class="feedback" id="feedback"></div>
                            </div>

                            <div class="action-buttons">
                                <button class="btn" id="skip-btn">Skip</button>
                                <button class="btn" id="reset-btn">Reset</button>
                                <button class="btn" id="home-btn">Home</button>
                                <button class="btn btn-settings" id="settings-btn" onclick="showPage('settings')">⚙️ Settings</button>
                            </div>

                            <div class="stats">
                                <div class="stat-item">
                                    <span class="stat-value" id="correct-count">0</span>
                                    <span class="stat-label">Correct</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-value" id="incorrect-count">0</span>
                                    <span class="stat-label">Incorrect</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-value" id="streak-count">0</span>
                                    <span class="stat-label">Streak</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- ARTICLES PAGE -->
                <div id="articles-page" class="page-content">
                    <!-- Articles Index -->
                    <div id="articles-index" class="articles-view active">
                        <div class="card">
                            <h2>Articles</h2>
                            <p class="content-text" style="margin-bottom: 30px;">Learn more about the Cyrillic alphabet, tips for memorization, and language learning strategies.</p>
                            
                            <div class="articles-list">
                                <!-- Category 1: Getting Started -->
                                <div class="article-category">
                                    <div class="article-category-header">
                                        <span class="emoji">🚀</span>
                                        <span>Getting Started</span>
                                    </div>
                                    <div class="article-category-desc">For complete beginners - your learning foundation</div>
                                    
                                    <div class="article-item" onclick="showArticle('getting-started')">
                                        <div class="article-item-content">
                                            <h3>Getting Started with Cyrillic</h3>
                                            <p>A beginner's guide to learning the Cyrillic alphabet efficiently.</p>
                                        </div>
                                    </div>
                                    
                                    <div class="article-item" onclick="showArticle('common-mistakes')">
                                        <div class="article-item-content">
                                            <h3>5 Common Mistakes When Learning Cyrillic</h3>
                                            <p>Avoid these pitfalls and accelerate your learning journey.</p>
                                        </div>
                                    </div>
                                    
                                    <div class="article-item" onclick="showArticle('memory-tricks')">
                                        <div class="article-item-content">
                                            <h3>Memory Tricks for Confusing Letters</h3>
                                            <p>Never confuse Н, Р, В, and other tricky characters again.</p>
                                        </div>
                                    </div>
                                    
                                    <div class="article-item" onclick="showArticle('cyrillic-tier-list')">
                                        <div class="article-item-content">
                                            <h3>Cyrillic Alphabet Tier List: Ranking Letters by Difficulty</h3>
                                            <p>From S-tier (easy) to F-tier (nightmare) - every letter ranked for learners.</p>
                                        </div>
                                    </div>
                                    
                                    <div class="article-item" onclick="showArticle('false-friends')">
                                        <div class="article-item-content">
                                            <h3>False Friends: Cyrillic Letters That Fool English Speakers</h3>
                                            <p>Master the six letters that look familiar but sound completely different.</p>
                                        </div>
                                    </div>
                                    
                                    <div class="article-item" onclick="showArticle('first-25-words')">
                                        <div class="article-item-content">
                                            <h3>Reading Practice: Your First 25 Russian Words</h3>
                                            <p>Start reading real Russian words using what you've learned.</p>
                                        </div>
                                    </div>
                                    
                                    <div class="article-item" onclick="showArticle('easy-russian-words')">
                                        <div class="article-item-content">
                                            <h3>Common Russian Words Using Only Easy Letters</h3>
                                            <p>Read real Russian words today using just 5-9 simple letters.</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Category 2: Alphabet Variants -->
                                <div class="article-category">
                                    <div class="article-category-header">
                                        <span class="emoji">📚</span>
                                        <span>Alphabet Variants</span>
                                    </div>
                                    <div class="article-category-desc">Exploring Cyrillic across different languages</div>
                                    
                                    <div class="article-item" onclick="showArticle('ukrainian-alphabet')">
                                        <div class="article-item-content">
                                            <h3>Ukrainian Alphabet Guide</h3>
                                            <p>Key differences from Russian Cyrillic explained.</p>
                                        </div>
                                    </div>
                                    
                                    <div class="article-item" onclick="showArticle('bulgarian-alphabet')">
                                        <div class="article-item-content">
                                            <h3>Bulgarian Alphabet Guide</h3>
                                            <p>The birthplace of Cyrillic - 30 letters explained.</p>
                                        </div>
                                    </div>
                                    
                                    <div class="article-item" onclick="showArticle('serbian-cyrillic-vs-latin')">
                                        <div class="article-item-content">
                                            <h3>Serbian: Cyrillic vs Latin Scripts</h3>
                                            <p>Understanding Serbia's dual-alphabet system.</p>
                                        </div>
                                    </div>
                                    
                                    <div class="article-item" onclick="showArticle('belarusian-alphabet')">
                                        <div class="article-item-content">
                                            <h3>Belarusian Alphabet Guide: 32 Letters of Eastern Europe</h3>
                                            <p>Discover the unique Ў letter and Belarus's distinct Cyrillic system.</p>
                                        </div>
                                    </div>
                                    
                                    <div class="article-item" onclick="showArticle('montenegrin-alphabet')">
                                        <div class="article-item-content">
                                            <h3>Montenegrin Alphabet: The Newest Cyrillic (2009)</h3>
                                            <p>Meet Ś and Ź - the newest letters added to Cyrillic in the 21st century.</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Category 3: History & Culture -->
                                <div class="article-category">
                                    <div class="article-category-header">
                                        <span class="emoji">📖</span>
                                        <span>History & Culture</span>
                                    </div>
                                    <div class="article-category-desc">Deep dives into Cyrillic's fascinating past</div>
                                    
                                    <div class="article-item" onclick="showArticle('history-of-cyrillic')">
                                        <div class="article-item-content">
                                            <h3>The History of the Cyrillic Alphabet</h3>
                                            <p>1,150 years from Saints Cyril and Methodius to today.</p>
                                        </div>
                                    </div>
                                    
                                    <div class="article-item" onclick="showArticle('lost-letters')">
                                        <div class="article-item-content">
                                            <h3>The Lost Letters of Cyrillic: A Journey Through Extinct Characters</h3>
                                            <p>Discover the 100+ letters that have vanished from Cyrillic over 1,150 years.</p>
                                        </div>
                                    </div>
                                    
                                    <div class="article-item" onclick="showArticle('glagolitic')">
                                        <div class="article-item-content">
                                            <h3>Glagolitic: The Mysterious Alphabet Before Cyrillic</h3>
                                            <p>The strange, ornate alphabet that predates Cyrillic by decades.</p>
                                        </div>
                                    </div>
                                    
                                    <div class="article-item" onclick="showArticle('cyrillic-names-europe')">
                                        <div class="article-item-content">
                                            <h3>What is Cyrillic Called in Different European Languages?</h3>
                                            <p>From Kirillitsa to Kyrillisches Alphabet - how Europe names Cyrillic.</p>
                                        </div>
                                    </div>
                                    
                                    <div class="article-item" onclick="showArticle('backwards-r-myth')">
                                        <div class="article-item-content">
                                            <h3>The Cyrillic "Backwards R" Myth: Why Hollywood Gets It Wrong</h3>
                                            <p>Faux Cyrillic in movies, vodka bottles, and Rocky IV explained.</p>
                                        </div>
                                    </div>
                                    
                                    <div class="article-item" onclick="showArticle('kazakhstan-latin-transition')">
                                        <div class="article-item-content">
                                            <h3>Kazakhstan's Alphabet Transition: From Cyrillic to Latin by 2031</h3>
                                            <p>One of the most ambitious alphabet reforms of the 21st century.</p>
                                        </div>
                                    </div>
                                    
                                    <div class="article-item" onclick="showArticle('latin-vs-cyrillic-slavic')">
                                        <div class="article-item-content">
                                            <h3>Why Some Slavic Countries Use Latin Instead of Cyrillic</h3>
                                            <p>The Great Schism's thousand-year impact on Slavic alphabets.</p>
                                        </div>
                                    </div>
                                    
                                    <div class="article-item" onclick="showArticle('cyrillic-pop-culture')">
                                        <div class="article-item-content">
                                            <h3>Cyrillic in Pop Culture: From Rocky IV to Call of Duty</h3>
                                            <p>How Cyrillic appears in movies, games, fashion, and memes.</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Category 4: Learning Tools & Resources -->
                                <div class="article-category">
                                    <div class="article-category-header">
                                        <span class="emoji">🛠️</span>
                                        <span>Learning Tools & Resources</span>
                                    </div>
                                    <div class="article-category-desc">Practical guides for mastering Cyrillic</div>
                                    
                                    <div class="article-item" onclick="showArticle('how-to-type-cyrillic')">
                                        <div class="article-item-content">
                                            <h3>How to Type in Cyrillic</h3>
                                            <p>Setup guide for Windows, Mac, iOS, and Android.</p>
                                        </div>
                                    </div>
                                    
                                    <div class="article-item" onclick="showArticle('cyrillic-handwriting')">
                                        <div class="article-item-content">
                                            <h3>Cyrillic Handwriting Guide</h3>
                                            <p>How cursive letters differ from print.</p>
                                        </div>
                                    </div>
                                    
                                    <div class="article-item" onclick="showArticle('practice-writing-cyrillic')">
                                        <div class="article-item-content">
                                            <h3>How to Practice Writing Cyrillic by Hand</h3>
                                            <p>Stroke order, cursive challenges, and daily practice routines.</p>
                                        </div>
                                    </div>
                                    
                                    <div class="article-item" onclick="showArticle('cyrillic-alphabet-chart')">
                                        <div class="article-item-content">
                                            <h3>Complete Cyrillic Alphabet Chart</h3>
                                            <p>All 33 letters with pronunciations and examples.</p>
                                        </div>
                                    </div>
                                    
                                    <div class="article-item" onclick="showArticle('cyrillic-vs-latin')">
                                        <div class="article-item-content">
                                            <h3>Cyrillic vs Latin Alphabet</h3>
                                            <p>Complete comparison of the two writing systems.</p>
                                        </div>
                                    </div>
                                    
                                    <div class="article-item" onclick="showArticle('cyrillic-learning-resources')">
                                        <div class="article-item-content">
                                            <h3>Best Resources for Learning Cyrillic</h3>
                                            <p>Top apps, websites, and tools to accelerate your learning.</p>
                                        </div>
                                    </div>
                                    
                                    <div class="article-item" onclick="showArticle('common-cyrillic-mistakes')">
                                        <div class="article-item-content">
                                            <h3>10 Common Cyrillic Mistakes</h3>
                                            <p>English speakers' most frequent errors and how to fix them.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Individual Article View (hidden by default) -->
                    <div id="article-view" class="articles-view" style="display: none;">
                        <div class="card">
                            <div class="article-header">
                                <h2 id="article-title"></h2>
                                <button class="article-back-btn" onclick="showArticleIndex()" title="Back to Articles">← Back</button>
                            </div>
                            
                            <div class="article-content content-text" id="article-content">
                                <!-- Article content loaded here -->
                            </div>
                            
                            <div class="article-navigation">
                                <button class="btn" id="prev-article" onclick="navigateArticle('prev')">← Previous</button>
                                <button class="btn" onclick="showArticleIndex()">Back to Articles</button>
                                <button class="btn" id="next-article" onclick="navigateArticle('next')">Next →</button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- ABOUT PAGE -->
                <div id="about-page" class="page-content">
                    <div class="card">
                        <h2>About Cyrilica</h2>
                        
                        <div class="content-text">
                            <p>Hey there! I'm a language learner who was looking for a simple, no-nonsense tool to learn the Cyrillic alphabet, so I decided to build the tool I wished existed. Something straightforward: you pick which letters you want to practice, the app shows you a character, you type what it sounds like, and you get instant feedback. That's it. No fluff, no subscriptions, no annoying popups asking you to upgrade.</p>
                        </div>

                        <div class="content-text">
                            <p>I built this mostly for myself while learning Russian, but honestly? If it helps even one other person out there trying to wrap their head around Cyrillic, that's awesome. Learning a new alphabet can feel overwhelming at first, but breaking it down into small groups and just drilling the basics makes it so much more manageable.</p>
                        </div>

                        <h3>Why Cyrillic?</h3>
                        <div class="content-text">
                            <p>The Cyrillic script is used by over 250 million people worldwide. It's the writing system for Russian, Ukrainian, Bulgarian, Serbian, and many other languages. Once you get past the initial "these letters look weird" phase, it's actually pretty logical and consistent.</p>
                        </div>

                        <div class="content-text">
                            <p>Plus, there's something really satisfying about being able to read signs and menus in a whole new script. It feels like unlocking a secret code.</p>
                        </div>

                        <h3>How It Works</h3>
                        <div class="content-text">
                            <p>The concept is dead simple: choose which character groups you want to study (vowels, consonants, whatever), click "Begin Learning," and start typing. The app will randomly quiz you on those characters. Get it right, your streak goes up. Get it wrong, you see the correct answer and keep going.</p>
                        </div>

                        <div class="content-text">
                            <p>There's no complicated spaced repetition algorithm or points system—just you, the letters, and honest practice. Sometimes the simplest approach is the best one.</p>
                        </div>

                        <h3>Keep Practicing</h3>
                        <div class="content-text">
                            <p>Learning an alphabet takes repetition. Don't get discouraged if some letters don't stick right away (looking at you, Ы and Щ). Just keep at it, practice a little bit every day, and before you know it, you'll be reading Cyrillic like it's second nature.</p>
                        </div>

                        <div class="content-text">
                            <p>Good luck with your learning, and thanks for using Cyrilica!</p>
                        </div>
                    </div>
                </div>

                <!-- CYRILLIC ALPHABET REFERENCE PAGE -->
                <div id="reference-page" class="page-content">
                    <div class="card">
                        <h2>Complete Cyrillic Alphabet Reference</h2>
                        
                        <div class="content-text">
                            <p>The Russian Cyrillic alphabet consists of 33 letters. This comprehensive reference shows each letter's uppercase and lowercase forms, pronunciation guide, and example words.</p>
                        </div>

                        <h3>Vowels (10 letters)</h3>
                        <div style="overflow-x: auto;">
                            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                                <tr style="background: var(--cream); border-bottom: 2px solid var(--charcoal);">
                                    <th style="padding: 10px; text-align: left;">Letter</th>
                                    <th style="padding: 10px; text-align: left;">Sound</th>
                                    <th style="padding: 10px; text-align: left;">Pronunciation</th>
                                    <th style="padding: 10px; text-align: left;">Example</th>
                                </tr>
                                <tr style="border-bottom: 1px solid #ddd;">
                                    <td style="padding: 10px;"><span style="font-size: 1.5rem; font-weight: bold;">А</span> <span style="font-size: 1.2rem;">а</span></td>
                                    
                                    <td style="padding: 10px;">a</td>
                                    <td style="padding: 10px;">Like "a" in "father"</td>
                                    <td style="padding: 10px;">Анна (Anna)</td>
                                </tr>
                                <tr style="border-bottom: 1px solid #ddd;">
                                    <td style="padding: 10px;"><span style="font-size: 1.5rem; font-weight: bold;">Е</span> <span style="font-size: 1.2rem;">е</span></td>
                                    
                                    <td style="padding: 10px;">ye</td>
                                    <td style="padding: 10px;">Like "ye" in "yes"</td>
                                    <td style="padding: 10px;">есть (yest - to eat)</td>
                                </tr>
                                <tr style="border-bottom: 1px solid #ddd;">
                                    <td style="padding: 10px;"><span style="font-size: 1.5rem; font-weight: bold;">Ё</span> <span style="font-size: 1.2rem;">ё</span></td>
                                    
                                    <td style="padding: 10px;">yo</td>
                                    <td style="padding: 10px;">Like "yo" in "yolk"</td>
                                    <td style="padding: 10px;">ёж (yozh - hedgehog)</td>
                                </tr>
                                <tr style="border-bottom: 1px solid #ddd;">
                                    <td style="padding: 10px;"><span style="font-size: 1.5rem; font-weight: bold;">И</span> <span style="font-size: 1.2rem;">и</span></td>
                                    
                                    <td style="padding: 10px;">i</td>
                                    <td style="padding: 10px;">Like "ee" in "see"</td>
                                    <td style="padding: 10px;">имя (imya - name)</td>
                                </tr>
                                <tr style="border-bottom: 1px solid #ddd;">
                                    <td style="padding: 10px;"><span style="font-size: 1.5rem; font-weight: bold;">О</span> <span style="font-size: 1.2rem;">о</span></td>
                                    
                                    <td style="padding: 10px;">o</td>
                                    <td style="padding: 10px;">Like "o" in "or"</td>
                                    <td style="padding: 10px;">окно (okno - window)</td>
                                </tr>
                                <tr style="border-bottom: 1px solid #ddd;">
                                    <td style="padding: 10px;"><span style="font-size: 1.5rem; font-weight: bold;">У</span> <span style="font-size: 1.2rem;">у</span></td>
                                    
                                    <td style="padding: 10px;">u</td>
                                    <td style="padding: 10px;">Like "oo" in "boot"</td>
                                    <td style="padding: 10px;">утро (utro - morning)</td>
                                </tr>
                                <tr style="border-bottom: 1px solid #ddd;">
                                    <td style="padding: 10px;"><span style="font-size: 1.5rem; font-weight: bold;">Ы</span> <span style="font-size: 1.2rem;">ы</span></td>
                                    
                                    <td style="padding: 10px;">y</td>
                                    <td style="padding: 10px;">Unique sound (between "i" and "u")</td>
                                    <td style="padding: 10px;">мы (my - we)</td>
                                </tr>
                                <tr style="border-bottom: 1px solid #ddd;">
                                    <td style="padding: 10px;"><span style="font-size: 1.5rem; font-weight: bold;">Э</span> <span style="font-size: 1.2rem;">э</span></td>
                                    
                                    <td style="padding: 10px;">e</td>
                                    <td style="padding: 10px;">Like "e" in "met"</td>
                                    <td style="padding: 10px;">это (eto - this)</td>
                                </tr>
                                <tr style="border-bottom: 1px solid #ddd;">
                                    <td style="padding: 10px;"><span style="font-size: 1.5rem; font-weight: bold;">Ю</span> <span style="font-size: 1.2rem;">ю</span></td>
                                    
                                    <td style="padding: 10px;">yu</td>
                                    <td style="padding: 10px;">Like "yu" in "yuletide"</td>
                                    <td style="padding: 10px;">юг (yug - south)</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px;"><span style="font-size: 1.5rem; font-weight: bold;">Я</span> <span style="font-size: 1.2rem;">я</span></td>
                                    
                                    <td style="padding: 10px;">ya</td>
                                    <td style="padding: 10px;">Like "ya" in "yard"</td>
                                    <td style="padding: 10px;">яблоко (yabloko - apple)</td>
                                </tr>
                            </table>
                        </div>

                        <h3>Consonants (21 letters)</h3>
                        <div style="overflow-x: auto;">
                            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                                <tr style="background: var(--cream); border-bottom: 2px solid var(--charcoal);">
                                    <th style="padding: 10px; text-align: left;">Letter</th>
                                    <th style="padding: 10px; text-align: left;">Sound</th>
                                    <th style="padding: 10px; text-align: left;">Pronunciation</th>
                                    <th style="padding: 10px; text-align: left;">Example</th>
                                </tr>
                                <tr style="border-bottom: 1px solid #ddd;"><td style="padding: 10px;"><span style="font-size: 1.5rem; font-weight: bold;">Б</span> <span style="font-size: 1.2rem;">б</span></td><td style="padding: 10px;">b</td><td style="padding: 10px;">Like "b" in "boy"</td><td style="padding: 10px;">банк (bank)</td></tr>
                                <tr style="border-bottom: 1px solid #ddd;"><td style="padding: 10px;"><span style="font-size: 1.5rem; font-weight: bold;">В</span> <span style="font-size: 1.2rem;">в</span></td><td style="padding: 10px;">v</td><td style="padding: 10px;">Like "v" in "van" (looks like B!)</td><td style="padding: 10px;">вода (voda - water)</td></tr>
                                <tr style="border-bottom: 1px solid #ddd;"><td style="padding: 10px;"><span style="font-size: 1.5rem; font-weight: bold;">Г</span> <span style="font-size: 1.2rem;">г</span></td><td style="padding: 10px;">g</td><td style="padding: 10px;">Like "g" in "go"</td><td style="padding: 10px;">город (gorod - city)</td></tr>
                                <tr style="border-bottom: 1px solid #ddd;"><td style="padding: 10px;"><span style="font-size: 1.5rem; font-weight: bold;">Д</span> <span style="font-size: 1.2rem;">д</span></td><td style="padding: 10px;">d</td><td style="padding: 10px;">Like "d" in "dog"</td><td style="padding: 10px;">дом (dom - house)</td></tr>
                                <tr style="border-bottom: 1px solid #ddd;"><td style="padding: 10px;"><span style="font-size: 1.5rem; font-weight: bold;">Ж</span> <span style="font-size: 1.2rem;">ж</span></td><td style="padding: 10px;">zh</td><td style="padding: 10px;">Like "s" in "measure"</td><td style="padding: 10px;">жизнь (zhizn - life)</td></tr>
                                <tr style="border-bottom: 1px solid #ddd;"><td style="padding: 10px;"><span style="font-size: 1.5rem; font-weight: bold;">З</span> <span style="font-size: 1.2rem;">з</span></td><td style="padding: 10px;">z</td><td style="padding: 10px;">Like "z" in "zoo"</td><td style="padding: 10px;">зима (zima - winter)</td></tr>
                                <tr style="border-bottom: 1px solid #ddd;"><td style="padding: 10px;"><span style="font-size: 1.5rem; font-weight: bold;">Й</span> <span style="font-size: 1.2rem;">й</span></td><td style="padding: 10px;">y</td><td style="padding: 10px;">Like "y" in "boy"</td><td style="padding: 10px;">мой (moy - my)</td></tr>
                                <tr style="border-bottom: 1px solid #ddd;"><td style="padding: 10px;"><span style="font-size: 1.5rem; font-weight: bold;">К</span> <span style="font-size: 1.2rem;">к</span></td><td style="padding: 10px;">k</td><td style="padding: 10px;">Like "k" in "kite"</td><td style="padding: 10px;">кот (kot - cat)</td></tr>
                                <tr style="border-bottom: 1px solid #ddd;"><td style="padding: 10px;"><span style="font-size: 1.5rem; font-weight: bold;">Л</span> <span style="font-size: 1.2rem;">л</span></td><td style="padding: 10px;">l</td><td style="padding: 10px;">Like "l" in "lamp"</td><td style="padding: 10px;">любовь (lyubov - love)</td></tr>
                                <tr style="border-bottom: 1px solid #ddd;"><td style="padding: 10px;"><span style="font-size: 1.5rem; font-weight: bold;">М</span> <span style="font-size: 1.2rem;">м</span></td><td style="padding: 10px;">m</td><td style="padding: 10px;">Like "m" in "mom"</td><td style="padding: 10px;">мама (mama)</td></tr>
                                <tr style="border-bottom: 1px solid #ddd;"><td style="padding: 10px;"><span style="font-size: 1.5rem; font-weight: bold;">Н</span> <span style="font-size: 1.2rem;">н</span></td><td style="padding: 10px;">n</td><td style="padding: 10px;">Like "n" in "no" (looks like H!)</td><td style="padding: 10px;">но (no - but)</td></tr>
                                <tr style="border-bottom: 1px solid #ddd;"><td style="padding: 10px;"><span style="font-size: 1.5rem; font-weight: bold;">П</span> <span style="font-size: 1.2rem;">п</span></td><td style="padding: 10px;">p</td><td style="padding: 10px;">Like "p" in "pot"</td><td style="padding: 10px;">папа (papa)</td></tr>
                                <tr style="border-bottom: 1px solid #ddd;"><td style="padding: 10px;"><span style="font-size: 1.5rem; font-weight: bold;">Р</span> <span style="font-size: 1.2rem;">р</span></td><td style="padding: 10px;">r</td><td style="padding: 10px;">Rolled "r" (looks like P!)</td><td style="padding: 10px;">рука (ruka - hand)</td></tr>
                                <tr style="border-bottom: 1px solid #ddd;"><td style="padding: 10px;"><span style="font-size: 1.5rem; font-weight: bold;">С</span> <span style="font-size: 1.2rem;">с</span></td><td style="padding: 10px;">s</td><td style="padding: 10px;">Like "s" in "sun" (looks like C!)</td><td style="padding: 10px;">слово (slovo - word)</td></tr>
                                <tr style="border-bottom: 1px solid #ddd;"><td style="padding: 10px;"><span style="font-size: 1.5rem; font-weight: bold;">Т</span> <span style="font-size: 1.2rem;">т</span></td><td style="padding: 10px;">t</td><td style="padding: 10px;">Like "t" in "top"</td><td style="padding: 10px;">там (tam - there)</td></tr>
                                <tr style="border-bottom: 1px solid #ddd;"><td style="padding: 10px;"><span style="font-size: 1.5rem; font-weight: bold;">Ф</span> <span style="font-size: 1.2rem;">ф</span></td><td style="padding: 10px;">f</td><td style="padding: 10px;">Like "f" in "fun"</td><td style="padding: 10px;">фото (foto)</td></tr>
                                <tr style="border-bottom: 1px solid #ddd;"><td style="padding: 10px;"><span style="font-size: 1.5rem; font-weight: bold;">Х</span> <span style="font-size: 1.2rem;">х</span></td><td style="padding: 10px;">kh</td><td style="padding: 10px;">Guttural "h" (like Scottish "loch")</td><td style="padding: 10px;">хорошо (khorosho - good)</td></tr>
                                <tr style="border-bottom: 1px solid #ddd;"><td style="padding: 10px;"><span style="font-size: 1.5rem; font-weight: bold;">Ц</span> <span style="font-size: 1.2rem;">ц</span></td><td style="padding: 10px;">ts</td><td style="padding: 10px;">Like "ts" in "cats"</td><td style="padding: 10px;">царь (tsar)</td></tr>
                                <tr style="border-bottom: 1px solid #ddd;"><td style="padding: 10px;"><span style="font-size: 1.5rem; font-weight: bold;">Ч</span> <span style="font-size: 1.2rem;">ч</span></td><td style="padding: 10px;">ch</td><td style="padding: 10px;">Like "ch" in "chip"</td><td style="padding: 10px;">час (chas - hour)</td></tr>
                                <tr style="border-bottom: 1px solid #ddd;"><td style="padding: 10px;"><span style="font-size: 1.5rem; font-weight: bold;">Ш</span> <span style="font-size: 1.2rem;">ш</span></td><td style="padding: 10px;">sh</td><td style="padding: 10px;">Like "sh" in "shop"</td><td style="padding: 10px;">школа (shkola - school)</td></tr>
                                <tr><td style="padding: 10px;"><span style="font-size: 1.5rem; font-weight: bold;">Щ</span> <span style="font-size: 1.2rem;">щ</span></td><td style="padding: 10px;">shch</td><td style="padding: 10px;">Like "shch" (longer sh)</td><td style="padding: 10px;">борщ (borshch)</td></tr>
                            </table>
                        </div>

                        <h3>Special Signs (2 letters)</h3>
                        <div style="overflow-x: auto;">
                            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                                <tr style="background: var(--cream); border-bottom: 2px solid var(--charcoal);">
                                    <th style="padding: 10px; text-align: left;">Letter</th>
                                    <th style="padding: 10px; text-align: left;">Name</th>
                                    <th style="padding: 10px; text-align: left;">Function</th>
                                    <th style="padding: 10px; text-align: left;">Example</th>
                                </tr>
                                <tr style="border-bottom: 1px solid #ddd;">
                                    <td style="padding: 10px;"><span style="font-size: 1.5rem; font-weight: bold;">Ь</span> <span style="font-size: 1.2rem;">ь</span></td>
                                    
                                    <td style="padding: 10px;">Soft sign</td>
                                    <td style="padding: 10px;">Softens preceding consonant</td>
                                    <td style="padding: 10px;">мать (mat' - mother)</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px;"><span style="font-size: 1.5rem; font-weight: bold;">Ъ</span> <span style="font-size: 1.2rem;">ъ</span></td>
                                    
                                    <td style="padding: 10px;">Hard sign</td>
                                    <td style="padding: 10px;">Adds slight pause/separation</td>
                                    <td style="padding: 10px;">объект (ob-yekt - object)</td>
                                </tr>
                            </table>
                        </div>

                        <div class="content-text" style="margin-top: 30px;">
                            <p><strong>Practice Tip:</strong> Start by learning the vowels first, then move to consonants that look similar to English letters. Save the unique characters (Ж, Ш, Щ, Ы) for last. Use our interactive tool on the Home page to test your knowledge!</p>
                            
                            <div style="text-align: center; margin-top: 30px;">
                                <button class="btn" onclick="showPage('home'); return false;" style="background: var(--dark-blue); color: white; padding: 14px 40px;">← Back to Home</button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- SETTINGS PAGE -->
                <div id="settings-page" class="page-content">
                    <div class="card">
                        <h2>Settings</h2>
                        
                        <div class="settings-section">
                            <h3 class="settings-section-title">Quiz Settings</h3>
                            
                            <div class="setting-item">
                                <div class="setting-info">
                                    <div class="setting-label">Include Lowercase</div>
                                    <div class="setting-desc">Show lowercase letters alongside uppercase during quizzes</div>
                                </div>
                                <label class="toggle-switch">
                                    <input type="checkbox" id="lowercase-toggle" onchange="toggleLowercase()">
                                    <span class="toggle-slider"></span>
                                </label>
                            </div>

                            <div class="setting-item">
                                <div class="setting-info">
                                    <div class="setting-label">Auto-Submit</div>
                                    <div class="setting-desc">Answer is submitted automatically when correct</div>
                                </div>
                                <label class="toggle-switch">
                                    <input type="checkbox" id="autosubmit-toggle" onchange="toggleAutoSubmit()">
                                    <span class="toggle-slider"></span>
                                </label>
                            </div>

                            <div class="setting-item">
                                <div class="setting-info">
                                    <div class="setting-label">Continuous Play</div>
                                    <div class="setting-desc">Score persists when starting a new session</div>
                                </div>
                                <label class="toggle-switch">
                                    <input type="checkbox" id="continuous-toggle" onchange="toggleContinuous()">
                                    <span class="toggle-slider"></span>
                                </label>
                            </div>

                            <div class="setting-item">
                                <div class="setting-info">
                                    <div class="setting-label">Repeat Problem Questions</div>
                                    <div class="setting-desc">Characters you get wrong appear more frequently</div>
                                </div>
                                <label class="toggle-switch">
                                    <input type="checkbox" id="repeat-toggle" onchange="toggleRepeat()">
                                    <span class="toggle-slider"></span>
                                </label>
                            </div>
                        </div>

                        <div class="settings-section">
                            <h3 class="settings-section-title">Appearance</h3>
                            
                            <div class="setting-item">
                                <div class="setting-info">
                                    <div class="setting-label">Matrix Mode</div>
                                    <div class="setting-desc">Dark theme with neon green cyberpunk aesthetics</div>
                                </div>
                                <label class="toggle-switch">
                                    <input type="checkbox" id="darkmode-toggle" onchange="toggleDarkMode()">
                                    <span class="toggle-slider"></span>
                                </label>
                            </div>
                        </div>

                        <div class="settings-tip">
                            💡 <strong>Tip:</strong> Enable Auto-Submit for faster practice, or keep it off if you prefer to review your answer before submitting.
                        </div>

                        <button class="start-btn" id="resume-btn" onclick="resumeLearning()">Resume Learning</button>
                    </div>
                </div>

                <!-- CONTACT PAGE -->
                <div id="contact-page" class="page-content">
                    <div class="card">
                        <h2>Contact</h2>
                        
                        <div class="content-text">
                            <p>Have feedback, found a bug, or have suggestions for improving CyriЛica? I'd love to hear from you!</p>
                        </div>

                        <h3>Get in Touch</h3>
                        <div class="content-text">
                            <p>Email me at: <a href="/cdn-cgi/l/email-protection#86eee3eaeae9c6e5fff4efeaefe5e7a8e5e9eb" id="contact-email"><span class="__cf_email__" data-cfemail="f49c9198989bb4978d869d989d9795da979b99">[email&#160;protected]</span></a></p>
                            <script data-cfasync="false" src="/cdn-cgi/scripts/5c5dd728/cloudflare-static/email-decode.min.js"></script><script>
                                // Simple email deobfuscation to bypass Cloudflare protection
                                (function() {
                                    const user = 'hello';
                                    const domain = 'cyrilica.com';
                                    const email = user + '@' + domain;
                                    const emailLink = document.getElementById('contact-email');
                                    if (emailLink) {
                                        emailLink.href = 'mailto:' + email;
                                        emailLink.textContent = email;
                                    }
                                })();
                            </script>
                        </div>

                        <div class="content-text">
                            <p>This is a small, personal project built by a language learner for language learners. Your feedback helps make it better for everyone.</p>
                        </div>

                        <h3>What to Report</h3>
                        <div class="content-text">
                            <p><strong>Bug reports:</strong> If something isn't working as expected, let me know! Include details like what browser you're using and what happened.</p>
                        </div>

                        <div class="content-text">
                            <p><strong>Feature requests:</strong> Have an idea for a new feature? I'm always open to suggestions that would make learning easier.</p>
                        </div>

                        <div class="content-text">
                            <p><strong>General feedback:</strong> Enjoying the site? Having trouble with something? Just want to say hi? Drop me a line!</p>
                        </div>

                        <h3>Response Time</h3>
                        <div class="content-text">
                            <p>I'll do my best to respond within a few days. Thanks for your patience – this is a side project, but I genuinely appreciate hearing from users.</p>
                        </div>

                        <div class="content-text">
                            <p>Happy learning! 🎓</p>
                        </div>
                    </div>
                </div>

                <!-- PRIVACY PAGE -->
                <div id="privacy-page" class="page-content">
                    <div class="card">
                        <h2>Privacy Policy</h2>
                        
                        <div class="content-text">
                            <p><strong>Last updated: February 10, 2026</strong></p>
                        </div>

                        <div class="content-text">
                            <p>Cyrilica is a simple learning tool, and we want to be completely transparent about what data is collected when you use this site.</p>
                        </div>

                        <h3>What We Collect</h3>
                        <div class="content-text">
                            <p>Cyrilica itself doesn't directly collect, store, or process any personal information. However, this site uses third-party services that may collect data:</p>
                        </div>

                        <div class="content-text">
                            <p><strong>Google Analytics:</strong> We use Google Analytics to understand how people use the site (like which pages are visited, how long people stay, and general location data). We also track quiz activity to improve the learning experience, such as which characters are studied and how the quiz features are used. This helps us identify which areas are most challenging and which features are most helpful. All tracking is anonymous and aggregated. You can learn more about how Google uses data at <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Google's Privacy Policy</a>.</p>
                        </div>

                        <div class="content-text">
                            <p><strong>Google AdSense:</strong> We display ads through Google AdSense to help cover the costs of running this site. Google AdSense uses cookies to show ads based on your browsing activity. You can control ad personalization through <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener">Google's Ad Settings</a>.</p>
                        </div>

                        <div class="content-text">
                            <p><strong>Consent Management:</strong> If you're visiting from the European Economic Area (EEA), the UK, or Switzerland, you'll see a consent banner asking for your permission to use cookies for personalized ads. Your choice is stored locally in your browser.</p>
                        </div>

                        <h3>What We Don't Do</h3>
                        <div class="content-text">
                            <p>We don't collect your name, email address, or any personal information. We don't track your quiz scores or study progress outside of your own browser session. We don't sell or share data with anyone except the third-party services mentioned above (Google Analytics and AdSense), which are industry-standard tools.</p>
                        </div>

                        <h3>Cookies</h3>
                        <div class="content-text">
                            <p>This site uses cookies from Google Analytics and Google AdSense. Cookies are small files stored on your device that help these services function. You can disable cookies in your browser settings, but some features of the site may not work properly if you do.</p>
                        </div>

                        <h3>Your Choices</h3>
                        <div class="content-text">
                            <p>You can opt out of personalized ads by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener">Google's Ad Settings</a>. You can also use browser extensions or privacy tools to block tracking cookies.</p>
                        </div>

                        <div class="content-text">
                            <p>If you're in the EEA, UK, or Switzerland, you can update your consent preferences at any time through the consent banner that appears when you visit the site.</p>
                        </div>

                        <h3>Changes to This Policy</h3>
                        <div class="content-text">
                            <p>If we make changes to this privacy policy, we'll update the "Last updated" date at the top of this page. Since this site is pretty simple, we don't expect major changes, but we'll keep you informed if anything does change.</p>
                        </div>

                        <h3>Questions?</h3>
                        <div class="content-text">
                            <p>This is a small, personal project, so if you have questions or concerns about privacy, feel free to reach out. We're committed to being transparent and straightforward about how this site works.</p>
                        </div>

                        <div class="content-text">
                            <p>Thanks for using Cyrilica, and happy learning!</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    <!-- Footer -->
    <footer>
        <div class="footer-content">
            <p>© 2026 Cyrilica. All rights reserved.</p>
            <div class="footer-links">
                <a href="#" onclick="showPage('privacy'); return false;">Privacy Policy</a>
                <a href="#" onclick="showPage('about'); return false;">About</a>
                <a href="#" onclick="showPage('contact'); return false;">Contact</a>
                <a href="#" onclick="showPage('settings'); return false;">Settings</a>
            </div>
        </div>
    </footer>

    <script data-cfasync="false" src="/cdn-cgi/scripts/5c5dd728/cloudflare-static/email-decode.min.js"></script><script>
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

// ==================== POST-ARTICLES CODE ====================

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
            'ukrainian-alphabet',
            'bulgarian-alphabet',
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
            'how-to-type-cyrillic',
            'cyrillic-handwriting',
            'practice-writing-cyrillic',
            'cyrillic-alphabet-chart',
            'cyrillic-vs-latin',
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
