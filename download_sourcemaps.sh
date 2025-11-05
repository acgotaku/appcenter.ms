#!/bin/bash
"""
Script to download source map files for all JavaScript files in the generated/ directory.
"""

# Change to the script directory
cd "$(dirname "$0")"

# Base URL for the source maps
BASE_URL="https://assets.appcenter.ms/generated/"

# Directory containing JS files
GENERATED_DIR="generated"

if [[ ! -d "$GENERATED_DIR" ]]; then
    echo "Directory $GENERATED_DIR not found!"
    exit 1
fi

echo "Finding JavaScript files in $GENERATED_DIR..."

# Counter variables
successful_downloads=0
failed_downloads=0
total_files=0

# Process each JavaScript file
for js_file in "$GENERATED_DIR"/*.js; do
    if [[ -f "$js_file" ]]; then
        total_files=$((total_files + 1))
        filename=$(basename "$js_file")
        echo ""
        echo "Processing: $filename"
        
        # Extract the source map URL from the last line
        sourcemap_url=$(tail -1 "$js_file" | grep -o 'sourceMappingURL=.*' | sed 's/sourceMappingURL=//' | sed 's/%$//')
        
        if [[ -z "$sourcemap_url" ]]; then
            echo "  No source map URL found in $filename"
            continue
        fi
        
        echo "  Found source map URL: $sourcemap_url"
        
        # Check if source map already exists and is valid
        sourcemap_path="$GENERATED_DIR/$sourcemap_url"
        if [[ -f "$sourcemap_path" ]]; then
            # Check if it's a real source map (should start with { and contain "version")
            if head -1 "$sourcemap_path" | grep -q '^{' && grep -q '"version"' "$sourcemap_path"; then
                echo "  ✓ Valid source map already exists: $sourcemap_url"
                successful_downloads=$((successful_downloads + 1))
                continue
            else
                echo "  Invalid source map file exists, will re-download"
            fi
        fi
        
        # Download the source map
        full_url="${BASE_URL}${sourcemap_url}"
        echo "  Downloading: $full_url"
        
        if curl -s -f -o "$sourcemap_path" "$full_url"; then
            echo "  ✓ Downloaded: $sourcemap_url"
            successful_downloads=$((successful_downloads + 1))
        else
            echo "  ✗ Failed to download: $sourcemap_url"
            failed_downloads=$((failed_downloads + 1))
        fi
    fi
done

echo ""
echo "=== Summary ==="
echo "Total JavaScript files: $total_files"
echo "Successful downloads: $successful_downloads"
echo "Failed downloads: $failed_downloads"
