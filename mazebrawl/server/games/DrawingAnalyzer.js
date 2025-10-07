const { createCanvas, loadImage } = require('canvas');

// The "brain" of the analyzer. We map prompt words to analytical keywords.
// This can be expanded infinitely to make the logic smarter!
const keywordMap = {
    // ajectives -> Tags
    'Happy': ['mood_positive', 'bright_colors'],
    'Sad': ['mood_negative', 'dark_colors'],
    'Angry': ['mood_negative', 'red', 'dark_colors'],
    'Giant': ['composition_full', 'high_detail'],
    'Tiny': ['composition_small', 'low_fill'],
    'Red': ['color_red'], 'Blue': ['color_blue'], 'Yellow': ['color_yellow'], 'Green': ['color_green'],
    'Burning': ['color_orange', 'color_red', 'bright'],
    'Frozen': ['color_blue', 'color_white', 'dark'],
    'Underwater': ['color_blue', 'color_green'],
    'Flying': ['composition_top_heavy'],
    'Ancient': ['color_brown', 'dark', 'high_detail'],
    'Magic': ['color_purple', 'vibrant_colors'],

    // subjects -> Tags
    'Dragon': ['flying', 'large', 'fantasy', 'fire', 'high_detail'],
    'Sun': ['bright', 'color_yellow', 'color_orange', 'composition_top_heavy'],
    'Moon': ['dark', 'color_white', 'composition_top_heavy'],
    'Ghost': ['color_white', 'flying', 'low_detail'],
    'Robot': ['metallic', 'high_detail'],
    'Tree': ['color_green', 'color_brown', 'composition_bottom_heavy'],
    'Mountain': ['large', 'high_detail', 'composition_bottom_heavy', 'color_gray'],
    'Ocean': ['color_blue', 'large'],

    // actions -> Tags
    'Sleeping': ['low_activity', 'dark'],
    'Running': ['high_activity'],
    'Dancing': ['high_activity', 'vibrant_colors'],
    'Jumping': ['high_activity', 'composition_mid_air'],
    'Climbing': ['composition_vertical'],
};

// color definitions for analysis
const colorDefs = {
    red: [255, 0, 0], yellow: [255, 255, 0], blue: [0, 0, 255],
    green: [0, 128, 0], orange: [255, 165, 0], purple: [128, 0, 128],
    brown: [139, 69, 19], white: [255, 255, 255], gray: [128, 128, 128],
    black: [0,0,0],
};


class DrawingAnalyzer {

    //main public method
    async analyzeDrawing(base64Image, prompt) {
        //prepare for analysis
        const keywords = this._getKeywordsFromPrompt(prompt);
        const image = await loadImage(base64Image);
        const { canvas, ctx } = this._setupCanvas(image);
        const pixelData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // calculate raw metrics from the image
        const metrics = this._calculateImageMetrics(pixelData);

        //score the metrics based on keywords from the prompt
        const { score, feedback, breakdown } = this._scoreMetrics(metrics, keywords);
        
        return { score, feedback, breakdown };
    }

    _setupCanvas(image) {
        const canvas = createCanvas(image.width, image.height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);
        return { canvas, ctx };
    }
    
    _getKeywordsFromPrompt(prompt) {
        const promptWords = prompt.replace(/^A[n]?\s+/i, '').split(' ');
        let keywords = new Set();
        for (const word of promptWords) {
            if (keywordMap[word]) {
                keywordMap[word].forEach(kw => keywords.add(kw));
            }
        }
        console.log(`[Analyzer] Prompt: "${prompt}" -> Keywords:`, Array.from(keywords));
        return Array.from(keywords);
    }
    
