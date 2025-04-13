"use client"

import { Button } from "@/components/ui/button"
import { Edit } from "lucide-react"
import { useRouter } from "next/navigation"

interface ClubHeaderProps {
  clubName: string
  canEdit: boolean
}

export function ClubHeader({ clubName, canEdit }: ClubHeaderProps) {
  const router = useRouter()

  return (
    <div className="flex justify-between items-center mb-8">
      <h1 className="text-3xl font-bold">{clubName}</h1>
      <div className="flex gap-4">
        {canEdit && (
          <Button variant="outline" className="gap-2">
            <Edit className="h-4 w-4" />
            Edit
          </Button>
        )}
        <Button 
          variant="outline" 
          onClick={() => router.back()}
        >
          Back
        </Button>
      </div>
    </div>
  )
} 