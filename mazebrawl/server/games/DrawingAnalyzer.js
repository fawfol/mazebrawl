const { createCanvas, loadImage } = require('canvas');

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

    // --- Adjectives (Expanded) ---
    'Happy': ['mood_positive', 'palette_vibrant'],
    'Sad': ['mood_negative', 'palette_muted', 'dark_colors'],
    'Angry': ['mood_negative', 'color_red', 'dark_colors'],
    'Excited': ['mood_positive', 'palette_vibrant', 'high_activity'],
    'Lonely': ['mood_negative', 'palette_muted', 'low_fill'],
    'Curious': ['high_detail'],
    'Peaceful': ['mood_positive', 'palette_cool', 'texture_smooth', 'low_activity'],
    'Scared': ['mood_negative', 'dark', 'texture_spiky'],
    'Brave': ['high_detail', 'composition_full'],
    'Nervous': ['texture_spiky', 'high_activity'],
    'Sleepy': ['dark', 'low_activity', 'shape_horizontal'],
    'Surprised': ['shape_round', 'high_detail'],
    'Proud': ['mood_positive', 'composition_full'],
    'Shy': ['low_fill', 'composition_small'],
    'Playful': ['palette_vibrant', 'high_activity'],
    'Serious': ['dark_colors', 'shape_square'],
    'Calm': ['palette_cool', 'texture_smooth', 'low_activity'],
    'Cheerful': ['mood_positive', 'palette_vibrant', 'color_yellow'],
    'Bored': ['low_activity', 'palette_muted'],
    'Confused': ['high_detail', 'texture_spiky'],
    'Energetic': ['palette_vibrant', 'high_activity'],
    'Giant': ['composition_full', 'high_detail'],
    'Tiny': ['composition_small', 'low_fill'],
    'Tall': ['shape_vertical'],
    'Short': ['shape_short'],
    'Thin': ['shape_vertical'], // Assuming tall-thin
    'Fat': ['shape_round'],
    'Fluffy': ['texture_fluffy', 'shape_round'],
    'Fuzzy': ['texture_fluffy'],
    'Glowing': ['bright', 'palette_vibrant'],
    'Shiny': ['bright'],
    'Rusty': ['color_brown', 'color_orange'],
    'Colorful': ['palette_vibrant'],
    'Pale': ['palette_muted', 'bright'],
    'Bright': ['bright'],
    'Dark': ['dark'],
    'Striped': ['texture_striped'],
    'Spotted': ['texture_spotted'],
    'Metallic': ['metallic', 'color_gray', 'bright'],
    'Golden': ['color_yellow', 'metallic', 'bright'],
    'Silver': ['color_gray', 'metallic', 'bright'],
    'Wooden': ['color_brown', 'texture_striped'],
    'Ancient': ['color_brown', 'dark', 'high_detail'],
    'Frozen': ['palette_cool', 'dark', 'color_blue'],
    'Burning': ['palette_warm', 'bright', 'color_orange', 'color_red'],
    'Dreamy': ['palette_cool', 'color_purple', 'texture_smooth'],
    'Magic': ['color_purple', 'palette_vibrant', 'bright'],
    'Flying': ['composition_top_heavy', 'composition_mid_air'],
    'Invisible': ['low_fill'],
    'Floating': ['composition_mid_air'],
    'Underwater': ['palette_cool', 'color_blue', 'color_green'],
    'Electric': ['color_yellow', 'bright', 'texture_spiky'],
    'Rainbow': ['palette_vibrant'],
    'Shadowy': ['dark', 'color_black'],
    'Red': ['color_red'], 'Blue': ['color_blue'], 'Yellow': ['color_yellow'], 'Green': ['color_green'], 'Purple': ['color_purple'], 'Orange': ['color_orange'],

    // --- Subjects: Animals & Fantasy (Expanded) ---
    'Cat': ['low_detail', 'shape_horizontal'],
    'Dog': ['low_detail', 'shape_horizontal'],
    'Fish': ['palette_cool', 'shape_horizontal'],
    'Bird': ['flying', 'composition_top_heavy', 'low_detail'],
    'Lion': ['color_yellow', 'color_brown', 'high_detail'],
    'Elephant': ['large', 'color_gray', 'texture_smooth', 'shape_round'],
    'Tiger': ['color_orange', 'color_black', 'high_detail', 'texture_striped'],
    'Monkey': ['color_brown', 'high_activity'],
    'Rabbit': ['color_white', 'low_detail'],
    'Bear': ['color_brown', 'large', 'shape_round'],
    'Fox': ['color_orange', 'shape_horizontal'],
    'Panda': ['color_black', 'color_white', 'shape_round'],
    'Horse': ['color_brown', 'large', 'shape_vertical'],
    'Frog': ['color_green', 'low_detail', 'shape_round'],
    'Penguin': ['color_black', 'color_white', 'shape_vertical'],
    'Dolphin': ['palette_cool', 'color_blue', 'color_gray', 'shape_horizontal', 'texture_smooth'],
    'Giraffe': ['shape_vertical', 'color_yellow', 'large', 'texture_spotted'],
    'Sheep': ['color_white', 'texture_fluffy', 'shape_horizontal'],
    'Chicken': ['color_white', 'color_red', 'shape_vertical', 'low_detail'],
    'Pig': ['shape_round', 'shape_horizontal', 'low_detail'],
    'Duck': ['color_yellow', 'shape_horizontal', 'low_detail'],
    'Bee': ['color_yellow', 'color_black', 'flying', 'low_detail', 'texture_striped'],
    'Butterfly': ['flying', 'palette_vibrant', 'low_detail'],
    'Snake': ['shape_horizontal', 'color_green', 'texture_smooth'],
    'Turtle': ['shape_round', 'color_green', 'low_activity'],
    'Dragon': ['flying', 'large', 'fantasy', 'fire', 'high_detail', 'texture_spiky'],
    'Unicorn': ['fantasy', 'color_white', 'high_detail'],
    'Mermaid': ['fantasy', 'color_blue', 'shape_vertical'],
    'Fairy': ['flying', 'low_detail', 'magic'],
    'Zombie': ['color_green', 'dark', 'low_detail', 'low_activity'],
    'Monster': ['large', 'dark', 'texture_spiky', 'high_detail'],

    // --- Subjects: People & Roles (Expanded) ---
    'Wizard': ['high_detail', 'color_purple', 'magic', 'shape_vertical'],
    'Knight': ['high_detail', 'metallic', 'shape_vertical'],
    'Pirate': ['high_detail', 'color_brown', 'subject_pirate'],
    'Ninja': ['dark', 'color_black', 'low_detail', 'high_activity'],
    'Astronaut': ['high_detail', 'color_white', 'composition_mid_air', 'shape_round'],
    'Chef': ['color_white', 'low_detail', 'shape_vertical'],
    'Doctor': ['color_white', 'high_detail', 'shape_vertical'],
    'Farmer': ['color_green', 'color_brown', 'low_detail', 'composition_bottom_heavy'],
    'Teacher': ['high_detail', 'shape_vertical'],
    'Artist': ['palette_vibrant', 'high_detail'],
    'Detective': ['color_brown', 'dark', 'high_detail'],
    'Soldier': ['color_green', 'shape_vertical', 'high_detail'],
    'Robot': ['metallic', 'high_detail', 'shape_square'],
    'Alien': ['color_green', 'shape_vertical', 'subject_alien', 'shape_round'],
    'Ghost': ['color_white', 'flying', 'low_detail', 'texture_smooth'],
    'Clown': ['palette_vibrant', 'shape_round', 'mood_positive'],
    'Superhero': ['flying', 'high_detail', 'palette_vibrant'],
    'Ballerina': ['shape_vertical', 'low_detail'],
    'Magician': ['color_black', 'magic', 'high_detail'],
    'Explorer': ['color_brown', 'high_detail', 'composition_full'],
    'King': ['high_detail', 'color_purple', 'color_yellow'],
    'Queen': ['high_detail', 'color_purple', 'color_yellow'],
    'Thief': ['dark', 'color_black', 'low_detail'],
    'Scientist': ['high_detail', 'color_white'],

    // --- Subjects: Objects, Food, & Structures ---
    'Car': ['shape_horizontal', 'metallic'],
    'Bicycle': ['high_detail', 'metallic'],
    'Rocket': ['shape_vertical', 'fire', 'flying', 'high_detail'],
    'Train': ['shape_horizontal', 'metallic', 'high_detail'],
    'Boat': ['shape_horizontal', 'composition_bottom_heavy'],
    'Airplane': ['flying', 'metallic', 'shape_horizontal'],
    'Umbrella': ['shape_round', 'low_detail'],
    'Clock': ['shape_round', 'high_detail'],
    'Candle': ['shape_vertical', 'fire', 'bright'],
    'Book': ['texture_smooth', 'low_detail', 'shape_square'],
    'Computer': ['texture_smooth', 'high_detail', 'shape_square'],
    'Camera': ['shape_square', 'low_detail'],
    'Telephone': ['high_detail'],
    'Guitar': ['shape_vertical', 'high_detail'],
    'Piano': ['color_black', 'color_white', 'shape_horizontal', 'high_detail'],
    'Drum': ['shape_round', 'low_detail'],
    'Balloon': ['shape_round', 'flying', 'palette_vibrant'],
    'Pizza': ['shape_round', 'color_red', 'color_yellow'],
    'Burger': ['shape_round', 'color_brown'],
    'Cake': ['shape_round', 'palette_vibrant'],
    'Donut': ['shape_round', 'palette_vibrant'],
    'Cookie': ['shape_round', 'color_brown', 'low_detail'],
    'Tree': ['color_green', 'color_brown', 'composition_bottom_heavy', 'shape_vertical'],
    'Flower': ['palette_vibrant', 'color_green', 'shape_round'],
    'Mountain': ['large', 'high_detail', 'composition_bottom_heavy', 'color_gray', 'texture_spiky'],
    'Cloud': ['color_white', 'texture_smooth', 'composition_top_heavy'],
    'Star': ['texture_spiky', 'color_yellow', 'bright'],
    'Moon': ['dark', 'color_white', 'composition_top_heavy', 'shape_round'],
    'Volcano': ['color_red', 'color_brown', 'mountain', 'fire'],
    'River': ['color_blue', 'shape_horizontal'],
    'Ocean': ['color_blue', 'large', 'shape_horizontal'],
    'Island': ['composition_bottom_heavy', 'color_green', 'color_brown'],
    'Snowman': ['shape_round', 'color_white', 'count_2'],
    'Fire': ['bright', 'color_orange', 'color_red', 'palette_warm'],
    'Leaf': ['color_green', 'low_detail'],
    'Castle': ['high_detail', 'color_gray', 'composition_bottom_heavy'],

    // --- Actions (NEW & CRITICAL) ---
    'Sleeping': ['low_activity', 'shape_horizontal'],
    'Eating': ['high_activity'],
    'Running': ['high_activity'],
    'Jumping': ['high_activity', 'composition_mid_air'],
    'Dancing': ['high_activity', 'palette_vibrant'],
    'Singing': ['high_activity', 'mood_positive'],
    'Reading': ['low_activity', 'high_detail'],
    'Writing': ['low_activity', 'high_detail'],
    'Drawing': ['low_activity', 'high_detail', 'palette_vibrant'],
    'Laughing': ['mood_positive', 'high_activity'],
    'Crying': ['mood_negative', 'color_blue'],
    'Smiling': ['mood_positive'],
    'Thinking': ['low_activity'],
    'Walking': ['high_activity', 'shape_vertical'],
    'Swimming': ['palette_cool', 'color_blue', 'shape_horizontal', 'high_activity'],
    'Climbing': ['shape_vertical', 'high_activity'],
    'Riding a bike': ['high_activity', 'high_detail', 'metallic'],
    'Building a robot': ['high_detail', 'metallic', 'high_activity', 'shape_square'],
    'Casting a spell': ['magic', 'bright', 'palette_vibrant'],
    'Celebrating': ['mood_positive', 'palette_vibrant', 'high_activity'],
    // -- Personality Adjectives --
    'Grumpy': ['mood_negative', 'dark_colors', 'texture_spiky'],
    'Polite': ['texture_smooth', 'low_activity'],
    'Loud': ['palette_vibrant', 'high_activity', 'composition_full'],
    'Quiet': ['palette_muted', 'low_activity', 'low_fill'],
    'Silly': ['palette_vibrant', 'high_activity', 'shape_round'],
    'Greedy': ['composition_full', 'high_detail'],
    'Kind': ['mood_positive', 'texture_smooth', 'shape_round'],
    'Bold': ['palette_vibrant', 'composition_full'],
    'Wild': ['high_activity', 'texture_spiky', 'composition_full'],

    // -- Compound & Special Subjects --
    'Robot Cat': ['metallic', 'shape_horizontal', 'high_detail'],
    'Talking Fish': ['palette_cool', 'shape_horizontal', 'high_activity'],
    'Time Traveler': ['high_detail', 'metallic', 'bright', 'magic'],
    'Giant Snail': ['large', 'shape_round', 'low_activity', 'color_brown'],
    'Baby Dinosaur': ['low_detail', 'shape_round', 'color_green'],

    // -- Creative & Specific Actions --
    'Gardening': ['low_activity', 'composition_bottom_heavy', 'color_green', 'palette_vibrant'],
    'Meditating': ['low_activity', 'shape_round'],
    'Making origami': ['low_activity', 'high_detail', 'shape_square'],
    'Juggling': ['high_activity', 'shape_round', 'count_3'],
    'Sneezing': ['high_activity'],
    'Spinning around': ['high_activity', 'shape_round'],
    'Blowing bubbles': ['shape_round', 'palette_vibrant', 'flying'],
    'Building a sandcastle': ['composition_bottom_heavy', 'color_yellow', 'high_detail'],
    'Painting the sky': ['palette_vibrant', 'composition_top_heavy', 'high_activity'],
    'Sitting on the moon': ['low_activity', 'composition_top_heavy', 'shape_round', 'dark'],
    'Chasing stars': ['high_activity', 'composition_full', 'bright', 'dark'],
    'Exploring a volcano': ['high_activity', 'fire', 'mountain', 'color_red'],
    'Hugging': ['low_activity', 'shape_round'],
    'Fighting': ['high_activity', 'texture_spiky'],
    'Racing': ['high_activity', 'shape_horizontal'],
    'Sharing food': ['low_activity', 'mood_positive'],
    
    // -- Final Adjectives & Traits --
    'Friendly': ['mood_positive', 'shape_round', 'texture_smooth'],
    'Clever': ['high_detail', 'bright'],
    'Clumsy': ['texture_spiky', 'low_detail', 'high_activity'],
    'Gentle': ['texture_smooth', 'low_activity', 'palette_cool'],
    'Smart': ['high_detail', 'low_activity'],

    // -- Remaining Objects & Items --
    'Sandwich': ['shape_square', 'color_brown', 'color_green', 'low_detail'],
    'Shield': ['shape_round', 'metallic', 'high_detail'],
    'Sword': ['metallic', 'shape_vertical', 'texture_spiky'],
    'Hammer': ['metallic', 'low_detail'],
    'Key': ['metallic', 'low_detail', 'high_detail'],
    'Tent': ['shape_vertical', 'low_detail', 'composition_bottom_heavy'],

    // -- Complex & Duo Actions --
    'Arguing': ['high_activity', 'mood_negative', 'texture_spiky'],
    'Helping': ['mood_positive', 'low_activity'],
    'Teaching': ['high_detail', 'low_activity'],
    'Chasing': ['high_activity'],
    'Playing catch': ['high_activity', 'shape_round'],
    'Dancing together': ['high_activity', 'palette_vibrant', 'mood_positive'],
    'Running away': ['high_activity', 'mood_negative'],
    'Tickling someone': ['high_activity', 'mood_positive'],
    'Eating noodles': ['high_activity', 'shape_horizontal'],
    'Wearing funny glasses': ['high_detail', 'shape_round'],
    // -- Final Personality Traits --
    'Sneaky': ['dark', 'low_fill', 'low_activity', 'shape_horizontal'],
    'Funny': ['mood_positive', 'palette_vibrant', 'shape_round', 'high_activity'],
    'Lazy': ['low_activity', 'palette_muted', 'shape_horizontal'],

    // -- Everyday Actions & Hobbies --
    'Watching TV': ['low_activity', 'shape_square', 'bright'],
    'Cooking': ['high_activity', 'fire', 'palette_warm'],
    'Playing': ['high_activity', 'mood_positive'],
    'Listening to music': ['high_activity', 'mood_positive', 'palette_vibrant'],
    'Cleaning': ['high_activity', 'texture_smooth'],
    'Fishing': ['low_activity', 'shape_horizontal', 'color_blue'],
    'Camping': ['low_activity', 'composition_bottom_heavy', 'fire', 'color_green'],
    'Hiking': ['high_activity', 'composition_bottom_heavy', 'shape_vertical'],
    'Surfing': ['high_activity', 'color_blue', 'shape_horizontal'],
    'Skiing': ['high_activity', 'color_white', 'shape_vertical'],
    'Taking a photo': ['low_activity', 'shape_square', 'high_detail'],
    'Playing the piano': ['low_activity', 'high_detail', 'color_black', 'color_white'],

    // -- Final Item --
    'Cupcake': ['shape_round', 'palette_vibrant', 'low_detail']
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
    let breakdown = { base: 20, effort: 0, color: 0, theme: 0, synergy: 0, texture: 0, count: 0, concept: 0 };

    // --- effort scoring ---
    const effortScore = Math.round(Math.min(metrics.fillRatio * 80, 20));
    score += effortScore;
    breakdown.effort = effortScore;
    if (effortScore > 15) feedback.push("Great effort filling the canvas!");

    // ---color and theme Scoring ---
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

    // --- concept, mood nd activty scoring ---
    if (keywords.includes('mood_positive') && metrics.avgBrightness > 150) {
        score += 15; breakdown.concept += 15;
        feedback.push("The drawing's bright and cheerful palette is a great fit!");
    }
    if (keywords.includes('mood_negative') && metrics.avgBrightness < 110) {
        score += 15; breakdown.concept += 15;
        feedback.push("The somber color scheme really captures the mood.");
    }
    if (keywords.includes('high_activity') && metrics.blobs.length > 4) {
        score += 15; breakdown.concept += 15;
        feedback.push("The drawing has a great sense of action and energy!");
    }
    if (keywords.includes('low_activity') && metrics.blobs.length <= 2) {
        score += 15; breakdown.concept += 15;
        feedback.push("The calm, simple composition fits the theme well.");
    }

    // --- object count scoring ---
    if (keywords.includes('count_2') && metrics.blobs.length === 2) {
        score += 20; breakdown.count += 20;
        feedback.push("Excellent work drawing exactly two objects!");
    } else if (keywords.includes('count_2') && metrics.blobs.length !== 2) {
        feedback.push("The number of objects doesn't seem to match the prompt.");
    }

    // --- texture shape scoring (analyzing the largest blob) ---
    let shapeMatched = false;
    if (metrics.blobs.length > 0) {
        const mainBlob = metrics.blobs.sort((a,b) => b.area - a.area)[0];
        const complexityRatio = mainBlob.perimeter ** 2 / mainBlob.area;

        if (keywords.includes('texture_spiky') && complexityRatio > 50) {
            score += 15; breakdown.texture += 15;
            feedback.push("The spiky texture of the drawing is perfect!");
        }
        if (keywords.includes('texture_smooth') && complexityRatio < 25) {
            score += 15; breakdown.texture += 15;
            feedback.push("The smooth outline of the drawing fits the prompt well.");
            shapeMatched = true;
        }
        // logic for 'fluffy' texture.
        if (keywords.includes('texture_fluffy') && complexityRatio >= 25 && complexityRatio <= 50) {
            score += 15; breakdown.texture += 15;
            feedback.push("The bumpy, fluffy texture is a great interpretation!");
        }
    }

    // --- synergistic Scoring ---
    if (keywords.includes('subject_sun') && shapeMatched && colorMatched) {
        score += 15; breakdown.synergy += 15;
        feedback.push("Synergy bonus! You perfectly captured the sun's shape and color.");
    }
    if (keywords.includes('subject_ball') && shapeMatched && colorMatched) {
        score += 15; breakdown.synergy += 15;
        feedback.push("Synergy bonus! The ball's shape and color are spot on.");
    }

    // --- finalize score based on difficulty ---
    let rawScore = Object.values(breakdown).reduce((a, b) => a + b, 0);

    const difficultyModifiers = {
        easy: 3.1,
        hard: 3,      
        difficult: 3, 
        pro: 3 
    };

    const modifier = difficultyModifiers[difficulty.toLowerCase()] || 1.0;
    let finalScore = rawScore * modifier;

    finalScore = Math.min(100, Math.max(20, Math.round(finalScore)));

    if (feedback.length === 0) feedback.push("A solid collaborative effort!");

    return { score: finalScore, feedback: feedback.join(' '), breakdown };
}
}

module.exports = DrawingAnalyzer;
