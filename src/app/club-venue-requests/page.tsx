"use client"

import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

interface VenueRequest {
  name: string
  event: string
  venue: string
  startDateTime: string
  endDateTime: string
  approvalStatus: {
    submitted: boolean
    studentCouncil: {
      approved: boolean
      president: string
    }
    facultyAdvisor: boolean
    officeOfStudentWelfare: boolean
    security: boolean
  }
  createdAt: string
  lastUpdated: string
  frame: string
}

const venueRequests: VenueRequest[] = [
  {
    name: "Sample Club Name",
    event: "Sample Event Name",
    venue: "AB 4, Room 505",
    startDateTime: "03/05/2025 | 2 PM",
    endDateTime: "03/05/2025 | 5 PM",
    approvalStatus: {
      submitted: true,
      studentCouncil: {
        approved: true,
        president: "Harsha Reddy"
      },
      facultyAdvisor: true,
      officeOfStudentWelfare: false,
      security: false
    },
    createdAt: "02/10/2025",
    lastUpdated: "02/10/2025",
    frame: "Frame 155"
  }
]

export default function VenueRequestsPage() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-6 max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h1 className="text-2xl font-bold">Venue Requests</h1>
            <div className="flex items-center gap-4 flex-1 justify-end">
              <Input
                type="search"
                placeholder="Search..."
                className="max-w-[300px]"
              />
              <Select defaultValue="active">
                <SelectTrigger className="w-[180px] bg-black text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="student-council">
                <SelectTrigger className="w-[180px] bg-black text-white">
                  <SelectValue placeholder="Student Council" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student-council">Student Council</SelectItem>
                  <SelectItem value="faculty">Faculty</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                </SelectContent>
              </Select>
              <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit profile</SheetTitle>
          <SheetDescription>
            Make changes to your profile here. Click save when youre done.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="name" className="text-right">
              Name
            </label>
            <Input id="name" value="Pedro Duarte" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="username" className="text-right">
              Username
            </label>
            <Input id="username" value="@peduarte" className="col-span-3" />
          </div>
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button type="submit">Save changes</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>

            </div>
          </div>

          {/* Active Requests */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Active</h2>
            {venueRequests.map((request, index) => (
              <div key={index} className="border rounded-lg p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-6">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">{request.name}</p>
                    <p className="text-sm text-gray-500 mt-1">Event: {request.event}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Venue</p>
                    <p className="font-medium">{request.venue}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Start Date / Time</p>
                    <p className="font-medium">{request.startDateTime}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">End Date / Time</p>
                    <p className="font-medium">{request.endDateTime}</p>
                  </div>
                </div>

                {/* Approval Status */}
                <div className="mb-6">
                  <p className="text-sm text-gray-500 mb-2">Approval Status</p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${request.approvalStatus.submitted ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className="text-sm">Submitted</span>
                    </div>
                    <div className="h-[2px] w-16 bg-gray-300" />
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${request.approvalStatus.studentCouncil.approved ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className="text-sm">Student Council ©</span>
                    </div>
                    <div className="h-[2px] w-16 bg-gray-300" />
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${request.approvalStatus.facultyAdvisor ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className="text-sm">Faculty Advisor</span>
                    </div>
                    <div className="h-[2px] w-16 bg-gray-300" />
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${request.approvalStatus.officeOfStudentWelfare ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className="text-sm">Office of Student Welfare</span>
                    </div>
                    <div className="h-[2px] w-16 bg-gray-300" />
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${request.approvalStatus.security ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className="text-sm">Security</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="flex gap-8">
                    <div>
                      <p className="text-sm text-gray-500">Created At</p>
                      <p className="font-medium">{request.createdAt}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Last Updated</p>
                      <p className="font-medium">{request.lastUpdated}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Frame</p>
                      <p className="font-medium text-blue-500">{request.frame}</p>
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
        </div>
      </div>
    </div>
  )
}