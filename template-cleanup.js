// Template System Cleanup Script
// Run this in browser console to remove template-related localStorage

console.log('🧹 Cleaning up template system localStorage...');

// Remove template-specific localStorage keys
const templateKeys = [
  'storylet_templates',
  'template_usage_stats',
  'template_history'
];

let removedCount = 0;

templateKeys.forEach(key => {
  if (localStorage.getItem(key)) {
    localStorage.removeItem(key);
    console.log(`🗑️ Removed template key: ${key}`);
    removedCount++;
  }
});

// Also remove any keys that might be template-related
Object.keys(localStorage).forEach(key => {
  if (key.includes('template') && !key.includes('storylet')) {
    localStorage.removeItem(key);
    console.log(`🗑️ Removed additional template key: ${key}`);
    removedCount++;
  }
});

console.log(`✅ Template cleanup complete. Removed ${removedCount} keys.`);
console.log('🔄 Template system has been completely removed from the codebase.');