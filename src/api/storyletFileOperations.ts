// /Users/montysharma/V11M2/src/api/storyletFileOperations.ts

import type { Storylet } from '../types/storylet';

// Server-side storylet file operations using MCP tools
export class StoryletFileOperations {
  
  // Read a storylet data file
  static async readStoryletFile(filePath: string): Promise<string | null> {
    try {
      // This would use the MCP read_file tool
      // For now, return null to indicate file operations aren't available
      return null;
    } catch (error) {
      console.error('Failed to read storylet file:', error);
      return null;
    }
  }
  
  // Write updated content to a storylet data file
  static async writeStoryletFile(filePath: string, content: string): Promise<boolean> {
    try {
      // This would use the MCP write_file tool
      // For now, return false to indicate file operations aren't available
      return false;
    } catch (error) {
      console.error('Failed to write storylet file:', error);
      return false;
    }
  }
  
  // Update a specific storylet in the file
  static async updateStoryletInFile(filePath: string, storylet: Storylet): Promise<boolean> {
    try {
      const currentContent = await this.readStoryletFile(filePath);
      
      if (!currentContent) {
        console.error('Could not read current file content');
        return false;
      }
      
      const updatedContent = this.updateStoryletInContent(currentContent, storylet);
      
      if (!updatedContent) {
        console.error('Could not update storylet in content');
        return false;
      }
      
      return await this.writeStoryletFile(filePath, updatedContent);
      
    } catch (error) {
      console.error('Failed to update storylet in file:', error);
      return false;
    }
  }
  
  // Update storylet in file content (same logic as FileEditingService)
  private static updateStoryletInContent(fileContent: string, storylet: Storylet): string | null {
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
