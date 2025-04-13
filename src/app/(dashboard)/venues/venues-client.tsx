"use client"

import { useState, useEffect } from "react"
import { VenueCard } from "@/components/venues/venue-card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function VenuesClient() {
  const [venues, setVenues] = useState([])
  const [locations, setLocations] = useState([])
  const [search, setSearch] = useState("")
  const [location, setLocation] = useState("all")
  const [status, setStatus] = useState("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchVenues()
  }, [search, location, status])

  const fetchVenues = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.append("search", search)
      if (location !== "all") params.append("location", location)
      if (status !== "all") params.append("status", status)

      const response = await fetch(`/api/venues?${params.toString()}`)
      if (!response.ok) throw new Error("Failed to fetch venues")
      
      const data = await response.json()
      setVenues(data)

      // Extract unique locations from venues data
      const uniqueLocations = Array.from(
        new Set(data.map((venue) => venue.location))
      ).sort()
      setLocations(uniqueLocations)
    } catch (error) {
      console.error("Error fetching venues:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Venues</h1>
        <div className="flex gap-4">
          <Input
            type="search"
            placeholder="Search venues..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
          <Select value={location} onValueChange={setLocation}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locations.map((loc) => (
                <SelectItem key={loc} value={loc}>
                  {loc}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="booked">Booked</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="h-96 bg-gray-100 rounded-lg animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {venues.map((venue) => (
            <VenueCard key={venue.id} venue={venue} />
          ))}
        </div>
      )}
    </div>
  )
} 