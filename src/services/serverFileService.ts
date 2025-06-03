// /Users/montysharma/V11M2/src/services/serverFileService.ts

import type { Storylet } from '../types/storylet';

// Server-side file operations using MCP tools
// This service is designed to be called by the FileEditingService
export class ServerFileService {
  
  /**
   * Save a storylet to the appropriate data file
   * @param storylet The storylet to save
   * @returns Promise with success status and message
   */
  static async saveStorylet(storylet: Storylet): Promise<{
    success: boolean;
    message: string;
    error?: string;
  }> {
    try {
      // Determine the appropriate file
      const dataFile = this.getStoryletDataFile(storylet);
      const filePath = `/Users/montysharma/V11M2/src/data/${dataFile}`;
      
      console.log(`🎯 Saving storylet '${storylet.id}' to ${dataFile}`);
      
      // This is a placeholder for the actual implementation
      // In a real implementation, this would:
      // 1. Read the current file using MCP read_file
      // 2. Update the storylet in the content
      // 3. Write the updated content using MCP edit_file or write_file
      
      // For now, we'll simulate success but indicate it needs MCP integration
      return {
        success: false,
        message: 'Server-side file operations need MCP integration',
        error: 'Direct file operations require server-side MCP tool access'
      };
      
    } catch (error) {
      console.error('Error in ServerFileService.saveStorylet:', error);
      return {
        success: false,
        message: 'Failed to save storylet',
        error: String(error)
      };
    }
  }
  
  /**
   * Determine which data file a storylet belongs to
   */
  private static getStoryletDataFile(storylet: Storylet): string {
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
  
  /**
   * Update storylet in TypeScript file content
   */
  private static updateStoryletInFileContent(fileContent: string, storylet: Storylet): string | null {
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
}
