const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'client/src');

// Dark → Light replacements (ordered carefully to avoid cascading mistakes)
const replacements = [
  // Background colors - dark to light
  [/bg-gray-950/g, 'bg-slate-50'],
  [/bg-gray-900\/95/g, 'bg-white/95'],
  [/bg-gray-900\/80/g, 'bg-white/80'],
  [/bg-gray-900\/60/g, 'bg-white/60'],
  [/bg-gray-900\/40/g, 'bg-white/40'],
  [/bg-gray-900\/30/g, 'bg-slate-50/30'],
  [/bg-gray-900\/20/g, 'bg-slate-50/20'],
  [/bg-gray-900/g, 'bg-white'],
  [/bg-gray-800\/60/g, 'bg-slate-100'],
  [/bg-gray-800\/50/g, 'bg-slate-100'],
  [/bg-gray-800\/40/g, 'bg-slate-50'],
  [/bg-gray-800\/30/g, 'bg-slate-50'],
  [/bg-gray-800\/20/g, 'bg-slate-50'],
  [/bg-gray-800/g, 'bg-slate-100'],
  [/bg-gray-700\/60/g, 'bg-slate-200'],
  [/bg-gray-700\/50/g, 'bg-slate-200'],
  [/bg-gray-700\/40/g, 'bg-slate-100'],
  [/bg-gray-700\/30/g, 'bg-slate-100'],
  [/bg-gray-700/g, 'bg-slate-200'],
  [/bg-gray-600/g, 'bg-slate-300'],
  
  // Text colors - dark to light
  // IMPORTANT: Only change text-white when NOT preceded by colored bg buttons
  [/text-gray-100/g, 'text-slate-900'],
  [/text-gray-200/g, 'text-slate-800'],
  [/text-gray-300/g, 'text-slate-600'],
  [/text-gray-400/g, 'text-slate-500'],
  [/text-gray-500/g, 'text-slate-400'],
  [/text-gray-600/g, 'text-slate-500'],
  
  // Border colors
  [/border-gray-800\/50/g, 'border-slate-200'],
  [/border-gray-800\/30/g, 'border-slate-100'],
  [/border-gray-800/g, 'border-slate-200'],
  [/border-gray-700\/60/g, 'border-slate-300'],
  [/border-gray-700\/50/g, 'border-slate-200'],
  [/border-gray-700/g, 'border-slate-300'],
  [/border-gray-600/g, 'border-slate-300'],
  [/border-gray-300/g, 'border-slate-200'],

  // Gradient backgrounds
  [/from-gray-950/g, 'from-slate-50'],
  [/from-gray-900/g, 'from-white'],
  [/to-gray-900/g, 'to-slate-50'],
  [/via-gray-900/g, 'via-slate-50'],
  [/from-gray-800/g, 'from-slate-100'],
  [/to-gray-800/g, 'to-slate-100'],
  [/via-gray-800/g, 'via-slate-100'],

  // Specific dark backgrounds from LoginPage, hero sections etc.
  [/from-primary-950/g, 'from-primary-50'],
  [/to-accent-600\/20/g, 'to-accent-100'],
  
  // Hover text colors
  [/hover:text-gray-100/g, 'hover:text-slate-900'],
  [/hover:text-gray-200/g, 'hover:text-slate-800'],
  [/hover:text-gray-300/g, 'hover:text-slate-700'],
  
  // Hover backgrounds
  [/hover:bg-gray-800\/60/g, 'hover:bg-slate-100'],
  [/hover:bg-gray-800\/40/g, 'hover:bg-slate-100'],
  [/hover:bg-gray-800\/30/g, 'hover:bg-slate-50'],
  [/hover:bg-gray-800/g, 'hover:bg-slate-100'],
  [/hover:bg-gray-700\/40/g, 'hover:bg-slate-100'],
  [/hover:bg-gray-700/g, 'hover:bg-slate-200'],
  [/hover:border-gray-600/g, 'hover:border-slate-400'],
  
  // Focus rings
  [/focus:ring-gray-700/g, 'focus:ring-slate-300'],
  [/focus:border-gray-600/g, 'focus:border-slate-400'],
  
  // Shadow colors
  [/shadow-black\/20/g, 'shadow-slate-200'],
  [/shadow-black\/30/g, 'shadow-slate-200'],
  [/shadow-black\/40/g, 'shadow-slate-300'],
  [/shadow-black\/50/g, 'shadow-slate-300'],
  
  // Ring colors  
  [/ring-gray-700/g, 'ring-slate-300'],
  [/ring-gray-600/g, 'ring-slate-300'],
  
  // Divide colors
  [/divide-gray-800/g, 'divide-slate-200'],
  [/divide-gray-700/g, 'divide-slate-200'],
  
  // Placeholder colors
  [/placeholder-gray-500/g, 'placeholder-slate-400'],
  [/placeholder-gray-600/g, 'placeholder-slate-400'],
];

