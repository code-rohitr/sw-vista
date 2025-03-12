"use client"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { motion } from "framer-motion"
import { Sidebar } from "@/components/sidebar"

const clubsData = [
  {
    name: "Technical Club",
    type: "Technical",
    members: 120,
    events: 15,
  },
  {
    name: "Cultural Club",
    type: "Cultural",
    members: 85,
    events: 12,
  },
  {
    name: "Sports Club",
    type: "Sports",
    members: 150,
    events: 20,
  },
]

export default function ClubsPage() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-6 max-w-full mx-auto">
          {/* Header */}
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center justify-between mb-4 pb-4 gap-4 border-b border-gray-200"
          >
            <h1 className="text-2xl font-bold">All Clubs</h1>
            
            <div className="flex items-center gap-4">
              <div className="relative w-64 rounded-full">
                <Input
                  type="search"
                  placeholder="Search clubs..."
                  className="w-full rounded-full"
                />
              </div>
              
              <Select defaultValue="technical">
                <SelectTrigger className="w-[180px] bg-black text-white">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 text-white">
                  <SelectItem value="technical" className="hover:bg-gray-700">Technical</SelectItem>
                  <SelectItem value="cultural" className="hover:bg-gray-700">Cultural</SelectItem>
                  <SelectItem value="sports" className="hover:bg-gray-700">Sports</SelectItem>
                  <SelectItem value="all" className="hover:bg-gray-700">All Clubs</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </motion.div>

          {/* Table */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="overflow-hidden"
          >
            <Table className="border-collapse">
              <TableHeader>
                <TableRow className="border-b border-gray-400">
                  <TableHead className="font-semibold">Club Name</TableHead>
                  <TableHead className="font-semibold">Club Type</TableHead>
                  <TableHead className="font-semibold text-right">Total Members</TableHead>
                  <TableHead className="font-semibold text-right">Total Events This Year</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clubsData.map((club, index) => (
                  <TableRow key={index} className="border-b border-gray-300">
                    <TableCell className="font-medium">{club.name}</TableCell>
                    <TableCell>{club.type}</TableCell>
                    <TableCell className="text-right">{club.members}</TableCell>
                    <TableCell className="text-right">{club.events}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </motion.div>
        </div>
      </div>
    </div>
  )
}