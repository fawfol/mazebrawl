const { createCanvas, loadImage } = require('canvas');

// The "brain" of the analyzer. We map prompt words to analytical keywords.
// This can be expanded infinitely to make the logic smarter!
const keywordMap = {
    // --- Keywords for special logic ---
    'Two': ['count_2'], 
    'Pair of': ['count_2'],
    'Spiky': ['texture_spiky'], 
    'Jagged': ['texture_spiky'],
    'Smooth': ['texture_smooth'], 
    'Round': ['texture_smooth', 'shape_round'],
    'Square': ['shape_square'],
    'Sun': ['bright', 'color_yellow', 'shape_round', 'subject_sun'],
    'Ball': ['shape_round', 'subject_ball'],
    'Ice Cream': ['palette_cool', 'shape_vertical', 'subject_icecream'],

    // --- Adjectives ---
    'Happy': ['mood_positive', 'palette_vibrant', 'bright_colors'],
    'Sad': ['mood_negative', 'palette_muted', 'dark_colors'],
    'Angry': ['mood_negative', 'color_red', 'dark_colors'],
    'Tall': ['shape_vertical'], 
    'Long': ['shape_horizontal'],
    'Short': ['shape_short'],
    'Colorful': ['palette_vibrant'], 
    'Burning': ['palette_warm', 'bright', 'color_orange', 'color_red'],
    'Frozen': ['palette_cool', 'dark'], 
    'Underwater': ['palette_cool', 'color_blue', 'color_green'],
    'Flying': ['composition_top_heavy'],
    'Giant': ['composition_full', 'high_detail'],
    'Tiny': ['composition_small', 'low_fill'],
    'Ancient': ['color_brown', 'dark', 'high_detail'],
    'Magic': ['color_purple', 'vibrant_colors'],
    'Sleepy': ['dark', 'low_activity'],
    'Excited': ['palette_vibrant', 'high_activity'],
    'Brave': ['high_detail'],
    'Striped': ['texture_striped'],
    'Spotted': ['texture_spotted'],
    'Floating': ['composition_mid_air'],
    'Electric': ['color_yellow', 'bright_colors', 'texture_spiky'],
    'Shadowy': ['dark', 'color_black'],
    'Red': ['color_red'], 'Blue': ['color_blue'], 'Yellow': ['color_yellow'], 'Green': ['color_green'],

    // --- Subjects: Animals & Fantasy ---
    'Cat': ['low_detail', 'shape_horizontal'],
    'Dog': ['low_detail', 'shape_horizontal'],
    'Fish': ['palette_cool', 'shape_horizontal'],
    'Bird': ['flying', 'composition_top_heavy', 'low_detail'],
    'Lion': ['color_yellow', 'color_brown', 'high_detail'],
    'Elephant': ['large', 'color_gray', 'texture_smooth'],
    'Frog': ['color_green', 'low_detail'],
    'Panda': ['color_black', 'color_white', 'shape_round'],
    'Monkey': ['color_brown', 'high_activity'],
    'Tiger': ['color_orange', 'color_black', 'high_detail'],
    'Rabbit': ['color_white', 'low_detail'],
    'Bear': ['color_brown', 'large'],
    'Fox': ['color_orange', 'shape_horizontal'],
    'Horse': ['color_brown', 'large'],
    'Penguin': ['color_black', 'color_white', 'shape_vertical'],
    'Giraffe': ['shape_vertical', 'color_yellow', 'large'],
    'Snake': ['shape_horizontal', 'color_green'],
    'Turtle': ['shape_round', 'color_green'],
    'Butterfly': ['flying', 'palette_vibrant'],
    'Dragon': ['flying', 'large', 'fantasy', 'fire', 'high_detail'],
    'Unicorn': ['fantasy', 'color_white', 'high_detail'],
    'Mermaid': ['fantasy', 'color_blue', 'shape_vertical'],
    'Fairy': ['flying', 'low_detail', 'magic'],
    'Zombie': ['color_green', 'dark', 'low_detail'],

    // --- Subjects: People & Roles ---
    'Wizard': ['high_detail', 'color_purple', 'magic'],
    'Knight': ['high_detail', 'metallic', 'shape_vertical'],
    'Pirate': ['high_detail', 'color_brown', 'subject_pirate'],
    'Ninja': ['dark', 'color_black', 'low_detail'],
    'Astronaut': ['high_detail', 'color_white', 'composition_mid_air'],
    'Chef': ['color_white', 'low_detail'],
    'Robot': ['metallic', 'high_detail'],
    'Ghost': ['color_white', 'flying', 'low_detail'],
    'Alien': ['color_green', 'shape_vertical', 'subject_alien'],
    'Clown': ['palette_vibrant', 'shape_round'],
    'Superhero': ['flying', 'high_detail'],
    'King': ['high_detail', 'color_purple', 'color_yellow'],
    'Queen': ['high_detail', 'color_purple', 'color_yellow'],
    'Scientist': ['high_detail', 'color_white'],

    // --- Subjects: Objects, Food, & Structures ---
    'Pizza': ['shape_round', 'color_red', 'color_yellow'],
    'Burger': ['shape_round', 'color_brown'],
    'Cake': ['shape_round', 'palette_vibrant'],
    'Apple': ['shape_round', 'color_red'],
    'Banana': ['shape_horizontal', 'color_yellow'],
    'Cookie': ['shape_round', 'color_brown', 'low_detail'],
    'Donut': ['shape_round', 'palette_vibrant'],
    'Bicycle': ['high_detail', 'metallic'],
    'Rocket': ['shape_vertical', 'fire', 'flying', 'high_detail'],
    'Train': ['shape_horizontal', 'metallic', 'high_detail'],
    'Airplane': ['flying', 'metallic', 'shape_horizontal'],
    'Helicopter': ['flying', 'metallic', 'high_detail'],
    'Submarine': ['underwater', 'metallic', 'shape_horizontal'],
    'Castle': ['high_detail', 'color_gray', 'composition_bottom_heavy'],
    'Bridge': ['shape_horizontal', 'composition_bottom_heavy'],
    'Lighthouse': ['shape_vertical', 'bright', 'composition_bottom_heavy'],
    'Pyramid': ['shape_vertical', 'color_yellow', 'ancient'],
    'Tent': ['shape_vertical', 'low_detail'],
    'Hat': ['composition_top_heavy', 'low_detail'],
    'Shoes': ['composition_bottom_heavy', 'low_detail'],
    'Crown': ['color_yellow', 'metallic', 'texture_spiky'],
    'Glasses': ['low_detail', 'metallic'],
    'Ring': ['shape_round', 'metallic'],
    'Hammer': ['metallic', 'low_detail'],
    'Sword': ['metallic', 'shape_vertical', 'texture_spiky'],
    'Shield': ['shape_round', 'metallic'],
    'Piano': ['color_black', 'color_white', 'shape_horizontal', 'high_detail'],
    'Drum': ['shape_round', 'low_detail'],
    'Bomb': ['shape_round', 'color_black', 'dark'],
    'Car': ['shape_horizontal', 'metallic'],
    'Boat': ['shape_horizontal', 'composition_bottom_heavy'],
    'House': ['composition_bottom_heavy', 'texture_smooth'],
    'Book': ['texture_smooth', 'low_detail'],
    'Computer': ['texture_smooth', 'high_detail'],
    'Guitar': ['shape_vertical', 'high_detail'],
    'Clock': ['shape_round', 'high_detail'],
    'Key': ['metallic', 'low_detail'],
    'Umbrella': ['shape_round', 'low_detail'],
    'Candle': ['shape_vertical', 'fire', 'bright'],
    'Camera': ['shape_square', 'low_detail'],
    'Island': ['composition_bottom_heavy', 'color_green', 'color_brown'],
    'Snowman': ['shape_round', 'color_white', 'count_2'],
    'Leaf': ['color_green', 'low_detail'],

    // --- Subjects: Nature ---
    'Fire': ['bright', 'color_orange', 'color_red', 'palette_warm'],
    'Moon': ['dark', 'color_white', 'composition_top_heavy'],
    'Tree': ['color_green', 'color_brown', 'composition_bottom_heavy', 'shape_vertical'],
    'Mountain': ['large', 'high_detail', 'composition_bottom_heavy', 'color_gray'],
    'Ocean': ['color_blue', 'large'],
    'Flower': ['palette_vibrant', 'color_green'],
    'Cloud': ['color_white', 'texture_smooth', 'composition_top_heavy'],
    'Star': ['texture_spiky', 'color_yellow', 'bright'],
    'River': ['color_blue', 'shape_horizontal'],
    'Volcano': ['color_red', 'color_brown', 'mountain'],
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
    async analyzeDrawing(base64Image, prompt, difficulty = 'hard') {

        //prepare for analysis
        const keywords = this._getKeywordsFromPrompt(prompt);
        const image = await loadImage(base64Image);
        const { canvas, ctx } = this._setupCanvas(image);
        const pixelData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // calculate raw metrics from the image
        const metrics = this._calculateImageMetrics(pixelData);

        //score the metrics based on keywords from the prompt
        const { score, feedback, breakdown } = this._scoreMetrics(metrics, keywords, difficulty);
        
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
	
    _scoreMetrics(metrics, keywords, difficulty) {
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

		// --- Finalize Score based on Difficulty ---
		let rawScore = Object.values(breakdown).reduce((a, b) => a + b, 0);

		const difficultyModifiers = {
			easy: 3,
			hard: 2,      
			difficult: 1.5, 
			pro: 1        
		};

		// Look up the modifier, defaulting to 1.0 if not found
		const modifier = difficultyModifiers[difficulty.toLowerCase()] || 1.0;
		let finalScore = rawScore * modifier;

		// Ensure the score stays within a reasonable range (e.g., 20-100)
		finalScore = Math.min(100, Math.max(20, Math.round(finalScore)));

		if (feedback.length === 0) feedback.push("A solid collaborative effort!");

		return { score: finalScore, feedback: feedback.join(' '), breakdown };
	}
}

module.exports = DrawingAnalyzer;
