import fs from 'fs';
import path from 'path';

const memoryFile = path.resolve('server/kixai_memory.json');

// Initialize memory store if missing
if (!fs.existsSync(memoryFile)) {
  fs.writeFileSync(memoryFile, JSON.stringify({
    vendorToWho: {},
    vendorToCategory: {}
  }));
}

function getMemory() {
  try {
    return JSON.parse(fs.readFileSync(memoryFile, 'utf8'));
  } catch {
    return { vendorToWho: {}, vendorToCategory: {} };
  }
}

function saveMemory(data) {
  fs.writeFileSync(memoryFile, JSON.stringify(data, null, 2));
}

/**
 * Update memory with confirmed user corrections.
 * Expected input: array of { vendorName, who, invoiceDescription }
 */
export function learnFromCorrections(corrections) {
  if (!corrections || !Array.isArray(corrections)) return;
  
  const mem = getMemory();
  let changed = false;

  corrections.forEach(corr => {
    if (!corr.vendorName) return;
    const vendorKey = corr.vendorName.trim().toLowerCase();

    // Learn who generally pays for this vendor
    if (corr.who && corr.who.trim()) {
      const whoKey = corr.who.trim();
      if (!mem.vendorToWho[vendorKey]) mem.vendorToWho[vendorKey] = {};
      mem.vendorToWho[vendorKey][whoKey] = (mem.vendorToWho[vendorKey][whoKey] || 0) + 1;
      changed = true;
    }
    
    // We could add description/category learning here later
  });

  if (changed) saveMemory(mem);
}

/**
 * Suggests the most likely "Who?" based on past learned corrections.
 */
export function suggestWhoForVendor(vendorName) {
  if (!vendorName) return '';
  const mem = getMemory();
  const vendorKey = vendorName.trim().toLowerCase();
  
  const counts = mem.vendorToWho[vendorKey];
  if (!counts) return '';

  // Get the person with the highest historical count for this vendor
  let bestWho = '';
  let maxCount = 0;
  
  for (const [who, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      bestWho = who;
    }
  }

  // Only suggest if we've seen this mapping at least twice to avoid noisy suggestions
  return maxCount >= 2 ? bestWho : '';
}
