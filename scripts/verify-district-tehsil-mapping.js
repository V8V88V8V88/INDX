#!/usr/bin/env node
/**
 * Verification script to check district-tehsil mapping accuracy
 * Compares state GeoJSON districts with sub-district GeoJSON tehsils
 */

const fs = require('fs');
const path = require('path');

const STATE_GEOJSON = path.join(__dirname, '../public/geo/states/UP.json');
const SUBDISTRICT_GEOJSON = path.join(__dirname, '../public/geo/subdistricts/UP.json');

// Official district-tehsil mappings (to be verified against official sources)
const OFFICIAL_MAPPINGS = {
  // Add official mappings here as you verify them
  // Example:
  // "agra": ["Agra", "Etmadpur", "Kiraoli", "Kheragarh", "Fatehabad", "Bah"],
};

function loadJSON(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    console.error(`Error loading ${filePath}:`, error.message);
    return null;
  }
}

function normalizeName(name) {
  return (name || '').toLowerCase().trim();
}

function main() {
  console.log('=== District-Tehsil Mapping Verification ===\n');
  
  const stateData = loadJSON(STATE_GEOJSON);
  const subDistrictData = loadJSON(SUBDISTRICT_GEOJSON);
  
  if (!stateData || !subDistrictData) {
    console.error('Failed to load GeoJSON files');
    process.exit(1);
  }
  
  // Get all districts from state GeoJSON
  const stateDistricts = new Set();
  stateData.features.forEach(f => {
    const district = f.properties?.district?.trim();
    if (district) {
      stateDistricts.add(district);
    }
  });
  
  // Build district -> tehsils map from sub-district GeoJSON
  const districtTehsilMap = new Map();
  subDistrictData.features.forEach(f => {
    const dtname = f.properties?.dtname?.trim();
    const sdtname = f.properties?.sdtname?.trim();
    if (dtname && sdtname) {
      if (!districtTehsilMap.has(dtname)) {
        districtTehsilMap.set(dtname, new Set());
      }
      districtTehsilMap.get(dtname).add(sdtname);
    }
  });
  
  // Check each state district
  console.log('=== District Coverage Check ===\n');
  const issues = [];
  
  stateDistricts.forEach(district => {
    const normalized = normalizeName(district);
    const tehsils = districtTehsilMap.get(district) || new Set();
    
    // Check known mappings
    const mappedName = getMappedName(normalized);
    const mappedTehsils = mappedName ? districtTehsilMap.get(mappedName) || new Set() : new Set();
    
    const totalTehsils = tehsils.size || mappedTehsils.size;
    
    if (totalTehsils === 0) {
      issues.push({
        district,
        type: 'MISSING',
        message: `No tehsils found (searched as: ${district}${mappedName ? ` or ${mappedName}` : ''})`
      });
    } else if (totalTehsils < 2) {
      issues.push({
        district,
        type: 'SUSPICIOUS',
        message: `Very few tehsils (${totalTehsils}) - might be incomplete`
      });
    }
    
    // Check against official mappings if available
    if (OFFICIAL_MAPPINGS[normalized]) {
      const officialTehsils = new Set(OFFICIAL_MAPPINGS[normalized].map(normalizeName));
      const actualTehsils = new Set([...tehsils, ...mappedTehsils].map(normalizeName));
      
      const missing = [...officialTehsils].filter(t => !actualTehsils.has(t));
      const extra = [...actualTehsils].filter(t => !officialTehsils.has(t));
      
      if (missing.length > 0 || extra.length > 0) {
        issues.push({
          district,
          type: 'MISMATCH',
          message: `Tehsil mismatch - Missing: ${missing.join(', ') || 'none'}, Extra: ${extra.join(', ') || 'none'}`
        });
      }
    }
  });
  
  // Report issues
  if (issues.length === 0) {
    console.log('✅ No issues found!\n');
  } else {
    console.log(`⚠️  Found ${issues.length} issues:\n`);
    issues.forEach(issue => {
      console.log(`[${issue.type}] ${issue.district}: ${issue.message}`);
    });
  }
  
  // Check for duplicate tehsil names across districts
  console.log('\n=== Duplicate Tehsil Names Check ===\n');
  const tehsilToDistricts = new Map();
  districtTehsilMap.forEach((tehsils, district) => {
    tehsils.forEach(tehsil => {
      const normalizedTehsil = normalizeName(tehsil);
      if (!tehsilToDistricts.has(normalizedTehsil)) {
        tehsilToDistricts.set(normalizedTehsil, []);
      }
      tehsilToDistricts.get(normalizedTehsil).push(district);
    });
  });
  
  const duplicates = [...tehsilToDistricts.entries()].filter(([_, districts]) => districts.length > 1);
  if (duplicates.length > 0) {
    console.log(`Found ${duplicates.length} tehsils with duplicate names:\n`);
    duplicates.slice(0, 20).forEach(([tehsil, districts]) => {
      console.log(`  "${tehsil}" appears in: ${districts.join(', ')}`);
    });
    if (duplicates.length > 20) {
      console.log(`  ... and ${duplicates.length - 20} more`);
    }
  } else {
    console.log('✅ No duplicate tehsil names found');
  }
  
  console.log('\n=== Summary ===');
  console.log(`Total districts in state GeoJSON: ${stateDistricts.size}`);
  console.log(`Total districts in sub-district GeoJSON: ${districtTehsilMap.size}`);
  console.log(`Total issues found: ${issues.length}`);
}

function getMappedName(districtName) {
  const mappings = {
    "amroha": "jyotiba phule nagar",
    "lakhimpur kheri": "kheri",
    "barabanki": "bara banki",
    "ayodhya": "faizabad",
    "bhadohi": "sant ravidas nagar (bhadohi)",
    "sambhal": "moradabad",
  };
  return mappings[districtName] || null;
}

if (require.main === module) {
  main();
}

module.exports = { main };
