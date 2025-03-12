"use client"

import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"

interface EventProposal {
  eventName: string
  clubName: string
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  description: string
  createdAt: string
  lastUpdated: string
  status: "Approval Pending" | "Approved" | "Rejected"
}

const eventProposals: EventProposal[] = [
  {
    eventName: "MAHE Annual Marathon",
    clubName: "Sample Club Name",
    startDate: "03/02/2025",
    endDate: "04/02/2024",
    startTime: "2:00 PM",
    endTime: "5:00 PM",
    description: "The MAHE Annual Marathon aims to promote fitness, endurance, and community participation. The event will include different run categories, hydration stations, and medical support.",
    createdAt: "02/10/2025",
    lastUpdated: "02/10/2025",
    status: "Approval Pending"
  },
  // Add more proposals as needed
]

export default function ClubProposalPage() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-6 max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Event Proposal</h1>
            <Button variant="default" className="bg-black text-white">
              + New
            </Button>
          </div>

          {/* Active Proposals */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Active</h2>
            {eventProposals.map((proposal, index) => (
              <div key={index} className="border rounded-lg p-6 space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                  <div>
                    <p className="text-sm text-gray-500">Event Name</p>
                    <p className="font-medium">{proposal.eventName}</p>
                    <p className="text-sm text-gray-500 mt-1">{proposal.clubName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Event Start Date</p>
                    <p className="font-medium">{proposal.startDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Event End Date</p>
                    <p className="font-medium">{proposal.endDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Event Start Time</p>
                    <p className="font-medium">{proposal.startTime}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Event End Time</p>
                    <p className="font-medium">{proposal.endTime}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Description</p>
                  <p className="mt-1">{proposal.description}</p>
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="flex gap-8">
                    <div>
                      <p className="text-sm text-gray-500">Created At</p>
                      <p className="font-medium">{proposal.createdAt}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Last Updated</p>
                      <p className="font-medium">{proposal.lastUpdated}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Proposal Status</p>
                      <p className="font-medium">{proposal.status}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline">Update</Button>
                    <Button variant="outline">Details</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* History Section */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">History</h2>
            {/* Same proposal card structure as above, but for past proposals */}
          </div>
        </div>
      </div>
    </div>
  )
}