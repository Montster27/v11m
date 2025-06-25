// /Users/montysharma/V11M2/src/utils/versionCheck.ts
// Simple version check to verify code updates are being served

export const VERSION = '2024-12-19-FIX-3';

export const checkCodeVersion = () => {
  console.log(`
🔍 CODE VERSION CHECK
====================
Current Code Version: ${VERSION}
Page Loaded: ${new Date().toISOString()}

If you see an OLD version after making changes, then:
1. Browser is caching the JavaScript files
2. Vite HMR is not working
3. You're accessing the wrong server

SOLUTIONS TO TRY:
1. Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+F5 (Windows)
2. Open DevTools > Network > Disable cache
3. Stop dev server and run: rm -rf node_modules/.vite
4. Check if you have multiple terminals running 'npm run dev'
5. Try incognito/private browsing mode
6. Check the URL - ensure it's localhost:5173
`);

  // Also add a visual indicator
  const indicator = document.createElement('div');
  indicator.style.cssText = `
    position: fixed;
    bottom: 10px;
    left: 10px;
    background: #10b981;
    color: white;
    padding: 5px 10px;
    border-radius: 4px;
    font-size: 12px;
    z-index: 9999;
  `;
  indicator.textContent = `Code Version: ${VERSION}`;
  document.body.appendChild(indicator);
};

// Auto-run
if (typeof window !== 'undefined') {
  (window as any).checkCodeVersion = checkCodeVersion;
  (window as any).CODE_VERSION = VERSION;
  
  // Auto check on load
  setTimeout(() => {
    checkCodeVersion();
    console.log('💡 TIP: If version is old, the browser is serving cached files!');
  }, 1000);
}
