const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class AuditService {
  async logAction({
    userId,
    entityType,
    action,
    details,
    ipAddress,
    userAgent,
    sessionId,
    status = 'success',
    errorDetails = null
  }) {
    try {
      return await prisma.auditLog.create({
        data: {
          user_id: userId,
          entity_type: entityType,
          action,
          details,
          ip_address: ipAddress,
          user_agent: userAgent,
          session_id: sessionId,
          status,
          error_details: errorDetails
        }
      });
    } catch (error) {
      console.error('Audit logging error:', error);
      // Don't throw the error to prevent disrupting the main operation
    }
  }

  async getAuditLogs({
    userId,
    entityType,
    action,
    startDate,
    endDate,
    status,
    page = 1,
    limit = 50
  }) {
    const where = {};
    if (userId) where.user_id = userId;
    if (entityType) where.entity_type = entityType;
    if (action) where.action = action;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              username: true,
              email: true
            }
          },
          session: {
            select: {
              device_info: true,
              ip_address: true
            }
          }
        },
        orderBy: { timestamp: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.auditLog.count({ where })
    ]);

    return {
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getAuditSummary({
    startDate,
    endDate,
    entityType,
    userId
  }) {
    const where = {};
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }
    if (entityType) where.entity_type = entityType;
    if (userId) where.user_id = userId;

    const [actionCounts, statusCounts, userActivity] = await Promise.all([
      // Count by action
      prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: true
      }),
      // Count by status
      prisma.auditLog.groupBy({
        by: ['status'],
        where,
        _count: true
      }),
      // User activity
      prisma.auditLog.groupBy({
        by: ['user_id'],
        where,
        _count: true,
        orderBy: {
          _count: {
            _all: 'desc'
          }
        },
        take: 10
      })
    ]);

    return {
      actionCounts,
      statusCounts,
      userActivity
    };
  }

  async cleanupOldLogs(daysToKeep = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    return await prisma.auditLog.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate
        }
      }
    });
  }
}

module.exports = new AuditService(); 