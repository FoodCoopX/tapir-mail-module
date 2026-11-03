#!/usr/bin/env bash

# Check if URL is provided
if [[ -z $1 ]]; then
    echo "Usage: $0 <google fonts css url>"
    exit 1
fi

# URL of the Google Fonts CSS
url=$1

# Directory to save the fonts
dir='tapir_mail_ui/public/fonts'

# Create directory if not exists
mkdir -p "$dir"

# Fetch CSS
css=$(curl -s "$url")

# Extract URLs of woff2 files
urls=$(echo "$css" | grep -oP 'url\(\K[^)]+' | sed 's/)//')

font_family=$(echo "$url" | awk -F'family=' '{print $2}' | awk -F':' '{print $1}')

# Create a temporary file to hold the modified CSS
temp_file=$(mktemp)

# Save the original CSS to the temporary file
echo "$css" > "$temp_file"

# Extract URLs of font files, download them, and update the CSS
urls=$(echo "$css" | grep -oP 'url\(\K[^)]+' | sed 's/)//')
for url in $urls; do
    file=$(basename "$url")
    curl -s "$url" -o "$dir/$file"
    echo "Downloaded $file"
    perl -i -pe "s|$url|/static/fonts/$file|g" "$temp_file" 
done

# Write the modified CSS to disk using the font family name
mv "$temp_file" "$dir/$font_family.css"
