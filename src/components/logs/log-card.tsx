import { AuditLog } from "@prisma/client"

interface LogCardProps {
  log: AuditLog & {
    user: {
      username: string
      email: string
    }
  }
}

export function LogCard({ log }: LogCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold">{log.action}</h3>
          <p className="text-sm text-gray-500">
            {log.entity_type} #{log.entity_id}
          </p>
        </div>
        <span className="text-sm text-gray-500">
          {new Date(log.timestamp).toLocaleString()}
        </span>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center text-sm">
          <span className="font-medium w-24">User:</span>
          <span>{log.user.username} ({log.user.email})</span>
        </div>
      </div>
    </div>
  )
} 