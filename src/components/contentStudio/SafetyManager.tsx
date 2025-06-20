// /Users/montysharma/V11M2/src/components/contentStudio/SafetyManager.tsx

import React, { useState, useEffect } from 'react';
import HelpTooltip from '../ui/HelpTooltip';

interface SafetyManagerProps {
  onBackupCreate: () => boolean;
}

const SafetyManager: React.FC<SafetyManagerProps> = ({ onBackupCreate }) => {
  const [backupCount, setBackupCount] = useState(0);
  const [lastBackup, setLastBackup] = useState<string | null>(null);

  useEffect(() => {
    // Count existing backups
    const backups = Object.keys(localStorage).filter(key => key.startsWith('content_backup_'));
    setBackupCount(backups.length);
    
    if (backups.length > 0) {
      const latest = backups.sort().pop();
      if (latest) {
        const timestamp = latest.replace('content_backup_', '');
        setLastBackup(new Date(timestamp).toLocaleString());
      }
    }
  }, []);

  const handleManualBackup = () => {
    const success = onBackupCreate();
    if (success) {
      setBackupCount(prev => prev + 1);
      setLastBackup(new Date().toLocaleString());
    }
  };

  const restoreBackup = () => {
    const backups = Object.keys(localStorage)
      .filter(key => key.startsWith('content_backup_'))
      .sort()
      .reverse();
    
    if (backups.length === 0) {
      alert('No backups available');
      return;
    }

    const latestBackup = backups[0];
    try {
      const backupData = JSON.parse(localStorage.getItem(latestBackup) || '');
      
      if (confirm(`Restore backup from ${new Date(backupData.timestamp).toLocaleString()}?\n\nThis will overwrite current content!`)) {
        // This would restore the backup - implementation depends on your store structure
        console.log('Would restore backup:', backupData);
        alert('Backup restore functionality coming soon!');
      }
    } catch (error) {
      alert('Failed to restore backup: Invalid backup data');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 text-sm text-blue-100">
        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
        <span>Safe Mode</span>
      </div>
      
      <div className="flex items-center gap-1">
        <button
          onClick={handleManualBackup}
          className="p-1 rounded hover:bg-blue-700 transition-colors"
          title="Create manual backup"
        >
          💾
        </button>
        
        <button
          onClick={restoreBackup}
          className="p-1 rounded hover:bg-blue-700 transition-colors"
          title="Restore latest backup"
          disabled={backupCount === 0}
        >
          📁
        </button>
        
        <HelpTooltip 
          content={`Backups: ${backupCount}${lastBackup ? `\nLast: ${lastBackup}` : ''}\n\nAuto-backup runs before risky operations. Manual backup available anytime.`}
          position="bottom"
        />
      </div>
    </div>
  );
};

export default SafetyManager;