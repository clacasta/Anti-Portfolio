const fs = require('fs');
const path = require('path');

const ideasDir = path.join(__dirname, 'ideas');
const outputFile = path.join(__dirname, 'projects.js');

// Fields whose comma-separated values become arrays. Every other field stays
// a plain string, so commas inside a title or reason are preserved.
const LIST_FIELDS = ['tags'];

function parseFrontmatter(content) {
    const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;
    const match = content.match(frontmatterRegex);

    if (!match) {
        return { metadata: {}, body: content };
    }

    const metadataStr = match[1];
    const body = match[2];
    const metadata = {};

    metadataStr.split(/\r?\n/).forEach(line => {
        const separator = line.indexOf(':');
        if (separator === -1) return;

        const key = line.slice(0, separator).trim();
        const value = line.slice(separator + 1).trim();
        if (!key) return;

        metadata[key] = LIST_FIELDS.includes(key)
            ? value.split(',').map(v => v.trim()).filter(Boolean)
            : value;
    });

    return { metadata, body };
}

function compareProjects(a, b) {
    const idA = Number(a.id);
    const idB = Number(b.id);
    const hasIdA = a.id !== undefined && !Number.isNaN(idA);
    const hasIdB = b.id !== undefined && !Number.isNaN(idB);

    if (hasIdA && hasIdB && idA !== idB) return idA - idB;
    if (hasIdA !== hasIdB) return hasIdA ? -1 : 1;
    return String(a.date || '').localeCompare(String(b.date || ''));
}

try {
    const files = fs.readdirSync(ideasDir).filter(file => path.extname(file) === '.md');
    const projects = files.map(file => {
        // Strip a UTF-8 BOM (added by some Windows editors) so the frontmatter is detected.
        const content = fs.readFileSync(path.join(ideasDir, file), 'utf8').replace(/^﻿/, '');
        const { metadata, body } = parseFrontmatter(content);

        if (!metadata.title) {
            console.warn(`Warning: ${file} has no "title" in its frontmatter.`);
        }

        return {
            ...metadata,
            tags: metadata.tags || [],
            description: body.trim() // The body of the MD file is the description
        };
    });

    projects.sort(compareProjects);

    const fileContent = `const projectsData = ${JSON.stringify(projects, null, 2)};\n`;

    fs.writeFileSync(outputFile, fileContent);
    console.log(`Successfully built projects.js with ${projects.length} ideas.`);

} catch (error) {
    console.error('Error building projects:', error);
    process.exitCode = 1;
}
