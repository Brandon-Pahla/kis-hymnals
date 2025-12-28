#!/usr/bin/env node

/**
 * Language-Aware Migration Script
 *
 * This script creates a proper hymnal structure that respects the fact that
 * different language hymnals have different numbering systems and are not
 * simple 1:1 translations.
 *
 * Structure created:
 * hymnals/
 *   english/
 *     hymn-001.json
 *     hymn-002.json
 *   swahili/
 *     hymn-001.json
 *   ...
 *
 * cross-references.json - Optional mapping of known translations
 * index.json - Language-aware index
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Language code mapping from file names to ISO codes and directory names
const LANGUAGE_MAP = {
  'english': { code: 'en', dir: 'english', title: 'Christ In Song' },
  'swahili': { code: 'sw', dir: 'swahili', title: 'Nyimbo Za Kristo' },
  'tswana': { code: 'tn', dir: 'tswana', title: 'Keresete Mo Kopelong' },
  'sotho': { code: 'st', dir: 'sotho', title: 'Keresete Pineng' },
  'chichewa': { code: 'ny', dir: 'chichewa', title: 'Khristu Mu Nyimbo' },
  'tonga': { code: 'to', dir: 'tonga', title: 'Kristu Mu Nyimbo' },
  'shona': { code: 'sn', dir: 'shona', title: 'Kristu MuNzwiyo' },
  'venda': { code: 've', dir: 'venda', title: 'Ngosha YaDzingosha' },
  'ndebele': { code: 'nd', dir: 'ndebele', title: 'UKrestu Esihlabelelweni' },
  'xhosa': { code: 'xh', dir: 'xhosa', title: 'UKristu Engomeni' },
  'xitsonga': { code: 'ts', dir: 'xitsonga', title: 'Risima Ra Vuyimbeleri' },
  'gikuyu': { code: 'ki', dir: 'gikuyu', title: 'Nyimbo cia Agendi' },
  'abagusii': { code: 'guz', dir: 'abagusii', title: 'Ogotera kw\'ogotogia Nyasae' },
  'dholuo': { code: 'luo', dir: 'dholuo', title: 'Wende Nyasaye' },
  'kinyarwanda': { code: 'rw', dir: 'kinyarwanda', title: 'Indirimbo Zo Guhimbaza Imana' },
  'kirundi': { code: 'rn', dir: 'kirundi', title: 'Indirimbo' },
  'tumbuka': { code: 'tum', dir: 'tumbuka', title: 'Nyimbo za Mpingo wa SDA' },
  'sepedi': { code: 'nso', dir: 'sepedi', title: 'Kreste Ka Kopelo' },
  'Icibemba': { code: 'bem', dir: 'icibemba', title: 'Kristu Mu Nyimbo' },
  'pt': { code: 'pt', dir: 'portuguese', title: 'Hinàrio Adventista Do Sétiomo Dia' },
  'es': { code: 'es', dir: 'spanish', title: 'Himnario Adventista' },
  'dg': { code: 'fr', dir: 'french', title: 'Donnez-Lui Gloire' },
  'ru': { code: 'ru', dir: 'russian', title: 'Гимн адвентистов седьмого дня' },
  'sdah': { code: 'en-sdah', dir: 'sdah', title: 'SDA Hymnal' },
  'twi': { code: 'tw', dir: 'twi', title: 'Twi Hymnal' }
};

/**
 * Parse HTML content into structured stanzas
 */
