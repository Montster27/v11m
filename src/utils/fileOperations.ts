// /Users/montysharma/V11M2/src/utils/fileOperations.ts

import type { Storylet } from '../types/storylet';

// Helper function to determine which data file a storylet belongs to
export const getStoryletDataFile = (storylet: Storylet): string => {
  // Check trigger conditions to determine the appropriate file
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
    // Resource and flag-based storylets typically go in frequentStorylets
    return 'frequentStorylets.ts';
  }
};

// Helper function to update storylet in file content
export const updateStoryletInFileContent = (fileContent: string, storylet: Storylet): string | null => {
  try {
    const storyletId = storylet.id;
    
    // Create the new storylet string with proper indentation
    const storyletJson = JSON.stringify(storylet, null, 2);
    const indentedStorylet = storyletJson.split('\n').map((line, index) => {
      if (index === 0) return `  ${storyletId}: ${line}`;
      return `  ${line}`;
    }).join('\n');
    
    // Try to find and replace the existing storylet
    // This regex looks for the storylet ID followed by a colon and its object
    const storyletRegex = new RegExp(
      `(\\s+${storyletId}:\\s*{[\\s\\S]*?\\n\\s+})(?=,?\\s*\\n)`,
      'g'
    );
    
    if (storyletRegex.test(fileContent)) {
      // Replace existing storylet
      console.log(`🔄 Replacing existing storylet '${storyletId}'`);
      return fileContent.replace(storyletRegex, indentedStorylet);
    } else {
      // Add new storylet before the closing brace
      console.log(`➕ Adding new storylet '${storyletId}'`);
      
      // Find the last storylet entry and add after it
      const lastStoryletRegex = /([\s\S]*)(\\n\\s+[^}]+})(\\s*\\n};)/;
      const match = fileContent.match(lastStoryletRegex);
      
      if (match) {
        return `${match[1]}${match[2]},\n\n${indentedStorylet}${match[3]}`;
      } else {
        // Fallback: add before closing brace
        const closingBraceRegex = /(\\s*\\n};\\s*)$/;
        return fileContent.replace(closingBraceRegex, `,\n\n${indentedStorylet}\n};`);
      }
    }
  } catch (error) {
    console.error('Error updating storylet in file content:', error);
    return null;
  }
};

// Function to save storylet to its original data file
export const saveStoryletToDataFile = async (storylet: Storylet): Promise<{ success: boolean; method: string; message: string }> => {
  const dataFile = getStoryletDataFile(storylet);
  const filePath = `/Users/montysharma/V11M2/src/data/${dataFile}`;
  
  try {
    console.log(`📖 Reading file: ${dataFile}`);
    
    // This would need to be replaced with actual file reading when integrated
    // For now, we'll return a fallback method
    const jsonContent = JSON.stringify({ [storylet.id]: storylet }, null, 2);
    
    console.log(`🔧 AUTO-SAVE NOT FULLY IMPLEMENTED YET`);
    console.log(`📁 Target file: src/data/${dataFile}`);
    console.log(`📝 Storylet to update: '${storylet.id}'`);
    console.log(`📋 JSON content:`, jsonContent);
    
    // Try clipboard copy as primary method for now
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(jsonContent);
        return {
          success: false,
          method: 'clipboard_ready',
          message: `Ready to update ${dataFile} - JSON copied to clipboard`
        };
      } catch (clipboardError) {
        return {
          success: false,
          method: 'manual_only',
          message: `Ready to update ${dataFile} - check console for JSON`
        };
      }
    }
    
    return {
      success: false,
      method: 'manual_only', 
      message: `Ready to update ${dataFile} - check console for JSON`
    };
    
    // TODO: Implement actual file operations when integrated with the tool system
    // const currentContent = await readFile(filePath);
    // const updatedContent = updateStoryletInFileContent(currentContent, storylet);
    // await writeFile(filePath, updatedContent);
    // return { success: true, method: 'auto_file_edit', message: `Successfully updated ${dataFile}` };
    
  } catch (error) {
    console.error('Error in saveStoryletToDataFile:', error);
    
    const jsonContent = JSON.stringify({ [storylet.id]: storylet }, null, 2);
    console.log(`❌ SAVE FAILED - MANUAL UPDATE REQUIRED:`);
    console.log(`📁 File: src/data/${dataFile}`);
    console.log(`📝 Replace storylet '${storylet.id}' with:`);
    console.log(jsonContent);
    
    return {
      success: false,
      method: 'error_fallback',
      message: `Save failed - check console for manual update instructions`
    };
  }
};
