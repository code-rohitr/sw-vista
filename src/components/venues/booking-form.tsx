"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { cn } from "@/lib/utils"
import { CalendarIcon } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const bookingFormSchema = z.object({
  event_name: z.string().min(1, "Event name is required"),
  event_date: z.date({
    required_error: "Event date is required",
  }),
  start_time: z.date({
    required_error: "Start time is required",
  }),
  end_time: z.date({
    required_error: "End time is required",
  }),
  event_type: z.string().min(1, "Event type is required"),
  description: z.string().min(1, "Description is required"),
  proposal_id: z.string().optional(),
}).refine((data) => {
  // Only require proposal_id if event_type is 'seminar'
  if (data.event_type === 'seminar') {
    return !!data.proposal_id;
  }
  return true;
}, {
  message: "Proposal is required for events",
  path: ["proposal_id"],
}).refine((data) => {
  // Check if end time is after start time
  return data.end_time > data.start_time;
}, {
  message: "End time must be after start time",
  path: ["end_time"],
}).refine((data) => {
  // Check if event date is not in the past
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDate = new Date(data.event_date);
  eventDate.setHours(0, 0, 0, 0);
  return eventDate >= today;
}, {
  message: "Event date cannot be in the past",
  path: ["event_date"],
});

type BookingFormValues = z.infer<typeof bookingFormSchema>

interface BookingFormProps {
  venueId: number
  onSuccess?: () => void
}

interface Proposal {
  id: number
  title: string
  status: string
}

export function BookingForm({ venueId, onSuccess }: BookingFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [proposals, setProposals] = useState<Proposal[]>([])

  useEffect(() => {
    // Fetch approved proposals for the club
    const fetchProposals = async () => {
      try {
        const response = await fetch("/api/proposals/club")
        if (response.ok) {
          const data = await response.json()
          // Filter only approved proposals
          setProposals(data.filter((p: Proposal) => p.status === "Approved"))
        }
      } catch (error) {
        console.error("Error fetching proposals:", error)
      }
    }

    fetchProposals()
  }, [])

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      event_name: "",
      event_date: undefined,
      start_time: undefined,
      end_time: undefined,
      event_type: "",
      description: "",
      proposal_id: undefined,
    },
  })

  const watchEventType = form.watch("event_type")
  const isEventType = watchEventType === "seminar"

  async function onSubmit(data: BookingFormValues) {
    setIsSubmitting(true)
    setError(null)
    try {
      const response = await fetch("/api/venue-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          venue_id: venueId,
          proposal_id: data.event_type === 'seminar' ? parseInt(data.proposal_id!) : undefined,
        }),
      })

      const responseData = await response.json()

      if (!response.ok) {
        if (responseData.error === "Event timing collides with existing booking") {
          setError(
            `An event "${responseData.existingBooking.event_name}" has already booked this venue from ${format(new Date(responseData.existingBooking.start_time), "h:mm a")} to ${format(new Date(responseData.existingBooking.end_time), "h:mm a")}`
          )
        } else if (responseData.error === "Proposal not found") {
          setError("The selected proposal was not found. Please select another proposal.")
        } else if (responseData.error === "Only approved proposals can be used for booking") {
          setError("This proposal has not been approved yet. Please select an approved proposal.")
        } else if (responseData.error === "This proposal has already been used for another booking") {
          setError("This proposal has already been used for another venue booking. Please select a different proposal.")
        } else if (responseData.error === "Proposal ID is required for event bookings") {
          setError("Please select a proposal for your event booking.")
        } else {
          setError(responseData.error || "Failed to create booking. Please try again.")
        }
        return
      }

      toast.success("Booking request submitted successfully")
      form.reset()
      onSuccess?.()
      router.refresh()
    } catch (error) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
            <div className="font-medium">Error</div>
            <div className="mt-1">{error}</div>
          </div>
        )}

        <FormField
          control={form.control}
          name="event_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Event Date</FormLabel>
              <FormControl>
                <div className="relative">
                  <DatePicker
                    selected={field.value}
                    onChange={(date) => {
                      field.onChange(date)
                      if (date) {
                        // Set default start time to 9 AM
                        const startTime = new Date(date)
                        startTime.setHours(9, 0, 0, 0)
                        form.setValue("start_time", startTime)
                        
                        // Set default end time to 11 AM
                        const endTime = new Date(date)
                        endTime.setHours(11, 0, 0, 0)
                        form.setValue("end_time", endTime)
                      }
                    }}
                    minDate={new Date()}
                    className={cn(
                      "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                      !field.value && "text-muted-foreground"
                    )}
                    placeholderText="Pick a date"
                    dateFormat="MMMM d, yyyy"
                  />
                  <CalendarIcon className="absolute right-3 top-3 h-4 w-4 opacity-50" />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="start_time"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Time</FormLabel>
                <FormControl>
                  <div className="relative">
                    <DatePicker
                      selected={field.value}
                      onChange={(date) => field.onChange(date)}
                      showTimeSelect
                      showTimeSelectOnly
                      timeIntervals={15}
                      timeCaption="Time"
                      dateFormat="h:mm aa"
                      className={cn(
                        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                        !field.value && "text-muted-foreground"
                      )}
                      placeholderText="Select start time"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="end_time"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>End Time</FormLabel>
                <FormControl>
                  <div className="relative">
                    <DatePicker
                      selected={field.value}
                      onChange={(date) => field.onChange(date)}
                      showTimeSelect
                      showTimeSelectOnly
                      timeIntervals={15}
                      timeCaption="Time"
                      dateFormat="h:mm aa"
                      className={cn(
                        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                        !field.value && "text-muted-foreground"
                      )}
                      placeholderText="Select end time"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="event_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter event name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="event_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="border-2  bg-white">
                  <SelectItem value="meeting">GBM</SelectItem>
                  <SelectItem value="workshop">Practice</SelectItem>
                  <SelectItem value="seminar">Event</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {isEventType && (
          <FormField
            control={form.control}
            name="proposal_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Select Approved Proposal</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a proposal" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {proposals.map((proposal) => (
                      <SelectItem key={proposal.id} value={proposal.id.toString()}>
                        {proposal.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter event description"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button className="border-2 hover:bg-gray-200" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Booking Request"}
        </Button>
      </form>
    </Form>
  )
} 