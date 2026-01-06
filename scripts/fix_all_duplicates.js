const fs = require('fs');
const path = require('path');

const indiaTsPath = path.join(process.cwd(), 'src/data/india.ts');
let indiaTsContent = fs.readFileSync(indiaTsPath, 'utf8');

const districtsDir = path.join(process.cwd(), 'public/data/districts');
const districtFiles = fs.readdirSync(districtsDir).filter(f => f.endsWith('.json'));

const districtNames = new Set();
districtFiles.forEach(file => {
    try {
        const districts = JSON.parse(fs.readFileSync(path.join(districtsDir, file), 'utf8'));
        districts.forEach(d => districtNames.add(d.name.toLowerCase().trim()));
    } catch (e) { }
});

console.log(`Loaded ${districtNames.size} district names.`);

// Regex matches lines like: { id: "...", name: "Name", ... },
// We capture the Name group.
const cityRowRegex = /^\s*\{\s*id:\s*"[^"]+",\s*name:\s*"([^"]+)",/gm;

let match;
const citiesToRemove = [];

while ((match = cityRowRegex.exec(indiaTsContent)) !== null) {
    const cityName = match[1];
    if (districtNames.has(cityName.toLowerCase().trim())) {
        citiesToRemove.push(cityName);
    }
}

console.log(`Found ${citiesToRemove.length} cities to remove (duplicates of districts):`);
console.log(citiesToRemove);

// Now perform the removal
let newContent = indiaTsContent;
let removedCount = 0;

citiesToRemove.forEach(city => {
    // Construct a specific regex for this line to identify and remove it
    // We look for the line containing `name: "CityName",`
    const lineRegex = new RegExp(`^\\s*\\{ id: "[^"]+", name: "${city}",.*$`, 'm');

    // We can also just filter the array lines if parsing is tricky, but regex replacement of the line is safer for preserving structure if unique.
    // However, JS regex 'm' flag affects ^ and $.
    // Let's try replacing the specific string occurrence.

    // Better strategy: Split by newline, filter lines.
});

const lines = indiaTsContent.split('\n');
const filteredLines = lines.filter(line => {
    // Check if line is a city definition
    if (line.trim().startsWith('{') && line.includes('name: "')) {
        const nameMatch = /name:\s*"([^"]+)"/.exec(line);
        if (nameMatch && citiesToRemove.includes(nameMatch[1])) {
            // It is a duplicate
            return false;
        }
    }
    return true;
});

if (lines.length !== filteredLines.length) {
    console.log(`Removed ${lines.length - filteredLines.length} lines.`);
    fs.writeFileSync(indiaTsPath, filteredLines.join('\n'));
    console.log('Updated india.ts');
} else {
    console.log('No lines removed.');
}
