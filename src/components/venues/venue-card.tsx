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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Venue, VenueBooking, VenueCatalogue } from "@prisma/client"
import { useState } from "react"
import { BookingForm } from "./booking-form"
import { useQuery } from "@tanstack/react-query"

interface VenueCardProps {
  venue: Venue & {
    catalogue: VenueCatalogue[]
    status: "available" | "booked" | "maintenance"
    nextBooking: VenueBooking | null
  }
}

export function VenueCard({ venue }: VenueCardProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  // Fetch all venues to pass to the booking form
  const { data: venues } = useQuery({
    queryKey: ["venues"],
    queryFn: async () => {
      const response = await fetch("/api/venues")
      if (!response.ok) throw new Error("Failed to fetch venues")
      return response.json()
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>{venue.name}</CardTitle>
        <CardDescription>{venue.location}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium">Status</h3>
            <Badge
              variant={
                venue.status === "available"
                  ? "default"
                  : venue.status === "booked"
                  ? "secondary"
                  : "destructive"
              }
            >
              {venue.status === "available"
                ? "Available"
                : venue.status === "booked"
                ? "Booked"
                : "Under Maintenance"}
            </Badge>
          </div>
          {venue.status === "booked" && venue.nextBooking && (
            <div>
              <h3 className="text-sm font-medium">Next Available</h3>
              <p>
                {format(new Date(venue.nextBooking.end_time), "PPP p")}
              </p>
            </div>
          )}
          <div>
            <h3 className="text-sm font-medium">Capacity</h3>
            <p>{venue.capacity} people</p>
          </div>
          {venue.amenities && venue.amenities.length > 0 && (
            <div>
              <h3 className="text-sm font-medium">Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {venue.amenities.map((amenity) => (
                  <Badge key={amenity} variant="outline">
                    {amenity}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {venue.catalogue && venue.catalogue.length > 0 && (
            <div>
              <h3 className="text-sm font-medium">Equipment</h3>
              <div className="flex flex-wrap gap-2">
                {venue.catalogue.map((item) => (
                  <Badge key={item.id} variant="outline">
                    {item.name} ({item.quantity})
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button className="w-full" disabled={venue.status !== "available"}>
              Book Now
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[400px] sm:w-[540px]">
            <SheetHeader>
              <SheetTitle>Book {venue.name}</SheetTitle>
              <SheetDescription>
                Fill in the details to book this venue
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6">
              <BookingForm 
                venueId={venue.id} 
                onSuccess={() => setIsSheetOpen(false)} 
              />
            </div>
          </SheetContent>
        </Sheet>
      </CardFooter>
    </Card>
  )
} 