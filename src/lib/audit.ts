/**
 * Utility functions for audit logging
 */

export async function logAuditEvent(token: string, data: {
  action: string;
  entityType: string;
  entityId: number;
  userId?: number;
}) {
  try {
    const response = await fetch('/api/audit-logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      console.error('Failed to log audit event:', await response.text());
    }
    
    return response.ok;
  } catch (error) {
    console.error('Error logging audit event:', error);
    return false;
  }
}