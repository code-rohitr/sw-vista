"use client"

import { Sidebar } from "@/components/sidebar"
import { motion } from "framer-motion"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface ClubMember {
  id: number
  name: string
  registrationNumber: string
  degree: string
  branch: string
  post: string
}

interface ClubData {
  id: number
  name: string
  description: string
  facultyAdvisor: string
  president: string
  lastUpdated: string
  type: string
  posterImage: string
  members: ClubMember[]
}

const clubData: ClubData = {
  id: 1,
  name: "Team Manipal Racing",
  description: "Excepteur efficient emerging, minim veniam anim aute carefully curated Ginza conversation exquisite perfect nostrud nisi intricate Content. Qui international first-class nulla ut. Punctual adipisicing, essential lovely queen tempor eiusmod irure. Exclusive izakaya charming Scandinavian impeccable aute quality of life soft power pariatur Melbourne occaecat discerning. Qui wardrobe aliquip, et Porter destination Toto remarkable officia Helsinki excepteur Basset hound. Zürich sleepy perfect consectetur.",
  facultyAdvisor: "Mr. Random Name",
  president: "Mr. Random Name",
  lastUpdated: "05/01/2025",
  type: "Technical",
  posterImage: "/club-poster.jpg",
  members: [
    { 
      id: 1, 
      name: "John Doe", 
      registrationNumber: "220911234",
      degree: "B.Tech",
      branch: "Computer Science",
      post: "Vice President"
    },
    // Add more members as needed
  ]
}

export default function ClubDetailsPage() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="max-w-11/12 mx-auto">
          {/* Club Poster */}
          <div className="w-full h-[300px] bg-gray-200 mt-10 rounded-md" />

          <div className="p-6 space-y-8">
            {/* Header with Edit Button */}
            <div className="flex justify-between items-start">
              <motion.h1 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-2xl font-bold"
              >
                {clubData.name}
              </motion.h1>
              <button className="text-sm text-gray-600 hover:text-gray-900">
                Edit
              </button>
            </div>

            {/* Club Description */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <p className="text-gray-600">{clubData.description}</p>
            </motion.div>

            {/* Club Details Grid */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 border-b pb-6"
            >
              <div>
                <p className="text-sm text-gray-500">Faculty Advisor</p>
                <p className="font-medium">{clubData.facultyAdvisor}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">President</p>
                <p className="font-medium">{clubData.president}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Details Last Updated</p>
                <p className="font-medium">{clubData.lastUpdated}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Club Type</p>
                <p className="font-medium">{clubData.type}</p>
              </div>
            </motion.div>

            {/* Members Table */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="space-y-4"
            >
              <h2 className="text-xl font-semibold">Members</h2>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Registration Number</TableHead>
                      <TableHead>Degree</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>Post</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clubData.members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">{member.name}</TableCell>
                        <TableCell>{member.registrationNumber}</TableCell>
                        <TableCell>{member.degree}</TableCell>
                        <TableCell>{member.branch}</TableCell>
                        <TableCell>{member.post}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}