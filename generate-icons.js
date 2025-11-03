const { createCanvas } = require('canvas');
const fs = require('fs');

function generateIcon(size, filename) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = '#4285f4';
    ctx.fillRect(0, 0, size, size);
    
    // Text
    ctx.fillStyle = 'white';
    ctx.font = `bold ${size * 0.4}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('DLP', size / 2, size / 2);
    
    // Save
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(filename, buffer);
    console.log(`Created ${filename}`);
}

// Create icons folder
if (!fs.existsSync('icons')) {
    fs.mkdirSync('icons');
}

// Generate icons
generateIcon(128, 'icons/icon128.png');
generateIcon(48, 'icons/icon48.png');
generateIcon(16, 'icons/icon16.png');

console.log('Icons generated successfully!');
