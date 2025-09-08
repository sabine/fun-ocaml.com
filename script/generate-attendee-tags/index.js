const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');

// Configuration
const INPUT_PDF_PATH = './conference-flyer.pdf'; // Update this path
const OUTPUT_DIR = './attendee-flyers'; // Directory for individual attendee PDFs
const ATTENDEE_PATH = './attendees.json';
const FONT_PATH = './fonts/NotoSans-Regular.ttf'; // Unicode font path
const FONT_BOLD_PATH = './fonts/NotoSans-Bold.ttf'; // Unicode bold font path

// Load attendee data from JSON file
function loadAttendees() {
    try {
        const attendeeData = fs.readFileSync(ATTENDEE_PATH, 'utf8');
        return JSON.parse(attendeeData);
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.error(`❌ Attendees file not found: ${ATTENDEE_PATH}`);
            console.error('📝 Please create an attendees.json file with the following format:');
            console.error(`[
  {
    "name": "John Doe",
    "company": "Acme Corp"
  },
  {
    "name": "Jane Smith", 
    "company": "Tech Solutions Inc"
  },
  {
    "name": "山田太郎",
    "company": "株式会社テクノロジー"
  }
]`);
        } else {
            console.error('❌ Error reading attendees file:', error.message);
        }
        process.exit(1);
    }
}

// Check if font files exist, provide helpful error messages
function checkFontFiles() {
    const fontFiles = [
        { path: FONT_PATH, name: 'Regular font' },
        { path: FONT_BOLD_PATH, name: 'Bold font' }
    ];
    
    const missingFonts = fontFiles.filter(font => !fs.existsSync(font.path));
    
    if (missingFonts.length > 0) {
        console.error('❌ Missing font files:');
        missingFonts.forEach(font => {
            console.error(`   • ${font.name}: ${font.path}`);
        });
        console.error('\n📥 To fix this, download Noto Sans fonts:');
        console.error('   1. Visit: https://fonts.google.com/noto/specimen/Noto+Sans');
        console.error('   2. Download the font family');
        console.error('   3. Create a "fonts" folder in your project');
        console.error('   4. Extract and place these files:');
        console.error('      • NotoSans-Regular.ttf');
        console.error('      • NotoSans-Bold.ttf');
        console.error('\n💡 Alternative: Use any other Unicode-compatible .ttf font files');
        console.error('   and update the FONT_PATH and FONT_BOLD_PATH variables');
        process.exit(1);
    }
}

// Styling configuration
const FONT_SIZE_NAME = 18;
const FONT_SIZE_COMPANY = 14;
const TEXT_COLOR = rgb(0.2, 0.2, 0.2); // Dark gray
const LINE_SPACING = 8;
const VERTICAL_OFFSET = 0.55; // Position from bottom (45% from top)
const MAX_WIDTH_PERCENTAGE = 0.75; // Use 75% of page width
const LINE_HEIGHT_MULTIPLIER = 1.3; // Space between wrapped lines

// Text wrapping function
function wrapText(text, font, fontSize, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    
    for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = font.widthOfTextAtSize(testLine, fontSize);
        
        if (testWidth <= maxWidth) {
            currentLine = testLine;
        } else {
            // If current line has content, push it and start new line
            if (currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                // Single word is too long, try to break it
                lines.push(word);
                currentLine = '';
            }
        }
    }
    
    // Add the last line if it has content
    if (currentLine) {
        lines.push(currentLine);
    }
    
    return lines;
}

// Function to draw multi-line text centered
function drawCenteredMultilineText(page, lines, font, fontSize, centerX, startY, lineHeight) {
    const positions = [];
    
    lines.forEach((line, index) => {
        const lineWidth = font.widthOfTextAtSize(line, fontSize);
        const x = centerX - (lineWidth / 2);
        const y = startY - (index * lineHeight);
        
        page.drawText(line, {
            x: x,
            y: y,
            size: fontSize,
            font: font,
            color: TEXT_COLOR,
        });
        
        positions.push({ x, y, width: lineWidth });
    });
    
    return positions;
}

