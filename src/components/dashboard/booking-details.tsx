import { X } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"

interface BookingDetailsProps {
  booking: {
    id: string
    clubName: string
    event: string
    venue: string
    startDate: string | Date
    endDate: string | Date
    applicationType: string
    applicationDate: string
    status: number
    proposal?: {
      id: number
      title: string
      description: string
      status: string
    } | null
    reports?: Array<{
      id: number
      report_type: string
      content: string
      status: string
      created_at: string | Date
    }>
    eventHistory?: Array<{
      id: number
      event_status: string
      feedback: string | null
      created_at: string | Date
    }>
  } | null
  open: boolean
  onClose: () => void
}

export function BookingDetails({ booking, open, onClose }: BookingDetailsProps) {
  if (!booking) return null

  const getStatusText = (status: number) => {
    switch (status) {
      case 0: return "Rejected"
      case 1: return "Submitted"
      case 2: return "FA Approved"
      case 3: return "SC Approved"
      case 4: return "SWO Approved"
      case 5: return "Security Approved"
      default: return "Unknown"
    }
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>Booking Details</SheetTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 p-0"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>
        <div className="space-y-6 pt-8">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Club Name</h3>
            <p className="text-base">{booking.clubName}</p>
          </div>
          <Separator />
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Event</h3>
            <p className="text-base">{booking.event}</p>
          </div>
          <Separator />
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Venue</h3>
            <p className="text-base">{booking.venue}</p>
          </div>
          <Separator />
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Start Date</h3>
            <p className="text-base">
              {format(new Date(booking.startDate), "PPP p")}
            </p>
          </div>
          <Separator />
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">End Date</h3>
            <p className="text-base">
              {format(new Date(booking.endDate), "PPP p")}
            </p>
          </div>
          <Separator />
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Application Type</h3>
            <p className="text-base">{booking.applicationType}</p>
          </div>
          {booking.proposal && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Proposal Details</h3>
                <div className="space-y-2">
                  <p className="text-base font-medium">{booking.proposal.title}</p>
                  <p className="text-sm text-muted-foreground">{booking.proposal.description}</p>
                  <p className="text-sm">Status: {booking.proposal.status}</p>
                </div>
              </div>
            </>
          )}
          <Separator />
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Application Date</h3>
            <p className="text-base">{booking.applicationDate}</p>
          </div>
          <Separator />
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
            <p className="text-base">{getStatusText(booking.status)}</p>
          </div>
          {booking.reports && booking.reports.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-4">Reports</h3>
                <div className="space-y-4">
                  {booking.reports.map((report) => (
                    <div
                      key={report.id}
                      className="rounded-lg border p-4 text-sm"
                    >
                      <div className="font-medium">{report.report_type}</div>
                      <div className="mt-1 text-muted-foreground">{report.content}</div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        {format(new Date(report.created_at), "PPP p")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
          {booking.eventHistory && booking.eventHistory.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-4">Event History</h3>
                <div className="space-y-4">
                  {booking.eventHistory.map((history) => (
                    <div
                      key={history.id}
                      className="rounded-lg border p-4 text-sm"
                    >
                      <div className="font-medium">{history.event_status}</div>
                      {history.feedback && (
                        <div className="mt-1 text-muted-foreground">{history.feedback}</div>
                      )}
                      <div className="mt-2 text-xs text-muted-foreground">
                        {format(new Date(history.created_at), "PPP p")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
} 