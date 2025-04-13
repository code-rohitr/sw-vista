"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { toast } from "sonner"

interface NewProposalFormProps {
  isOpen: boolean
  onClose: () => void
}

interface FormData {
  eventName: string
  description: string
  eventStartDate: string
  eventStartTime: string
}

export function NewProposalForm({ isOpen, onClose }: NewProposalFormProps) {
  const [formData, setFormData] = useState<FormData>({
    eventName: "",
    description: "",
    eventStartDate: "",
    eventStartTime: "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsSubmitting(true)

      const response = await fetch("/api/proposals/club", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.eventName,
          description: formData.description,
          event_type: "Event", // You might want to make this dynamic
          requested_date: new Date(formData.eventStartDate + "T" + formData.eventStartTime),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create proposal")
      }

      toast.success("Proposal created successfully")
      onClose()
      setFormData({
        eventName: "",
        description: "",
        eventStartDate: "",
        eventStartTime: "",
      })
    } catch (error) {
      console.error("Error creating proposal:", error)
      toast.error("Failed to create proposal")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClear = () => {
    setFormData({
      eventName: "",
      description: "",
      eventStartDate: "",
      eventStartTime: "",
    })
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-[425px]">
        <SheetHeader>
          <SheetTitle>New Event Proposal</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label htmlFor="eventName" className="text-sm font-medium">
              Event Name
            </label>
            <Input
              id="eventName"
              name="eventName"
              value={formData.eventName}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="eventStartDate" className="text-sm font-medium">
              Event Date
            </label>
            <Input
              id="eventStartDate"
              name="eventStartDate"
              type="date"
              value={formData.eventStartDate}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="eventStartTime" className="text-sm font-medium">
              Event Time
            </label>
            <Input
              id="eventStartTime"
              name="eventStartTime"
              type="time"
              value={formData.eventStartTime}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClear}>
              Clear
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Proposal"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
} 