// Special handling: text-white -> text-slate-900 BUT NOT inside btn-primary, btn-danger, etc.
// We do this AFTER all other replacements so we don't accidentally break colored buttons

function convertFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  
  for (const [pattern, replacement] of replacements) {
    content = content.replace(pattern, replacement);
  }
  
  // For text-white: Only replace when NOT immediately following a colored background class
  // We use a targeted approach: replace in className strings but preserve where it follows bg-*-color patterns
  // Simple pass: convert most text-white to text-slate-900, then fix back the colored button ones
  content = content.replace(/\btext-white\b/g, 'text-slate-900');
  
  // Restore text on colored backgrounds (buttons, badges, icons etc.)
  const coloredBgPatterns = [
    // Primary button / badge
    { bg: /bg-primary-\d+[^\s"'`]* text-slate-900/g, restore: (m) => m.replace('text-slate-900', 'text-white') },
    { bg: /bg-emerald-\d+[^\s"'`]* text-slate-900/g, restore: (m) => m.replace('text-slate-900', 'text-white') },
    { bg: /bg-amber-\d+[^\s"'`]* text-slate-900/g, restore: (m) => m.replace('text-slate-900', 'text-white') },
    { bg: /bg-red-\d+[^\s"'`]* text-slate-900/g, restore: (m) => m.replace('text-slate-900', 'text-white') },
    { bg: /bg-blue-\d+[^\s"'`]* text-slate-900/g, restore: (m) => m.replace('text-slate-900', 'text-white') },
    { bg: /bg-purple-\d+[^\s"'`]* text-slate-900/g, restore: (m) => m.replace('text-slate-900', 'text-white') },
    { bg: /bg-indigo-\d+[^\s"'`]* text-slate-900/g, restore: (m) => m.replace('text-slate-900', 'text-white') },
    { bg: /bg-gradient-[^\s"'`]+ text-slate-900/g, restore: (m) => m.replace('text-slate-900', 'text-white') },
    // Badges/chips with colored bg
    { bg: /bg-primary-600 shadow[^\s"'`]* text-slate-900/g, restore: (m) => m.replace('text-slate-900', 'text-white') },
  ];
  
  for (const { bg, restore } of coloredBgPatterns) {
    content = content.replace(bg, restore);
  }
  
  // Also handle className strings with colored bg followed later by text-slate-900 (multiline-ish)
  // Pattern: bg-(color) then text-slate-900 within same className string
  content = content.replace(/className=\{?["'`]([^"'`]*bg-(?:primary|emerald|amber|red|blue|purple|indigo)-\d+[^"'`]*?)text-slate-900([^"'`]*["'`])/g, 
    (m, before, after) => `className={"${before}text-white${after}`);
  
  // Handle template literals (backtick) too
  // Also restore: btn-primary class always has white text
  content = content.replace(/btn-primary([^"'`]*)text-slate-900/g, 'btn-primary$1text-white');
  content = content.replace(/btn-danger([^"'`]*)text-slate-900/g, 'btn-danger$1text-white');
  content = content.replace(/btn-success([^"'`]*)text-slate-900/g, 'btn-success$1text-white');
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Converted: ${path.relative(__dirname, filePath)}`);
  } else {
    console.log(`⏭️  Skipped (no changes): ${path.relative(__dirname, filePath)}`);
  }
}

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip node_modules
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      walkDir(fullPath);
    } else if (entry.name.endsWith('.jsx') || entry.name.endsWith('.tsx') || entry.name.endsWith('.css')) {
      // Only convert JSX/TSX, not index.css (already done)
      if (entry.name === 'index.css' || entry.name === 'style.css') {
        console.log(`⏭️  Skip CSS: ${entry.name}`);
        continue;
      }
      convertFile(fullPath);
    }
  }
}

console.log('🎨 Converting entire client to light theme...\n');
walkDir(srcDir);
console.log('\n✨ Done! All files converted to light theme.');
