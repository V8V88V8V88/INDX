#!/bin/bash
# Download state-level GeoJSONs with district boundaries

BASE_URL="https://raw.githubusercontent.com/udit-001/india-maps-data/main/geojson/states"
OUT_DIR="public/geo/states"

declare -A states=(
  ["AN"]="andaman-and-nicobar-islands"
  ["AP"]="andhra-pradesh"
  ["AR"]="arunachal-pradesh"
  ["AS"]="assam"
  ["BR"]="bihar"
  ["CH"]="chandigarh"
  ["CG"]="chhattisgarh"
  ["DL"]="delhi"
  ["DD"]="dnh-and-dd"
  ["GA"]="goa"
  ["GJ"]="gujarat"
  ["HR"]="haryana"
  ["HP"]="himachal-pradesh"
  ["JK"]="jammu-and-kashmir"
  ["JH"]="jharkhand"
  ["KA"]="karnataka"
  ["KL"]="kerala"
  ["LA"]="ladakh"
  ["LD"]="lakshadweep"
  ["MP"]="madhya-pradesh"
  ["MH"]="maharashtra"
  ["MN"]="manipur"
  ["ML"]="meghalaya"
  ["MZ"]="mizoram"
  ["NL"]="nagaland"
  ["OR"]="odisha"
  ["PB"]="punjab"
  ["PY"]="puducherry"
  ["RJ"]="rajasthan"
  ["SK"]="sikkim"
  ["TN"]="tamil-nadu"
  ["TG"]="telangana"
  ["TR"]="tripura"
  ["UP"]="uttar-pradesh"
  ["UK"]="uttarakhand"
  ["WB"]="west-bengal"
)

mkdir -p "$OUT_DIR"

for code in "${!states[@]}"; do
  name="${states[$code]}"
  url="$BASE_URL/$name.geojson"
  output="$OUT_DIR/$code.json"
  echo "Downloading $code ($name)..."
  curl -sL "$url" -o "$output"
  size=$(stat -f%z "$output" 2>/dev/null || stat -c%s "$output" 2>/dev/null)
  if [ "$size" -lt 100 ]; then
    echo "  WARNING: File too small ($size bytes), may be 404"
  else
    echo "  OK: $size bytes"
  fi
done

echo "Done!"


