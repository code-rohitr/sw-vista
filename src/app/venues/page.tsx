"use client"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { Sidebar } from "@/components/sidebar"
import { useState } from "react"

const venuesData = [
  {
    id: 1,
    name: "505",
    landmark: "Academic Block 4",
    capacity: 140,
    status: "booked",
  },
  {
    id: 2,
    name: "203",
    landmark: "Academic Block 2",
    capacity: 80,
    status: "available",
  },
  {
    id: 3,
    name: "302",
    landmark: "Academic Block 5",
    capacity: 120,
    status: "unavailable",
  },
  {
    id: 4,
    name: "405",
    landmark: "Academic Block 4",
    capacity: 100,
    status: "available",
  },
  {
    id: 5,
    name: "201",
    landmark: "Academic Block 2",
    capacity: 90,
    status: "booked",
  },
  {
    id: 6,
    name: "506",
    landmark: "Academic Block 5",
    capacity: 150,
    status: "available",
  },
]

export default function VenuesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLocation, setSelectedLocation] = useState("all-locations")
  const [selectedStatus, setSelectedStatus] = useState("all-status")

  const filteredVenues = venuesData.filter(venue => {
    const matchesSearch = venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         venue.landmark.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesLocation = selectedLocation === "all-locations" || 
                           (selectedLocation === "block-2" && venue.landmark.includes("Block 2")) ||
                           (selectedLocation === "block-4" && venue.landmark.includes("Block 4")) ||
                           (selectedLocation === "block-5" && venue.landmark.includes("Block 5"))
    const matchesStatus = selectedStatus === "all-status" || 
                         venue.status === selectedStatus

    return matchesSearch && matchesLocation && matchesStatus
  })

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Header */}
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center justify-between mb-8 gap-4 pb-4 border-b"
          >
            <h1 className="text-2xl font-bold">Venues</h1>
            
            <div className="flex items-center gap-4">
              <div className="relative w-64">
                <Input
                  type="search"
                  placeholder="Search venues..."
                  className="w-full rounded-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Select 
                defaultValue="all-locations"
                onValueChange={setSelectedLocation}
              >
                <SelectTrigger className="w-[180px] bg-black text-white">
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 text-white">
                  <SelectItem value="all-locations">All Locations</SelectItem>
                  <SelectItem value="block-2">Academic Block 2</SelectItem>
                  <SelectItem value="block-4">Academic Block 4</SelectItem>
                  <SelectItem value="block-5">Academic Block 5</SelectItem>
                </SelectContent>
              </Select>

              <Select 
                defaultValue="all-status"
                onValueChange={setSelectedStatus}
              >
                <SelectTrigger className="w-[180px] bg-black text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 text-white">
                  <SelectItem value="all-status">All Status</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="booked">Booked</SelectItem>
                  <SelectItem value="unavailable">Unavailable</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </motion.div>

          {/* Venues Grid */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {filteredVenues.map((venue) => (
              <Card key={venue.id} className="overflow-hidden p-0 border-gray-200">
                <div className="flex">
                  <div className="relative min-w-1/3 bg-gray-200">
                    <div className="absolute top-2 right-2">
                      <div className={`w-3 h-3 rounded-full ${
                        venue.status === 'available' ? 'bg-green-500' :
                        venue.status === 'booked' ? 'bg-red-500' : 'bg-gray-500'
                      }`} />
                    </div>
                  </div>
                  <CardContent className="p-4 flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold">Name - {venue.name}</h3>
                        <p className="text-sm text-gray-500">Landmark - {venue.landmark}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="outline">Capacity - {venue.capacity}</Badge>
                      <Badge variant="secondary" className="cursor-pointer">GBM</Badge>
                      <Badge variant="secondary" className="cursor-pointer">Practice</Badge>
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  )
}