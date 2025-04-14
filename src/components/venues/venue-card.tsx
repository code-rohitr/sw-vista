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
import { Calendar, Clock, MapPin, Users } from "lucide-react"
import Image from "next/image"

interface VenueCardProps {
  venue: Venue & {
    catalogue: VenueCatalogue[]
    status: "available" | "booked" | "maintenance"
    nextBooking: VenueBooking | null
  }
}

export function VenueCard({ venue }: VenueCardProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [imageError, setImageError] = useState(false)

  // Get status badge variant and text
  const getStatusBadge = () => {
    switch (venue.status) {
      case "available":
        return { variant: "success" as const, text: "Available Now" }
      case "booked":
        return { variant: "secondary" as const, text: "Currently Booked" }
      case "maintenance":
        return { variant: "destructive" as const, text: "Under Maintenance" }
    }
  }

  const statusBadge = getStatusBadge()

  // Function to validate image URL
  const getImageUrl = () => {
    if (imageError || !venue.image_url) {
      return "/images/venue.jpg"
    }
    try {
      const url = new URL(venue.image_url)
      return url.toString()
    } catch {
      return "/images/venue.jpg"
    }
  }

  return (
    <Card className="flex flex-col h-full group">
      <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
        <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-colors z-10" />
        <Image
          src={getImageUrl()}
          alt={venue.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          onError={() => setImageError(true)}
          priority={false}
        />
        <div className="absolute inset-0 z-20 p-4 flex flex-col justify-between">
          <Badge 
            className="self-end" 
            variant={statusBadge.variant}
          >
            {venue.location}
          </Badge>
          <h3 className="text-lg font-semibold text-white">{venue.name}</h3>
        </div>
      </div>
      <CardHeader className="pb-2">
        <CardDescription className="flex items-center gap-1">
          <MapPin className="h-4 w-4" />
          {venue.location}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Capacity: {venue.capacity} people</span>
          </div>
          
          {venue.status === "booked" && venue.nextBooking && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Current Event: {venue.nextBooking.event_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <div className="text-sm text-muted-foreground">
                  Until {format(new Date(venue.nextBooking.end_time), "h:mm a")}
                </div>
              </div>
            </div>
          )}

          {venue.catalogue && venue.catalogue.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2">Available Equipment</h3>
              <div className="flex flex-wrap gap-2">
                {venue.catalogue.map((item) => (
                  <Badge key={item.id} variant="outline">
                    {item.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {venue.description && (
            <p className="text-sm text-muted-foreground">
              {venue.description}
            </p>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button 
              className="w-full border-2 cursor-pointer" 
              disabled={venue.status === "maintenance"}
              variant={venue.status === "available" ? "secondary" : "secondary"}
            >
              {venue.status === "available" 
                ? "Book Now" 
                : venue.status === "maintenance"
                ? "Unavailable"
                : "Check Availability"}
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