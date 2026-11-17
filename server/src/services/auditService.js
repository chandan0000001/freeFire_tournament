import { AuditLog } from '../models/AuditLog.js';

export const logAudit = async ({ action, performedBy, targetEntity, targetId, details, changes, ipAddress }) => {
  try {
    await AuditLog.create({
      action,
      performedBy: performedBy?._id || performedBy,
      performedByName: performedBy?.name || 'System Admin',
      targetEntity,
      targetId,
      details,
      changes,
      ipAddress: ipAddress || 'unknown',
    });
  } catch (error) {
    console.error(`[Audit Log Failed]: ${error.message}`);
  }
};
