#!/usr/bin/env node
// /Users/montysharma/v11m2/scripts/removeOrphanedFiles.ts
// Script to safely remove orphaned files identified in code review

import * as fs from 'fs';
import * as path from 'path';

interface FileToRemove {
  path: string;
  reason: string;
  category: 'test-utility' | 'legacy-component' | 'backup-file' | 'temporary';
}

const filesToRemove: FileToRemove[] = [
  // Test Utilities (orphaned)
  {
    path: 'src/utils/reliabilityTest.ts',
    reason: 'Orphaned test utility - only imports itself',
    category: 'test-utility'
  },
  {
    path: 'src/utils/clueSystemTest.ts',
    reason: 'Orphaned test utility - limited usage',
    category: 'test-utility'
  },
  {
    path: 'src/utils/quickBalanceTools.ts',
    reason: 'Orphaned test utility - limited usage',
    category: 'test-utility'
  },
  
  // Legacy Components
  {
    path: 'src/pages/PlannerOriginal.tsx',
    reason: 'Backup of original planner - no longer needed',
    category: 'legacy-component'
  },
  {
    path: 'src/components/RefactorNotificationBanner.tsx',
    reason: 'Temporary refactor notification - refactor complete',
    category: 'temporary'
  },
  {
    path: 'src/utils/legacyCleanup.ts',
    reason: 'Legacy cleanup utility - no longer needed',
    category: 'legacy-component'
  },
  
  // Old Backup Files
  {
    path: 'src/utils/refactorBackup.ts',
    reason: 'Old refactor backup - refactor complete',
    category: 'backup-file'
  },
  {
    path: 'src/utils/preRefactorBackup.ts',
    reason: 'Pre-refactor backup - refactor complete',
    category: 'backup-file'
  }
  
  // Note: NOT removing rollbackPlan.ts as it's part of the new Phase 4 implementation
];

function removeOrphanedFiles(): void {
  console.log('🧹 Starting cleanup of orphaned files...\n');
  
  const projectRoot = path.resolve(process.cwd());
  let removedCount = 0;
  let skippedCount = 0;
  const errors: Array<{file: string, error: string}> = [];

  // Group files by category for better reporting
  const filesByCategory = filesToRemove.reduce((acc, file) => {
    if (!acc[file.category]) acc[file.category] = [];
    acc[file.category].push(file);
    return acc;
  }, {} as Record<string, FileToRemove[]>);

  // Process each category
  Object.entries(filesByCategory).forEach(([category, files]) => {
    console.log(`\n📁 ${category.toUpperCase().replace('-', ' ')}:`);
    
    files.forEach(file => {
      const filePath = path.join(projectRoot, file.path);
      
      try {
        if (fs.existsSync(filePath)) {
          // Create backup directory
          const backupDir = path.join(projectRoot, 'removed-files-backup', new Date().toISOString().split('T')[0]);
          const backupPath = path.join(backupDir, file.path);
          
          // Ensure backup directory exists
          fs.mkdirSync(path.dirname(backupPath), { recursive: true });
          
          // Copy to backup before removing
          fs.copyFileSync(filePath, backupPath);
          
          // Remove the file
          fs.unlinkSync(filePath);
          
          console.log(`  ✅ Removed: ${file.path}`);
          console.log(`     Reason: ${file.reason}`);
          console.log(`     Backup: ${backupPath}`);
          removedCount++;
        } else {
          console.log(`  ⏭️  Skipped: ${file.path} (file not found)`);
          skippedCount++;
        }
      } catch (error) {
        console.log(`  ❌ Error: ${file.path}`);
        console.log(`     ${error}`);
        errors.push({ file: file.path, error: String(error) });
      }
    });
  });

  // Summary
  console.log('\n📊 CLEANUP SUMMARY:');
  console.log('='.repeat(40));
  console.log(`Files removed: ${removedCount}`);
  console.log(`Files skipped: ${skippedCount}`);
  console.log(`Errors: ${errors.length}`);
  
  if (errors.length > 0) {
    console.log('\n❌ ERRORS:');
    errors.forEach(err => {
      console.log(`  - ${err.file}: ${err.error}`);
    });
  }
  
  console.log('\n💡 Notes:');
  console.log('- All removed files have been backed up to removed-files-backup/');
  console.log('- To restore a file, copy it back from the backup directory');
  console.log('- rollbackPlan.ts was NOT removed (part of Phase 4 implementation)');
  console.log('- createManagedStore.ts was NOT removed (needed until V2 migration complete)');
}

// Check for any imports of files we're about to remove
function checkForImports(): void {
  console.log('\n🔍 Checking for imports of files to be removed...\n');
  
  const projectRoot = path.resolve(process.cwd());
  const srcDir = path.join(projectRoot, 'src');
  
  // Get all TypeScript/JavaScript files
  const allFiles: string[] = [];
  
  function walkDir(dir: string): void {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        walkDir(filePath);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
        allFiles.push(filePath);
      }
    });
  }
  
  walkDir(srcDir);
  
  // Check each file for imports
  const importIssues: Array<{importingFile: string, importedFile: string}> = [];
  
  filesToRemove.forEach(fileToRemove => {
    const fileNameWithoutExt = path.basename(fileToRemove.path, path.extname(fileToRemove.path));
    
    allFiles.forEach(file => {
      try {
        const content = fs.readFileSync(file, 'utf-8');
        
        // Remove single-line comments and check for imports
        const contentWithoutComments = content
          .split('\n')
          .map(line => {
            // Remove single-line comments
            const commentIndex = line.indexOf('//');
            if (commentIndex !== -1) {
              return line.substring(0, commentIndex);
            }
            return line;
          })
          .join('\n');
        
        // Check for various import patterns
        const importPatterns = [
          `from ['"].*${fileNameWithoutExt}['"]`,
          `from ['"].*${fileNameWithoutExt}\\.`,
          `import\\s*\\(.*${fileNameWithoutExt}`,
          `require\\s*\\(.*${fileNameWithoutExt}`
        ];
        
        const hasImport = importPatterns.some(pattern => 
          new RegExp(pattern).test(contentWithoutComments)
        );
        
        if (hasImport && !file.includes(fileNameWithoutExt)) {
          importIssues.push({
            importingFile: path.relative(projectRoot, file),
            importedFile: fileToRemove.path
          });
        }
      } catch (error) {
        // Ignore read errors
      }
    });
  });
  
  if (importIssues.length > 0) {
    console.log('⚠️  WARNING: Found imports that will be broken:\n');
    importIssues.forEach(issue => {
      console.log(`  ${issue.importingFile} imports ${issue.importedFile}`);
    });
    console.log('\nPlease fix these imports before running the cleanup!');
    process.exit(1);
  } else {
    console.log('✅ No import issues found. Safe to proceed with cleanup.\n');
  }
}

// Run the cleanup
console.log('🚀 Orphaned File Cleanup Script\n');

// First check for imports
checkForImports();

// Ask for confirmation
console.log('\n⚠️  This will remove the orphaned files identified in the code review.');
console.log('All files will be backed up before removal.\n');

if (process.argv.includes('--force')) {
  removeOrphanedFiles();
} else {
  console.log('Run with --force flag to proceed with cleanup.');
  console.log('Example: npm run cleanup:orphaned -- --force');
}