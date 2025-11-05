const fs = require('fs');
const path = require('path');
const { SourceMapConsumer } = require('source-map');

/**
 * Extract source files from source map and merge into unified directory structure
 * @param {string} sourceMapPath - Path to source map file
 * @param {string} baseOutputDir - Base output directory
 * @param {Map} fileTracker - File tracker to avoid duplicates
 */
async function extractSourceMapUnified(sourceMapPath, baseOutputDir, fileTracker) {
    try {
        const sourceMapContent = fs.readFileSync(sourceMapPath, 'utf8');
        const sourceMap = JSON.parse(sourceMapContent);
        
        const fileName = path.basename(sourceMapPath, '.js.map');
        console.log(`Processing: ${fileName}.js.map`);
        console.log(`Sources found: ${sourceMap.sources ? sourceMap.sources.length : 0}`);
        
        const consumer = await new SourceMapConsumer(sourceMap);
        
        let extractedCount = 0;
        let skippedCount = 0;
        
        if (sourceMap.sources && sourceMap.sourcesContent) {
            sourceMap.sources.forEach((source, index) => {
                if (sourceMap.sourcesContent[index]) {
                    let cleanPath = source
                        .replace(/^webpack:\/\/\//, '')
                        .replace(/^\.\//, '')
                        .replace(/^\//, '');
                    
                    if (cleanPath.includes('?')) {
                        const basePath = cleanPath.split('?')[0];
                        const queryParam = cleanPath.split('?')[1];
                        cleanPath = basePath;
                        
                        if (queryParam && fileTracker.has(basePath)) {
                            skippedCount++;
                            return;
                        }
                    }
                    
                    const outputPath = path.join(baseOutputDir, cleanPath);
                    
                    if (fileTracker.has(cleanPath)) {
                        const existingContent = fileTracker.get(cleanPath);
                        const currentContent = sourceMap.sourcesContent[index];
                        
                        if (existingContent === currentContent) {
                            skippedCount++;
                            return;
                        } else {
                            if (currentContent.length > existingContent.length) {
                                console.log(`Updating: ${cleanPath} (found longer version)`);
                            } else {
                                skippedCount++;
                                return;
                            }
                        }
                    }
                    
                    const outputDirPath = path.dirname(outputPath);
                    
                    if (!fs.existsSync(outputDirPath)) {
                        fs.mkdirSync(outputDirPath, { recursive: true });
                    }
                    
                    fs.writeFileSync(outputPath, sourceMap.sourcesContent[index]);
                    fileTracker.set(cleanPath, sourceMap.sourcesContent[index]);
                    extractedCount++;
                    
                    if (extractedCount <= 5) {
                        console.log(`  ✓ ${cleanPath}`);
                    }
                }
            });
        }
        
        consumer.destroy();
        console.log(`  Extracted: ${extractedCount} files, Skipped: ${skippedCount} duplicates`);
        console.log(`  From: ${fileName}.js.map\n`);
        
        return { extracted: extractedCount, skipped: skippedCount };
        
    } catch (error) {
        console.error(`Error processing ${sourceMapPath}:`, error.message);
        return { extracted: 0, skipped: 0 };
    }
}

/**
 * Process all source map files in directory and merge to unified structure
 * @param {string} inputDir - Input directory containing source maps
 * @param {string} outputDir - Unified output directory
 */
async function extractAllSourceMapsUnified(inputDir, outputDir) {
    const files = fs.readdirSync(inputDir);
    const sourceMapFiles = files.filter(file => file.endsWith('.js.map'));
    
    console.log('📦 Unified Source Map Extractor');
    console.log('================================');
    console.log(`Input directory: ${inputDir}`);
    console.log(`Output directory: ${outputDir}`);
    console.log(`Found ${sourceMapFiles.length} source map files\n`);
    
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const fileTracker = new Map();
    let totalExtracted = 0;
    let totalSkipped = 0;
    
    for (const file of sourceMapFiles) {
        const sourceMapPath = path.join(inputDir, file);
        const result = await extractSourceMapUnified(sourceMapPath, outputDir, fileTracker);
        totalExtracted += result.extracted;
        totalSkipped += result.skipped;
    }
    
    console.log('🎉 Extraction Summary');
    console.log('=====================');
    console.log(`Total files extracted: ${totalExtracted}`);
    console.log(`Total duplicates skipped: ${totalSkipped}`);
    console.log(`Output directory: ${outputDir}`);
    
    generateExtractionReport(outputDir, fileTracker, sourceMapFiles);
}

/**
 * Generate extraction report
 */
function generateExtractionReport(outputDir, fileTracker, sourceMapFiles) {
    const reportPath = path.join(outputDir, 'EXTRACTION_REPORT.md');
    
    let report = `# Source Code Extraction Report\n\n`;
    report += `Generated on: ${new Date().toLocaleString()}\n`;
    report += `Total source map files processed: ${sourceMapFiles.length}\n`;
    report += `Total unique source files extracted: ${fileTracker.size}\n\n`;
    
    report += `## Source Map Files Processed\n\n`;
    sourceMapFiles.forEach(file => {
        report += `- ${file}\n`;
    });
    
    report += `\n## Directory Structure Overview\n\n`;
    
    const fileTypes = new Map();
    const directories = new Set();
    
    for (const filePath of fileTracker.keys()) {
        const ext = path.extname(filePath).toLowerCase();
        const dir = path.dirname(filePath).split('/')[0];
        
        fileTypes.set(ext, (fileTypes.get(ext) || 0) + 1);
        directories.add(dir);
    }
    
    report += `### File Types\n\n`;
    [...fileTypes.entries()]
        .sort((a, b) => b[1] - a[1])
        .forEach(([ext, count]) => {
            report += `- ${ext || '(no extension)'}: ${count} files\n`;
        });
    
    report += `\n### Main Directories\n\n`;
    [...directories].sort().forEach(dir => {
        report += `- ${dir}/\n`;
    });
    
    fs.writeFileSync(reportPath, report);
    console.log(`📄 Extraction report saved: ${reportPath}`);
}

if (require.main === module) {
    const inputDir = process.argv[2] || './generated';
    const outputDir = process.argv[3] || './unified-sources';
    
    extractAllSourceMapsUnified(inputDir, outputDir);
}

module.exports = { extractAllSourceMapsUnified, extractSourceMapUnified };
