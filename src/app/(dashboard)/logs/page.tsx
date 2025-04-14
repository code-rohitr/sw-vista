import { prisma } from "@/lib/prisma"
import { LogCard } from "@/components/logs/log-card"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"

async function getLogs() {
  try {
    const logs = await prisma.auditLog.findMany({
      include: {
        user: {
          select: {
            username: true,
            email: true
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      }
    })
    return logs
  } catch (error) {
    console.error('Error fetching logs:', error)
    return []
  }
}

export default async function LogsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/login')
  }

  // Allow both SWO and admin to access this page
  if (session.user?.role !== 'SWO' && session.user?.role !== 'admin' && session.user?.role !== 'SC' && session.user?.role !== 'SECURITY') {
    redirect('/dashboard')
  }

  const logs = await getLogs()

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Audit Logs</h1>
      </div>
      
      <div className="grid gap-6">
        {logs.length === 0 ? (
          <p className="text-gray-500 text-center">No logs found</p>
        ) : (
          logs.map((log) => (
            <LogCard key={log.id} log={log} />
          ))
        )}
      </div>
    </div>
  )
} 