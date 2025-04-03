const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class SessionService {
  async createSession(userId, deviceInfo, ipAddress, userAgent, expiresIn = 24 * 60 * 60 * 1000) {
    const expiresAt = new Date(Date.now() + expiresIn);
    
    return await prisma.userSession.create({
      data: {
        user_id: userId,
        expires_at: expiresAt,
        device_info: deviceInfo,
        ip_address: ipAddress,
        user_agent: userAgent,
        is_active: true
      }
    });
  }

  async validateSession(sessionId) {
    const session = await prisma.userSession.findUnique({
      where: { id: sessionId },
      include: { user: true }
    });

    if (!session) {
      return null;
    }

    if (!session.is_active || new Date() > session.expires_at) {
      await this.invalidateSession(sessionId);
      return null;
    }

    // Update last active timestamp
    await prisma.userSession.update({
      where: { id: sessionId },
      data: { last_active: new Date() }
    });

    return session;
  }

  async invalidateSession(sessionId) {
    return await prisma.userSession.update({
      where: { id: sessionId },
      data: { is_active: false }
    });
  }

  async invalidateAllUserSessions(userId, exceptSessionId = null) {
    const where = {
      user_id: userId,
      is_active: true
    };

    if (exceptSessionId) {
      where.NOT = { id: exceptSessionId };
    }

    return await prisma.userSession.updateMany({
      where,
      data: { is_active: false }
    });
  }

  async getActiveSessions(userId) {
    return await prisma.userSession.findMany({
      where: {
        user_id: userId,
        is_active: true,
        expires_at: { gt: new Date() }
      },
      orderBy: { last_active: 'desc' }
    });
  }

  async cleanupExpiredSessions() {
    return await prisma.userSession.updateMany({
      where: {
        expires_at: { lt: new Date() },
        is_active: true
      },
      data: { is_active: false }
    });
  }
}

module.exports = new SessionService(); 