function parseHTMLContent(html) {
  if (!html) return [];

  const stanzas = [];

  // Remove title heading
  let content = html.replace(/<h1>.*?<\/h1>/gi, '');

  // Split by paragraph tags
  const paragraphs = content.split(/<\/?p>/i).filter(p => p.trim());

  let verseNumber = 1;

  for (let para of paragraphs) {
    para = para.trim();
    if (!para) continue;

    // Check if this is a chorus
    const isChorus = /<i>.*?<b>.*?(CHORUS|Chorus|NNYESO|Nnyeso|KWAYA)/i.test(para) ||
                     /<font[^>]*>.*?<b>.*?(CHORUS|Chorus|NNYESO|Nnyeso|KWAYA)/i.test(para);

    // Convert line breaks to newlines
    let text = para.replace(/<br\s*\/?>/gi, '\n');

    // Handle numbered verses
    const verseMarkerRegex = /<font[^>]*>\s*<b>\s*(\d+)\s*<\/b>\s*<\/font>/gi;
    const hasVerseMarkers = verseMarkerRegex.test(para);

    if (hasVerseMarkers && !isChorus) {
      verseMarkerRegex.lastIndex = 0;
      const parts = para.split(verseMarkerRegex);

      for (let i = 1; i < parts.length; i += 2) {
        const verseNum = parseInt(parts[i], 10);
        const verseText = parts[i + 1] || '';

        if (!verseText.trim()) continue;

        let cleanText = verseText.replace(/<br\s*\/?>/gi, '\n');
        cleanText = cleanText.replace(/<[^>]+>/g, '');
        cleanText = cleanText
          .replace(/&nbsp;/g, ' ')
          .replace(/[ \t]+/g, ' ')
          .replace(/\n /g, '\n')
          .replace(/ \n/g, '\n')
          .trim();

        const lines = cleanText
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0);

        if (lines.length > 0) {
          stanzas.push({
            type: 'verse',
            number: verseNum,
            lines: lines
          });
        }
      }
      continue;
    }

    // Remove HTML tags
    text = text.replace(/<[^>]+>/g, '');

    // Clean up the text
    text = text
      .replace(/&nbsp;/g, ' ')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n /g, '\n')
      .replace(/ \n/g, '\n')
      .trim();

    if (!text) continue;

    // Remove chorus labels from text
    text = text.replace(/^(CHORUS|Chorus|NNYESO|Nnyeso|KWAYA)[:\s]*/i, '');

    // Split into lines
    const lines = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (lines.length === 0) continue;

    const stanza = {
      type: isChorus ? 'chorus' : 'verse',
      lines: lines
    };

    if (!isChorus) {
      stanza.number = verseNumber++;
    }

    stanzas.push(stanza);
  }

  return stanzas;
}

/**
 * Parse markdown content into structured stanzas
 */
function parseMarkdownContent(markdown) {
  if (!markdown) return [];

  const stanzas = [];
  const blocks = markdown.split(/\n\n+/).filter(b => b.trim());

  let verseNumber = 1;

  for (let block of blocks) {
    block = block.trim();
    if (!block) continue;

    const isChorus = /\*\*\s*(CHORUS|Chorus|Nnyeso|NNYESO|KWAYA)/i.test(block) ||
                     /_\s*(CHORUS|Chorus|Nnyeso|NNYESO|KWAYA)/i.test(block);

    // Remove markdown formatting
    let text = block
      .replace(/\*\*\d+\*\*/g, '')
      .replace(/\*\*.*?(CHORUS|Chorus|Nnyeso|NNYESO|KWAYA).*?\*\*/gi, '')
      .replace(/_.*?(CHORUS|Chorus|Nnyeso|NNYESO|KWAYA).*?_/gi, '')
      .replace(/\*\*/g, '')
      .replace(/__/g, '')
      .replace(/\*/g, '')
      .replace(/_/g, '')
      .trim();

    if (!text) continue;

    const lines = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (lines.length === 0) continue;

    const stanza = {
      type: isChorus ? 'chorus' : 'verse',
      lines: lines
    };

    if (!isChorus) {
      stanza.number = verseNumber++;
    }

    stanzas.push(stanza);
  }

  return stanzas;
}

/**
 * Extract original language files from git history
 */
function extractOriginalFiles() {
  console.log('Extracting original language files from git history...\n');

  const tempDir = path.join(__dirname, 'temp_original_files');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true });
  }
  fs.mkdirSync(tempDir);

  // Get commit before the incorrect migration
  const commitHash = '91a3e5f~1';

  for (const [fileName, langInfo] of Object.entries(LANGUAGE_MAP)) {
    const jsonFile = `${fileName}.json`;
    const outputPath = path.join(tempDir, jsonFile);

    try {
      console.log(`  Extracting ${jsonFile}...`);
      const gitCommand = `git show ${commitHash}:${jsonFile}`;
      const content = execSync(gitCommand, { encoding: 'utf-8' });
      fs.writeFileSync(outputPath, content);
    } catch (error) {
      console.log(`  Warning: Could not extract ${jsonFile} (file may not exist in history)`);
    }
  }

  console.log('\nExtraction complete.\n');
  return tempDir;
}