async function createAttendeePDFs() {
    try {
        // Check for required font files
        checkFontFiles();
        
        // Load attendees from file
        const ATTENDEES = loadAttendees();
        
        if (!ATTENDEES || ATTENDEES.length === 0) {
            console.error('❌ No attendees found in the JSON file');
            return;
        }

        // Create output directory if it doesn't exist
        if (!fs.existsSync(OUTPUT_DIR)) {
            fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        }

        // Read the existing PDF template
        const existingPdfBytes = fs.readFileSync(INPUT_PDF_PATH);
        
        // Load font files for Unicode support
        const regularFontBytes = fs.readFileSync(FONT_PATH);
        const boldFontBytes = fs.readFileSync(FONT_BOLD_PATH);
        
        console.log(`🚀 Starting to generate ${ATTENDEES.length} individual attendee PDFs...`);
        
        // Process each attendee
        for (let i = 0; i < ATTENDEES.length; i++) {
            const attendee = ATTENDEES[i];
            
            // Validate attendee data
            if (!attendee.name || !attendee.company) {
                console.warn(`⚠️  Skipping attendee ${i + 1}: Missing name or company`);
                continue;
            }
            
            console.log(`📄 Creating PDF for: ${attendee.name}`);
            
            // Load a fresh copy of the PDF for each attendee
            const pdfDoc = await PDFDocument.load(existingPdfBytes);
            
            // Register fontkit to enable custom font loading
            pdfDoc.registerFontkit(fontkit);
            
            // Get all pages
            const pages = pdfDoc.getPages();
            const firstPage = pages[0];
            
            // Get page dimensions
            const { width, height } = firstPage.getSize();
            
            // Embed custom Unicode fonts
            const boldFont = await pdfDoc.embedFont(boldFontBytes);
            const regularFont = await pdfDoc.embedFont(regularFontBytes);
            
            // Calculate center position and max width
            const centerX = width / 2;
            const maxWidth = width * MAX_WIDTH_PERCENTAGE;
            const baseY = height * VERTICAL_OFFSET;
            
            // Calculate line heights
            const nameLineHeight = FONT_SIZE_NAME * LINE_HEIGHT_MULTIPLIER;
            const companyLineHeight = FONT_SIZE_COMPANY * LINE_HEIGHT_MULTIPLIER;
            
            // Wrap text for name and company
            const nameLines = wrapText(attendee.name, boldFont, FONT_SIZE_NAME, maxWidth);
            const companyLines = wrapText(attendee.company, regularFont, FONT_SIZE_COMPANY, maxWidth);
            
            // Calculate actual heights for each text block
            const nameBlockHeight = Math.max(1, nameLines.length) * FONT_SIZE_NAME + 
                                   (Math.max(0, nameLines.length - 1) * (nameLineHeight - FONT_SIZE_NAME));
            const companyBlockHeight = Math.max(1, companyLines.length) * FONT_SIZE_COMPANY + 
                                      (Math.max(0, companyLines.length - 1) * (companyLineHeight - FONT_SIZE_COMPANY));
            
            // Total height including spacing between name and company
            const totalTextHeight = nameBlockHeight + LINE_SPACING + companyBlockHeight;
            
            // Calculate the center point of the entire text block
            const textBlockCenterY = baseY;
            
            // Calculate starting position for name (top of the text block)
            const nameStartY = textBlockCenterY + (totalTextHeight / 2) - FONT_SIZE_NAME;
            
            // Draw attendee name (bold, centered, multi-line)
            const namePositions = drawCenteredMultilineText(
                firstPage, 
                nameLines, 
                boldFont, 
                FONT_SIZE_NAME, 
                centerX, 
                nameStartY, 
                nameLineHeight
            );
            
            // Calculate position for company text (ensure proper spacing below name)
            const companyStartY = nameStartY - nameBlockHeight - LINE_SPACING - FONT_SIZE_COMPANY;
            
            // Draw company name (regular, centered, multi-line, below name)
            drawCenteredMultilineText(
                firstPage, 
                companyLines, 
                regularFont, 
                FONT_SIZE_COMPANY, 
                centerX, 
                companyStartY, 
                companyLineHeight
            );
            
            // Generate filename (sanitized for file system)
            const sanitizedName = attendee.name
                .replace(/[^a-zA-Z0-9\s\u00C0-\u017F\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff-]/g, '') // Allow Unicode characters
                .replace(/\s+/g, '-') // Replace spaces with hyphens
                .toLowerCase();
            
            const outputFileName = `${sanitizedName || `attendee-${i + 1}`}-flyer.pdf`;
            const outputPath = path.join(OUTPUT_DIR, outputFileName);
            
            // Save the individual attendee PDF
            const pdfBytes = await pdfDoc.save();
            fs.writeFileSync(outputPath, pdfBytes);
            
            console.log(`✅ Saved: ${outputFileName}`);
        }
        
        console.log(`🎉 Success! Generated ${ATTENDEES.length} individual attendee PDFs`);
        console.log(`📁 All files saved in: ${OUTPUT_DIR}`);
        console.log('\n📋 Generated files:');
        
        // List all generated files
        ATTENDEES.forEach((attendee, i) => {
            if (attendee.name && attendee.company) {
                const sanitizedName = attendee.name
                    .replace(/[^a-zA-Z0-9\s\u00C0-\u017F\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff-]/g, '')
                    .replace(/\s+/g, '-')
                    .toLowerCase();
                const fileName = `${sanitizedName || `attendee-${i + 1}`}-flyer.pdf`;
                console.log(`   • ${fileName} - ${attendee.name} (${attendee.company})`);
            }
        });
        
    } catch (error) {
        console.error('❌ Error processing PDFs:', error.message);
        
        if (error.code === 'ENOENT') {
            if (error.path === INPUT_PDF_PATH) {
                console.error(`📁 Make sure the input file exists: ${INPUT_PDF_PATH}`);
            } else if (error.path === FONT_PATH || error.path === FONT_BOLD_PATH) {
                console.error(`🔤 Font file not found: ${error.path}`);
                console.error('Please download and place the required font files');
            }
        } else if (error.message.includes('Failed to parse')) {
            console.error('📄 The input file may not be a valid PDF or may be corrupted');
        } else if (error.message.includes('font')) {
            console.error('🔤 Font loading error - make sure the font files are valid .ttf files');
        }
    }
}

// Helper function to clean up old files (optional)
async function cleanOutputDirectory() {
    if (fs.existsSync(OUTPUT_DIR)) {
        const files = fs.readdirSync(OUTPUT_DIR);
        const pdfFiles = files.filter(file => file.endsWith('.pdf'));
        
        if (pdfFiles.length > 0) {
            console.log(`🧹 Cleaning up ${pdfFiles.length} old PDF files...`);
            pdfFiles.forEach(file => {
                fs.unlinkSync(path.join(OUTPUT_DIR, file));
            });
        }
    }
}

// Main execution
async function main() {
    console.log('🏷️  PDF Attendee Tags Generator (Unicode Support)');
    console.log('=================================================\n');
    
    // Optionally clean up old files first
    // await cleanOutputDirectory();
    
    await createAttendeePDFs();
}

// Run the script
main();