// /Users/montysharma/V11M2/src/services/fileEditingService.ts

import type { Storylet } from '../types/storylet';

// File editing service that interfaces with the MCP file tools
// Note: Direct file editing is not available in browser environment
// This service provides clipboard/instruction fallback methods
export class FileEditingService {
  
  // Determine which data file a storylet belongs to
  static getStoryletDataFile(storylet: Storylet): string {
    if (storylet.trigger.type === 'time') {
      const day = storylet.trigger.conditions.day;
      const week = storylet.trigger.conditions.week;
      
      if (day && day <= 2) {
        return 'immediateStorylets.ts';
      } else if (day && day <= 7 || week && week <= 1) {
        return 'frequentStorylets.ts';
      } else {
        return 'collegeStorylets.ts';
      }
    } else {
      return 'frequentStorylets.ts';
    }
  }
  
  // Update storylet in TypeScript file content
  static updateStoryletInFileContent(fileContent: string, storylet: Storylet): string | null {
    try {
      const storyletId = storylet.id;
      
      // Create the new storylet string with proper TypeScript formatting
      const storyletJson = JSON.stringify(storylet, null, 2);
      
      // Format for TypeScript object property
      const formattedStorylet = storyletJson
        .split('\n')
        .map((line, index) => {
          if (index === 0) return `  ${storyletId}: ${line}`;
          return `  ${line}`;
        })
        .join('\n');
      
      // Try to find existing storylet and replace it
      const storyletPattern = new RegExp(
        `(\\s+${storyletId}:\\s*{[\\s\\S]*?\\n\\s+})(?=,?\\s*\\n)`,
        'g'
      );
      
      if (storyletPattern.test(fileContent)) {
        console.log(`🔄 Replacing existing storylet: ${storyletId}`);
        return fileContent.replace(storyletPattern, formattedStorylet);
      } else {
        console.log(`➕ Adding new storylet: ${storyletId}`);
        
        // Find the position to insert the new storylet (before closing brace)
        const insertPosition = fileContent.lastIndexOf('\n};');
        if (insertPosition !== -1) {
          const beforeClosing = fileContent.substring(0, insertPosition);
          const afterClosing = fileContent.substring(insertPosition);
          
          // Check if we need a comma after the last storylet
          const needsComma = !beforeClosing.trim().endsWith(',');
          const comma = needsComma ? ',' : '';
          
          return `${beforeClosing}${comma}\n\n${formattedStorylet}${afterClosing}`;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error updating storylet in file content:', error);
      return null;
    }
  }
  
  // Save storylet by directly editing the data file
  static async saveStoryletToFile(storylet: Storylet): Promise<{
    success: boolean;
    method: string;
    message: string;
    filePath?: string;
  }> {
    const dataFile = FileEditingService.getStoryletDataFile(storylet);
    const relativePath = `src/data/${dataFile}`;
    const fullPath = `/Users/montysharma/V11M2/${relativePath}`;
    
    console.log(`🎯 Attempting to save storylet '${storylet.id}' to ${dataFile}`);
    
    try {
      // Create properly formatted storylet for file insertion
      const storyletJson = JSON.stringify(storylet, null, 2);
      const formattedForFile = this.formatStoryletForFile(storylet);
      
      const instructions = this.generateEnhancedInstructions(storylet, dataFile, formattedForFile);
      
      console.log(instructions.consoleMessage);
      
      // Try to copy the properly formatted version to clipboard
      if (navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(formattedForFile);
          return {
            success: false, // Still requires manual step, but streamlined
            method: 'enhanced_clipboard_workflow',
            message: `✅ Storylet '${storylet.id}' formatted and copied to clipboard!\n\n📋 Ready to paste into ${dataFile}\n\n🔄 Changes will persist after you save the file.`,
            filePath: fullPath
          };
        } catch (error) {
          console.warn('Clipboard copy failed:', error);
        }
      }
      
      return {
        success: false,
        method: 'enhanced_manual_workflow',
        message: `📝 Check console for properly formatted storylet to copy.\n\nFile: ${dataFile}\nStorylet: ${storylet.id}`,
        filePath: fullPath
      };
      
    } catch (error) {
      console.error('Error in saveStoryletToFile:', error);
      
      return {
        success: false,
        method: 'error',
        message: `Failed to save storylet. Check console for details.`,
        filePath: fullPath
      };
    }
  }
  
  // Format storylet for direct insertion into TypeScript file
  private static formatStoryletForFile(storylet: Storylet): string {
    const storyletJson = JSON.stringify(storylet, null, 2);
    
    // Format for TypeScript object property with proper indentation
    const formattedStorylet = storyletJson
      .split('\n')
      .map((line, index) => {
        if (index === 0) return `  ${storylet.id}: ${line}`;
        return `  ${line}`;
      })
      .join('\n');
    
    return formattedStorylet + ',';
  }
  
  // Generate enhanced update instructions with streamlined workflow
  private static generateEnhancedInstructions(storylet: Storylet, dataFile: string, formattedStorylet: string) {
    const consoleMessage = `
🎯 STORYLET PERSISTENCE WORKFLOW:
=====================================
📁 File: src/data/${dataFile}
📝 Storylet: ${storylet.id}
🔄 Status: Formatted and ready for insertion

📋 CLIPBOARD CONTAINS:
${formattedStorylet}

🚀 QUICK STEPS TO MAKE PERMANENT:
1. Open src/data/${dataFile} in your editor
2. Find existing '${storylet.id}' OR find a good spot to add new storylet
3. Paste from clipboard (Ctrl+V / Cmd+V)
4. Save the file

✅ Your storylet is already active in the current session!
💾 After saving the file, changes will persist across restarts.
=====================================`;

    const userMessage = `Ready to make persistent!\n1. Open ${dataFile}\n2. Paste the formatted storylet\n3. Save file`;

    return { consoleMessage, userMessage };
  }
}

// Export convenience function
export const saveStoryletToDataFile = FileEditingService.saveStoryletToFile.bind(FileEditingService);
