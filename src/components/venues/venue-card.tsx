"use client"

import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Venue, VenueBooking, VenueCatalogue } from "@prisma/client"

interface VenueCardProps {
  venue: Venue & {
    catalogue: VenueCatalogue[]
    status: "available" | "booked" | "maintenance"
    nextBooking: VenueBooking | null
  }
}

export function VenueCard({ venue }: VenueCardProps) {
  const getBadgeVariant = (status: string) => {
    switch (status) {
      case "available":
        return "success"
      case "booked":
        return "destructive"
      case "maintenance":
        return "warning"
      default:
        return "secondary"
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="aspect-video relative bg-gray-100">
        {venue.image_url ? (
          <img
            src={venue.image_url}
            alt={venue.name}
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            No image available
          </div>
        )}
      </div>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{venue.name}</CardTitle>
            <CardDescription>{venue.location}</CardDescription>
          </div>
          <Badge variant={getBadgeVariant(venue.status)}>
            {venue.status.charAt(0).toUpperCase() + venue.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gray-500"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span>Capacity: {venue.capacity}</span>
          </div>
          {venue.description && (
            <p className="text-sm text-gray-600">{venue.description}</p>
          )}
          {venue.nextBooking && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-500">Next Booking</h4>
              <p className="text-sm">
                {format(new Date(venue.nextBooking.event_date), "PPP p")} -{" "}
                {venue.nextBooking.event_name}
              </p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button className="flex-1" variant="outline">
          View Details
        </Button>
        <Button className="flex-1" disabled={venue.status !== "available"}>
          Book Now
        </Button>
      </CardFooter>
    </Card>
  )
} 