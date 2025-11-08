# App Center frontend source code archive

Extracted from [https://appcenter.ms/apps](https://appcenter.ms/apps). Source code was restored using source maps that were publicly accessible in production.

## How is this possible?

Because Microsoft forgot to disable sourcemaps in production on the App Center assets website.

As an interesting discovery, I've archived the extracted source code here for educational purposes.

## Directory Structure

```
.
├── download_sourcemaps.sh  # Script to download all source maps
├── unified-extractor.js    # Node.js script to extract source code
├── package.json           # Project configuration
├── generated/             # Downloaded JS files and source maps
│   ├── *.js              # Minified JavaScript files
│   └── *.js.map          # Source map files
└── unified-sources/       # Extracted source code (2,966 files)
    ├── client/           # React/TypeScript application
    │   ├── components/   # UI components
    │   ├── pages/        # Page components
    │   ├── utils/        # Utility functions
    │   └── styles/       # SCSS stylesheets
    ├── node_modules/     # Third-party dependencies
    └── lib/              # Library code
```

## What's Inside

- Complete React/TypeScript source code
- SCSS stylesheets and component styles
- UI components and page layouts
- Utility functions and helpers
- Third-party library sources
- SVG assets and icons
- And more...

## Usage

### Download Source Maps

```bash
# Make the script executable
chmod +x download_sourcemaps.sh

# Download all source maps
./download_sourcemaps.sh
```

### Extract Source Code

```bash
# Install dependencies
pnpm install

# Extract source code from all source maps
pnpm extract
```

This will create a `unified-sources/` directory containing all the extracted source files organized in a clean directory structure.

## Technical Details

- **Total Files Extracted**: 2,966 unique source files
- **Source Map Format**: Standard JavaScript source maps (v3)
- **Extraction Method**: Using the `source-map` npm library
- **Directory Organization**: Unified structure merging all sources

## Disclaimer

This repository is for educational and research purposes only. All code is copyrighted by Microsoft Corporation.

The source code was obtained from publicly accessible resources through browser developer tools and source map analysis.

## License

The content in this repository belongs to Microsoft Corporation. If there are any copyright concerns, please contact for removal.

Remember: Always disable sourcemaps in production!

## Related

- [Microsoft App Center](https://appcenter.ms/)
- [Save All Resources Extension](https://chromewebstore.google.com/detail/save-all-resources/abpdnfjocnmdomablahdcfnoggeeiedb)