/**
 * Process a single language file
 */
function processLanguageFile(filePath, langInfo) {
  console.log(`Processing ${path.basename(filePath)}...`);

  const content = fs.readFileSync(filePath, 'utf-8');
  const hymns = JSON.parse(content);

  const processedHymns = [];

  for (const hymn of hymns) {
    let stanzas;
    if (hymn.content) {
      stanzas = parseHTMLContent(hymn.content);
    } else if (hymn.markdown) {
      stanzas = parseMarkdownContent(hymn.markdown);
    } else {
      console.warn(`  Warning: Hymn ${hymn.number} has no content or markdown`);
      stanzas = [];
    }

    processedHymns.push({
      number: hymn.number,
      language: langInfo.code,
      title: hymn.title,
      stanzas: stanzas
    });
  }

  return processedHymns;
}

/**
 * Main migration function
 */
function migrate() {
  console.log('Starting language-aware migration...\n');

  // Extract original files
  const tempDir = extractOriginalFiles();

  // Create hymnals directory
  const hymnalsDir = path.join(__dirname, 'hymnals');
  if (fs.existsSync(hymnalsDir)) {
    console.log('Backing up existing hymnals directory...');
    const backupDir = path.join(__dirname, 'hymnals_backup_' + Date.now());
    fs.renameSync(hymnalsDir, backupDir);
    console.log(`  Backed up to ${path.basename(backupDir)}\n`);
  }
  fs.mkdirSync(hymnalsDir);

  // Track all hymns for index
  const hymnalIndex = {};

  // Process each language file
  for (const [fileName, langInfo] of Object.entries(LANGUAGE_MAP)) {
    const jsonFile = path.join(tempDir, `${fileName}.json`);

    if (!fs.existsSync(jsonFile)) {
      console.log(`Skipping ${fileName} (not found)\n`);
      continue;
    }

    const hymns = processLanguageFile(jsonFile, langInfo);

    // Create language directory
    const langDir = path.join(hymnalsDir, langInfo.dir);
    fs.mkdirSync(langDir, { recursive: true });

    // Write each hymn to its own file
    for (const hymn of hymns) {
      const hymnFileName = `hymn-${String(hymn.number).padStart(3, '0')}.json`;
      const hymnFilePath = path.join(langDir, hymnFileName);
      fs.writeFileSync(hymnFilePath, JSON.stringify(hymn, null, 2));
    }

    // Update index
    hymnalIndex[langInfo.dir] = {
      code: langInfo.code,
      title: langInfo.title,
      hymnCount: hymns.length,
      directory: `hymnals/${langInfo.dir}`
    };

    console.log(`  Created ${hymns.length} hymns in ${langInfo.dir}/\n`);
  }

  // Write index.json
  const index = {
    version: '3.0',
    description: 'Language-aware hymnal structure. Each language hymnal maintains its original numbering.',
    migrationDate: new Date().toISOString(),
    hymnals: hymnalIndex
  };

  fs.writeFileSync(
    path.join(__dirname, 'index.json'),
    JSON.stringify(index, null, 2)
  );

  // Create cross-references template
  const crossReferences = {
    version: '1.0',
    description: 'Cross-references between hymns in different language hymnals that are translations of each other.',
    note: 'This file can be populated manually or through community contributions as translations are verified.',
    crossReferences: [
      {
        id: 'example-001',
        note: 'Example entry - replace with actual verified translations',
        hymns: {
          english: { number: 1, title: 'Example Title' },
          swahili: { number: 1, title: 'Example Title in Swahili' }
        }
      }
    ]
  };

  fs.writeFileSync(
    path.join(__dirname, 'cross-references.json'),
    JSON.stringify(crossReferences, null, 2)
  );

  // Clean up temp directory
  fs.rmSync(tempDir, { recursive: true });

  console.log('\n✓ Migration complete!');
  console.log(`  - Created ${Object.keys(hymnalIndex).length} language directories`);
  console.log(`  - Generated index.json`);
  console.log(`  - Created cross-references.json template`);
  console.log('\nNext steps:');
  console.log('  1. Review the new structure in hymnals/');
  console.log('  2. Optionally populate cross-references.json with known translations');
  console.log('  3. Update README.md with new structure documentation');
}

// Run migration
migrate();
