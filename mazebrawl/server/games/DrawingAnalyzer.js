const { createCanvas, loadImage } = require('canvas');

// The "brain" of the analyzer. We map prompt words to analytical keywords.
// This can be expanded infinitely to make the logic smarter!
const keywordMap = {
    // Keywords for counting
    'Two': ['count_2'], 'Pair of': ['count_2'],

    //keywords for texture
    'Spiky': ['texture_spiky'], 'Jagged': ['texture_spiky'],
    'Smooth': ['texture_smooth'], 'Round': ['texture_smooth', 'shape_round'],
    'Cactus': ['texture_spiky', 'shape_vertical'],
    'Star': ['texture_spiky'],

    // Keywords for Synergy
    'Sun': ['bright', 'color_yellow', 'shape_round', 'subject_sun'],
    'Ball': ['shape_round', 'subject_ball'],
    
    // Existing keywords
    'Happy': ['mood_positive', 'palette_vibrant', 'bright_colors'],
    'Sad': ['mood_negative', 'palette_muted', 'dark_colors'],
    'Tall': ['shape_vertical'], 'Long': ['shape_horizontal'],
    'Colorful': ['palette_vibrant'], 'Burning': ['palette_warm', 'bright'],
    'Frozen': ['palette_cool', 'dark'], 'Underwater': ['palette_cool', 'color_blue'],
    'Flying': ['composition_top_heavy'],
    'Angry': ['mood_negative', 'red', 'dark_colors'],
    'Giant': ['composition_full', 'high_detail'],
    'Tiny': ['composition_small', 'low_fill'],
    'Red': ['color_red'], 'Blue': ['color_blue'], 'Yellow': ['color_yellow'], 'Green': ['color_green'],
    'Burning': ['color_orange', 'color_red', 'bright'],
    'Underwater': ['color_blue', 'color_green'],
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
    
    _analyzeBlobs(imageData) {
        const { data, width, height } = imageData;
        const visited = new Array(width * height).fill(false);
        const blobs = [];

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const i = y * width + x;
                // If this pixel is part of the drawing and we haven't visited it yet...
                if (!visited[i] && (data[i*4] < 250 || data[i*4+1] < 250 || data[i*4+2] < 250)) {
                    // ...we've found a new blob!
                    const blob = { area: 0, perimeter: 0, pixels: [] };
                    const queue = [[x, y]];
                    visited[i] = true;

                    while (queue.length > 0) {
                        const [cx, cy] = queue.shift();
                        const ci = cy * width + cx;
                        
                        blob.area++;
                        blob.pixels.push([cx, cy]);

                        // Check neighbors (up, down, left, right)
                        const neighbors = [[cx, cy-1], [cx, cy+1], [cx-1, cy], [cx+1, cy]];
                        let isEdge = false;

                        for (const [nx, ny] of neighbors) {
                            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                                const ni = ny * width + nx;
                                if (!visited[ni] && (data[ni*4] < 250 || data[ni*4+1] < 250 || data[ni*4+2] < 250)) {
                                    visited[ni] = true;
                                    queue.push([nx, ny]);
                                } else if (data[ni*4] >= 250 && data[ni*4+1] >= 250 && data[ni*4+2] >= 250) {
                                    isEdge = true; // This pixel is next to the background
                                }
                            } else {
                                isEdge = true; // This pixel is at the edge of the canvas
                            }
                        }
                        if (isEdge) blob.perimeter++;
                    }
                    blobs.push(blob);
                }
            }
        }
        return blobs;
    }


    
    //efficiently calculates all raw data in one pass over the image
    _calculateImageMetrics(imageData) {
        // This function is now much simpler.
        // It gathers basic stats and calls the blob analyzer.
        const { data, width, height } = imageData;
        let brightnessSum = 0, filledPixels = 0;
        const colorBins = {};

        for (let i = 0; i < data.length; i += 4) {
            if (data[i] < 250 || data[i+1] < 250 || data[i+2] < 250) {
                filledPixels++;
                const r = data[i], g = data[i+1], b = data[i+2];
                brightnessSum += (0.299 * r + 0.587 * g + 0.114 * b);
                const colorKey = this._getClosestColorName(r, g, b);
                colorBins[colorKey] = (colorBins[colorKey] || 0) + 1;
            }
        }

        const sortedColors = Object.entries(colorBins).sort(([,a],[,b]) => b-a).map(([color]) => color);
        
        // Call our new blob analyzer
        const blobs = this._analyzeBlobs(imageData);

        return {
            fillRatio: filledPixels / (width * height),
            avgBrightness: filledPixels > 0 ? brightnessSum / filledPixels : 128,
            dominantColors: sortedColors.slice(0, 3),
            blobs: blobs, // Pass the blob data to the scoring function
        };
    }
	
	_getClosestColorName(r, g, b) {
		let closestColor = 'black';
		let minDistance = Infinity;

		for (const colorName in colorDefs) {
		    const [rT, gT, bT] = colorDefs[colorName];
		    const distance = Math.sqrt((r - rT)**2 + (g - gT)**2 + (b - bT)**2);
		    if (distance < minDistance) {
		        minDistance = distance;
		        closestColor = colorName;
		    }
		}
		return closestColor;
	}
	
    _scoreMetrics(metrics, keywords) {
		let score = 20; 
		let feedback = [];
		// add the new breakdown categories
		let breakdown = { base: 20, effort: 0, color: 0, theme: 0, synergy: 0, texture: 0, count: 0 };

		// --- Effort Scoring ---
		const effortScore = Math.round(Math.min(metrics.fillRatio * 80, 20));
		score += effortScore;
		breakdown.effort = effortScore;
		if (effortScore > 15) feedback.push("Great effort filling the canvas!");

		// --- color & Theme Scoring (using dominantColors) ---
		// This replaces the old _hasColor logic
		let colorMatched = false;
		const colorKeywords = keywords.filter(k => k.startsWith('color_'));
		if (colorKeywords.length > 0) {
		    const requiredColor = colorKeywords[0].replace('color_', '');
		    if (metrics.dominantColors.includes(requiredColor)) {
		        score += 15; breakdown.color += 15;
		        feedback.push(`Excellent use of the color ${requiredColor}!`);
		        colorMatched = true;
		    }
		}
		if (keywords.includes('bright') && metrics.avgBrightness > 160) {
		    score += 10; breakdown.theme += 10;
		    feedback.push("The bright tones match the prompt's mood perfectly.");
		}
		if (keywords.includes('dark') && metrics.avgBrightness < 100) {
		    score += 10; breakdown.theme += 10;
		    feedback.push("The dark, moody atmosphere is spot on!");
		}

		// --- object Count Scoring ---
		if (keywords.includes('count_2') && metrics.blobs.length === 2) {
		    score += 20; breakdown.count += 20;
		    feedback.push("Excellent work drawing exactly two objects!");
		} else if (keywords.includes('count_2') && metrics.blobs.length !== 2) {
		    feedback.push("The number of objects doesn't seem to match the prompt.");
		}

		// --- texture & Shape Scoring (analyzing the largest blob) ---
		let shapeMatched = false;
		if (metrics.blobs.length > 0) {
		    const mainBlob = metrics.blobs.sort((a,b) => b.area - a.area)[0];
		    // perimeter squared / area. A good measure of complexity.
		    const complexityRatio = mainBlob.perimeter ** 2 / mainBlob.area;

		    if (keywords.includes('texture_spiky') && complexityRatio > 50) {
		        score += 15; breakdown.texture += 15;
		        feedback.push("The spiky texture of the drawing is perfect!");
		    }
		    if (keywords.includes('texture_smooth') && complexityRatio < 25) {
		        score += 15; breakdown.texture += 15;
		        feedback.push("The smooth outline of the drawing fits the prompt well.");
		        shapeMatched = true; // Smoothness can imply a good shape
		    }
		}

		// --- Synergistic Scoring ---
		if (keywords.includes('subject_sun') && shapeMatched && colorMatched) {
		    score += 15; breakdown.synergy += 15;
		    feedback.push("Synergy bonus! You perfectly captured the sun's shape and color.");
		}
		if (keywords.includes('subject_ball') && shapeMatched && colorMatched) {
		    score += 15; breakdown.synergy += 15;
		    feedback.push("Synergy bonus! The ball's shape and color are spot on.");
		}

		// --- Finalize ---
		score = Math.min(100, Math.max(0, Math.round(score)));
		if (feedback.length === 0) feedback.push("A solid collaborative effort!");
		
		return { score, feedback: feedback.join(' '), breakdown };
	}
}

module.exports = DrawingAnalyzer;
