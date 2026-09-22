/**
 * Audit logging utility for Australian Privacy Act 1988 / APP compliance
 * In a production app, these logs would be securely stored and transmitted
 */

import { anonymizeData } from '../utils/encryption';

type AuditAction = 
  | 'login'
  | 'logout'
  | 'data_access'
  | 'data_create'
  | 'data_update'
  | 'data_delete'
  | 'export_data'
  | 'settings_change'
  | 'password_change'
  | 'consent_given'
  | 'consent_revoked';

type AuditLogEntry = {
  timestamp: string;
  userUniqueId: string; // Changed from userId to userUniqueId
  action: AuditAction;
  details: string;
  ipAddress?: string;
  deviceInfo?: string;
};

class AuditLogger {
  private logs: AuditLogEntry[] = [];
  private maxLocalLogs: number = 1000; // Limit local storage
  
  constructor() {
    // In a real app, we would load existing logs from secure storage
    this.loadLogs();
  }
  
  private loadLogs(): void {
    // In a real app, load logs from secure storage
    // For demo purposes, we'll just initialize an empty array
    this.logs = [];
  }
  
  private saveLogs(): void {
    // In a real app, save logs to secure storage
    // For demo purposes, we'll just log to console
    console.log('Saving audit logs:', this.logs.length);
  }
  
  private getDeviceInfo(): string {
    // In a real app, collect device information
    return 'F365 Mobile App';
  }
  
  public log(userUniqueId: string, action: AuditAction, details: string): void {
    // Anonymize any PII in the details
    const sanitizedDetails = anonymizeData({ details }).details;
    
    const logEntry: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      userUniqueId, // Using uniqueId instead of userId
      action,
      details: sanitizedDetails,
      deviceInfo: this.getDeviceInfo()
    };
    
    this.logs.push(logEntry);
    
    // Trim logs if they exceed the maximum
    if (this.logs.length > this.maxLocalLogs) {
      // In a real app, we would sync with server before trimming
      this.logs = this.logs.slice(-this.maxLocalLogs);
    }
    
    this.saveLogs();
    
    // In a production app, we would periodically sync logs with a secure server
    this.syncLogsWithServer();
  }
  
  private syncLogsWithServer(): void {
    // In a real app, this would securely transmit logs to a Privacy Act-compliant server
    // For demo purposes, we'll just log to console
    console.log('Syncing audit logs with server...');
  }
  
  public getLogsForUser(userUniqueId: string): AuditLogEntry[] {
    return this.logs.filter(log => log.userUniqueId === userUniqueId);
  }
  
  public clearLogs(): void {
    // In a real app, this would be a privileged operation
    this.logs = [];
    this.saveLogs();
  }
}

// Singleton instance
export const auditLogger = new AuditLogger();

// Helper functions for common audit events
export const logDataAccess = (userUniqueId: string, dataType: string, dataId?: string): void => {
  auditLogger.log(
    userUniqueId,
    'data_access',
    `Accessed ${dataType}${dataId ? ` (ID: ${dataId})` : ''}`
  );
};

export const logDataCreate = (userUniqueId: string, dataType: string, dataId?: string): void => {
  auditLogger.log(
    userUniqueId,
    'data_create',
    `Created ${dataType}${dataId ? ` (ID: ${dataId})` : ''}`
  );
};

export const logDataUpdate = (userUniqueId: string, dataType: string, dataId?: string): void => {
  auditLogger.log(
    userUniqueId,
    'data_update',
    `Updated ${dataType}${dataId ? ` (ID: ${dataId})` : ''}`
  );
};

export const logDataDelete = (userUniqueId: string, dataType: string, dataId?: string): void => {
  auditLogger.log(
    userUniqueId,
    'data_delete',
    `Deleted ${dataType}${dataId ? ` (ID: ${dataId})` : ''}`
  );
};

export const logLogin = (userUniqueId: string): void => {
  auditLogger.log(userUniqueId, 'login', 'User logged in');
};

export const logLogout = (userUniqueId: string): void => {
  auditLogger.log(userUniqueId, 'logout', 'User logged out');
};

export const logExportData = (userUniqueId: string, dataType: string): void => {
  auditLogger.log(userUniqueId, 'export_data', `Exported ${dataType} data`);
};

export const logSettingsChange = (userUniqueId: string, setting: string): void => {
  auditLogger.log(userUniqueId, 'settings_change', `Changed setting: ${setting}`);
};

export const logConsentGiven = (userUniqueId: string, consentType: string): void => {
  auditLogger.log(userUniqueId, 'consent_given', `Gave consent for: ${consentType}`);
};

export const logConsentRevoked = (userUniqueId: string, consentType: string): void => {
  auditLogger.log(userUniqueId, 'consent_revoked', `Revoked consent for: ${consentType}`);
};