    //efficiently calculates all raw data in one pass over the image
    _calculateImageMetrics(imageData) {
        const { data, width, height } = imageData;
        const totalPixels = width * height;
        let brightnessSum = 0;
        let edgeCount = 0;
        let filledPixels = 0;
        let topHeavy = 0;
        let bottomHeavy = 0;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const i = (y * width + x) * 4;
                const r = data[i], g = data[i+1], b = data[i+2];

                // Is pixel not pure white? (adjust tolerance if needed)
                if (r < 250 || g < 250 || b < 250) {
                    filledPixels++;
                    brightnessSum += (0.299 * r + 0.587 * g + 0.114 * b);
                    if (y < height / 2) topHeavy++;
                    if (y > height / 2) bottomHeavy++;
                }

                // Edge detection (detail)
                if (x < width - 1 && y < height - 1) {
                    const rightI = (y * width + (x + 1)) * 4;
                    const downI = ((y + 1) * width + x) * 4;
                    const diffRight = Math.abs(r - data[rightI]) + Math.abs(g - data[rightI+1]) + Math.abs(b - data[rightI+2]);
                    const diffDown = Math.abs(r - data[downI]) + Math.abs(g - data[downI+1]) + Math.abs(b - data[downI+2]);
                    if (diffRight > 100 || diffDown > 100) edgeCount++;
                }
            }
        }

        return {
            fillRatio: filledPixels / totalPixels,
            avgBrightness: filledPixels > 0 ? brightnessSum / filledPixels : 128,
            edgeDensity: edgeCount / totalPixels,
            topHeavyRatio: topHeavy / (filledPixels || 1),
            bottomHeavyRatio: bottomHeavy / (filledPixels || 1),
            pixelData: imageData, // Pass for color analysis
        };
    }

    _scoreMetrics(metrics, keywords) {
        let score = 20; // Base score for submitting something
        let feedback = [];
        let breakdown = {
            base: 20,
            effort: 0,
            detail: 0,
            color: 0,
            composition: 0,
            theme: 0,
        };

        // Score Effort (how much of the canvas was used)
        const effortScore = Math.round(Math.min(metrics.fillRatio * 100, 25));
        score += effortScore;
        breakdown.effort = effortScore;
        if (effortScore > 20) feedback.push("Great effort, you filled the canvas well!");
        if (effortScore < 5) feedback.push("A bit more drawing could really improve the scene.");

        // Score Detail (edge density)
        const detailScore = Math.round(Math.min(metrics.edgeDensity * 500, 20));
        score += detailScore;
        breakdown.detail = detailScore;
        if (keywords.includes('high_detail') && detailScore > 15) {
            score += 10; breakdown.theme += 10;
            feedback.push("Excellent detail work that fits the prompt!");
        } else if (detailScore > 12) {
             feedback.push("Nice and detailed!");
        }

        // Score Composition
        if (keywords.includes('composition_top_heavy') && metrics.topHeavyRatio > 0.6) {
            score += 15; breakdown.composition += 15;
            feedback.push("The composition perfectly suits the 'flying' theme.");
        }
        if (keywords.includes('composition_bottom_heavy') && metrics.bottomHeavyRatio > 0.6) {
            score += 15; breakdown.composition += 15;
            feedback.push("Great composition, keeping the subject grounded.");
        }

        // Score Theme & Color
        let colorMatches = 0;
        for (const kw of keywords) {
            if (kw.startsWith('color_')) {
                const colorName = kw.replace('color_', '');
                if (this._hasColor(metrics.pixelData, colorDefs[colorName])) {
                    colorMatches++;
                }
            }
        }
        if (colorMatches > 0) {
            const colorScore = colorMatches * 10;
            score += colorScore;
            breakdown.color = colorScore;
            feedback.push(`Good use of ${colorMatches} key color(s) from the prompt!`);
        }

        if(keywords.includes('bright') && metrics.avgBrightness > 160){
            score += 10; breakdown.theme += 10;
            feedback.push("The bright tones match the prompt's mood perfectly.");
        }
        if(keywords.includes('dark') && metrics.avgBrightness < 100){
            score += 10; breakdown.theme += 10;
            feedback.push("The dark, moody atmosphere is spot on!");
        }

        // Finalize
        score = Math.min(100, Math.max(0, Math.round(score)));
        if (feedback.length === 0) feedback.push("A solid collaborative effort!");
        
        return { score, feedback: feedback.join(' '), breakdown };
    }

    _hasColor(imageData, targetRgb, threshold = 80, minPercent = 0.02) {
        const { data, width, height } = imageData;
        const totalPixels = width * height;
        let matches = 0;
        const [rT, gT, bT] = targetRgb;

        for (let i = 0; i < data.length; i += 4) {
            const dist = Math.sqrt(
                (data[i] - rT) ** 2 + (data[i + 1] - gT) ** 2 + (data[i + 2] - bT) ** 2
            );
            if (dist < threshold) matches++;
        }
        return (matches / totalPixels) > minPercent;
    }
}

module.exports = DrawingAnalyzer;
