"use client"

import { Club, ClubMember, User } from "@prisma/client"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface ClubCardProps {
  club: Club & {
    members: (ClubMember & {
      user: {
        username: string
        email: string
      }
    })[]
  }
}

export function ClubCard({ club }: ClubCardProps) {
  const president = club.members.find(member => member.role === 'President')

  return (
    <Link href={`/clubs/${club.id}`} className="block">
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">{club.name}</CardTitle>
              {president && (
                <CardDescription>
                  President: {president.user.username}
                </CardDescription>
              )}
            </div>
            <Badge variant="secondary">
              {club.members.length} {club.members.length === 1 ? 'Member' : 'Members'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            {club.description || 'No description available'}
          </p>
        </CardContent>
      </Card>
    </Link>
  )
} 