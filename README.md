# Christ In Song Hymnals

This repository contains Christ In Song Hymnal files in a structured, language-aware JSON format.

Files are used in the [cis-android](https://github.com/TinasheMzondiwa/cis-android) and [cis-ios](https://github.com/TinasheMzondiwa/cis-ios) apps.

## Repository Structure

### Data Format (v3.0)

**Important**: This repository contains **multiple distinct hymnals** in different languages, not simple translations of a single hymnal. Each language hymnal has its own numbering system and collection of hymns.

The structure properly reflects this reality:

- **Language-Based Organization**: Each language hymnal is stored separately in its own directory
- **Original Numbering Preserved**: Hymn numbers are maintained as they appear in the original hymnals
- **Structured Stanzas**: All HTML/markdown has been removed and converted into structured objects with explicit types (`verse`, `chorus`)
- **Optional Cross-References**: A separate file (`cross-references.json`) allows mapping of verified translations

### Directory Layout

```
hymnals/
  english/          # Christ In Song (300 hymns)
    hymn-001.json
    hymn-002.json
    ...
  swahili/          # Nyimbo Za Kristo (220 hymns)
    hymn-001.json
    hymn-002.json
    ...
  french/           # Donnez-Lui Gloire (520 hymns)
    hymn-001.json
    ...
  spanish/          # Himnario Adventista (614 hymns)
    hymn-001.json
    ...
  portuguese/       # Hinàrio Adventista (610 hymns)
    hymn-001.json
    ...
  sdah/             # SDA Hymnal (695 hymns)
    hymn-001.json
    ...
  [... 25 language directories total]

index.json              # Central index of all hymnals
cross-references.json   # Optional mapping of verified translations
config.json             # Language configuration metadata
```

### Individual Hymn File Structure

Each hymn file (e.g., `hymnals/english/hymn-023.json`) follows this structure:

```json
{
  "number": 23,
  "language": "en",
  "title": "Hover O`er Me, Holy Spirit",
  "stanzas": [
    {
      "type": "verse",
      "number": 1,
      "lines": [
        "Hover o`er me, Holy spirit,",
        "Bathe my trembling heart and brow;",
        "Fill me with thy hallow`d presence,",
        "Come, O come and fill me now."
      ]
    },
    {
      "type": "chorus",
      "lines": [
        "Fill me now, fill me now,",
        "Jesus come and fill me now."
      ]
    }
  ]
}
```

### Index File Structure

The `index.json` file provides metadata about all available hymnals:

```json
{
  "version": "3.0",
  "description": "Language-aware hymnal structure. Each language hymnal maintains its original numbering.",
  "migrationDate": "2025-12-28T08:55:34.227Z",
  "hymnals": {
    "english": {
      "code": "en",
      "title": "Christ In Song",
      "hymnCount": 300,
      "directory": "hymnals/english"
    },
    "swahili": {
      "code": "sw",
      "title": "Nyimbo Za Kristo",
      "hymnCount": 220,
      "directory": "hymnals/swahili"
    }
  }
}
```

### Cross-References File Structure

The `cross-references.json` file maps hymns that are known translations of each other:

```json
{
  "version": "1.0",
  "description": "Cross-references between hymns in different language hymnals that are translations of each other.",
  "note": "This file can be populated manually or through community contributions as translations are verified.",
  "crossReferences": [
    {
      "id": "ref-001",
      "note": "Verified translation",
      "hymns": {
        "english": {
          "number": 50,
          "title": "Sweet By And By"
        },
        "swahili": {
          "number": 145,
          "title": "Tutakutana"
        },
        "french": {
          "number": 203,
          "title": "Dans la douce patrie"
        }
      }
    }
  ]
}
```

## Usage

### Finding a Hymn

To find a specific hymn:

1. Choose the language hymnal from `index.json`
2. Navigate to that hymnal's directory
3. Load the hymn file by number (e.g., `hymnals/english/hymn-023.json`)

Example:
```javascript
// Load English hymn #23
const hymn = require('./hymnals/english/hymn-023.json');
console.log(hymn.title); // "Hover O`er Me, Holy Spirit"
```

### Finding Translations

If you need to find translations of a hymn:

1. Check `cross-references.json` for verified translations
2. Note that not all hymns have translations, and numbering differs across languages

Example:
```javascript
const refs = require('./cross-references.json');
// Find all translations of English hymn #50
const translation = refs.crossReferences.find(ref =>
  ref.hymns.english?.number === 50
);
```

### Supported Languages

This repository includes 25+ distinct hymnals:

| Language | Code | Hymnal Title | Hymn Count |
|----------|------|--------------|------------|
| English | en | Christ In Song | 300 |
| Swahili | sw | Nyimbo Za Kristo | 220 |
| French | fr | Donnez-Lui Gloire | 520 |
| Spanish | es | Himnario Adventista | 614 |
| Portuguese | pt | Hinàrio Adventista | 610 |
| Russian | ru | Гимн адвентистов седьмого дня | 384 |
| English (SDA) | en-sdah | SDA Hymnal | 695 |
| Kinyarwanda | rw | Indirimbo Zo Guhimbaza Imana | 500 |
| Twi | tw | Twi Hymnal | 770 |
| ... and 16 more | | | |

See `index.json` for the complete list.

## Contributing

### Found a typo?
Please open a new [issue](https://github.com/Brandon-Pahla/kis-hymnals/issues/new/choose).

### New language?
Please open a new [issue](https://github.com/Brandon-Pahla/kis-hymnals/issues/new/choose) with the suggested language.

### Know a translation?
If you can verify that a hymn in one language is a translation of a hymn in another language, please open an issue or PR to add it to `cross-references.json`.

### Contributing new files?
Make sure you check if the file content is valid and that the hymns render as expected here [Hymnal Previewer](https://previewer-psi.vercel.app/)

## Migration

The `migrate-language-aware.js` script was used to create this structure from the original source files. It:
- Parses HTML and markdown content
- Removes all embedded formatting
- Creates structured stanza objects
- Organizes hymns by language with original numbering preserved
- Generates the language-aware directory structure

## Copyright info
The copyrights for each hymnal belong to the respective publishing houses.

## License

    Copyright 2023 Tinashe Mzondiwa (original hymnal data collection)
    Copyright 2025 Brandon Pahla (data structure improvements and refactoring)

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.

### Attribution

- **Original Data Collection**: Tinashe Mzondiwa collected and digitized the original hymnal data
- **Structural Refactoring**: Brandon Pahla created the language-aware canonical format that properly respects the distinct nature of each hymnal while preserving all original lyrical content
