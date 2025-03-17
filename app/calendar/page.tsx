"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns"
import { ptBR } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { CalendarIcon, ChevronLeft, ChevronRight, Filter } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { getAuthToken } from "@/lib/get-jwt"
import { useToast } from "@/components/ui/use-toast"
import Navbar from "@/components/navbar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

interface Event {
  id: number
  name: string
  eventDate: string
  registrationDeadline: string
  photo: string | null
  activities: Activity[]
  location?: string
  isRegistered?: boolean
}

interface Activity {
  id: number
  name: string
  location: string
  activityDate: string
  activityTime: string
  type: string
  category: string
  photo: string | null
  eventId: number
  eventName?: string
  isRegistered?: boolean
}

interface CalendarItem {
  id: number
  type: "event" | "activity"
  name: string
  date: Date
  time?: string
  location?: string
  category?: string
  eventId?: number
  eventName?: string
  isRegistered: boolean
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<Event[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [calendarItems, setCalendarItems] = useState<CalendarItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showRegisteredOnly, setShowRegisteredOnly] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [availableCategories, setAvailableCategories] = useState<string[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [dayEvents, setDayEvents] = useState<CalendarItem[]>([])

  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const token = getAuthToken()

    if (!token) {
      router.push("/")
      return
    }

    // Extract user ID from token
    try {
      const tokenParts = token.split(".")
      const payload = JSON.parse(atob(tokenParts[1]))
      setUserId(payload.sub)
    } catch (error) {
      console.error("Error extracting user ID from token:", error)
    }

    fetchCalendarData()
  }, [router])

  useEffect(() => {
    // Process events and activities into calendar items
    const items: CalendarItem[] = []

    // Add events
    events.forEach((event) => {
      if (!showRegisteredOnly || event.isRegistered) {
        items.push({
          id: event.id,
          type: "event",
          name: event.name,
          date: new Date(event.eventDate),
          location: event.location || "IFPB",
          isRegistered: !!event.isRegistered,
        })
      }
    })

    // Add activities
    activities.forEach((activity) => {
      if (
        (!showRegisteredOnly || activity.isRegistered) &&
        (!selectedCategories.length || selectedCategories.includes(activity.category))
      ) {
        items.push({
          id: activity.id,
          type: "activity",
          name: activity.name,
          date: new Date(activity.activityDate),
          time: activity.activityTime,
          location: activity.location,
          category: activity.category,
          eventId: activity.eventId,
          eventName: activity.eventName,
          isRegistered: !!activity.isRegistered,
        })
      }
    })

    setCalendarItems(items)
  }, [events, activities, showRegisteredOnly, selectedCategories])

  useEffect(() => {
    // Update day events when selected day changes
    if (selectedDay) {
      const dayItems = calendarItems.filter((item) => isSameDay(item.date, selectedDay))
      setDayEvents(dayItems)
    } else {
      setDayEvents([])
    }
  }, [selectedDay, calendarItems])

  const fetchCalendarData = async () => {
    setLoading(true)
    try {
      const token = getAuthToken()
      if (!token) return

      // Fetch all events
      const eventsResponse = await fetch("/api/events", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!eventsResponse.ok) {
        throw new Error("Failed to load events")
      }

      const eventsData = await eventsResponse.json()

      // Fetch user's registered events to mark them
      const registeredEventsResponse = await fetch("/api/event-registrations/my-events", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      let registeredEvents: Event[] = []
      if (registeredEventsResponse.ok) {
        registeredEvents = await registeredEventsResponse.json()
      }

      // Mark registered events
      const eventsWithRegistrationStatus = eventsData.map((event: Event) => ({
        ...event,
        isRegistered: registeredEvents.some((regEvent) => regEvent.id === event.id),
      }))

      setEvents(eventsWithRegistrationStatus)

      // Process activities from all events
      const allActivities: Activity[] = []
      const categories = new Set<string>()

      eventsWithRegistrationStatus.forEach((event: Event) => {
        if (event.activities && event.activities.length) {
          event.activities.forEach((activity) => {
            if (activity.category) {
              categories.add(activity.category)
            }

            allActivities.push({
              ...activity,
              eventId: event.id,
              eventName: event.name,
              isRegistered: event.isRegistered, // Initially mark based on event registration
            })
          })
        }
      })

      // Fetch user's registered activities to mark them correctly
      const registeredActivitiesResponse = await fetch("/api/activity-registrations/my-activities", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (registeredActivitiesResponse.ok) {
        const registeredActivities = await registeredActivitiesResponse.json()

        // Update registration status for activities
        allActivities.forEach((activity) => {
          if (registeredActivities.some((regActivity: Activity) => regActivity.id === activity.id)) {
            activity.isRegistered = true
          }
        })
      }

      setActivities(allActivities)
      setAvailableCategories(Array.from(categories))
    } catch (error) {
      console.error("Error loading calendar data:", error)
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os dados do calendário. Tente novamente mais tarde.",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePreviousMonth = () => {
    setCurrentDate((prevDate) => subMonths(prevDate, 1))
    setSelectedDay(null)
  }

  const handleNextMonth = () => {
    setCurrentDate((prevDate) => addMonths(prevDate, 1))
    setSelectedDay(null)
  }

  const handleDayClick = (day: Date) => {
    if (isSameDay(day, selectedDay as Date)) {
      setSelectedDay(null)
    } else {
      setSelectedDay(day)
    }
  }

  const handleViewEvent = (eventId: number) => {
    router.push(`/events/${eventId}`)
  }

  const handleViewActivity = (eventId: number, activityId: number) => {
    router.push(`/events/${eventId}/activities/${activityId}`)
  }

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(category)) {
        return prev.filter((c) => c !== category)
      } else {
        return [...prev, category]
      }
    })
  }

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

    // Get day names in Portuguese
    const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Calendar header */}
        <div className="flex justify-between items-center p-4 border-b">
          <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <h2 className="text-xl font-semibold">{format(currentDate, "MMMM yyyy", { locale: ptBR })}</h2>

          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 bg-gray-50">
          {weekDays.map((day) => (
            <div key={day} className="py-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 border-t">
          {days.map((day, dayIdx) => {
            // Get events and activities for this day
            const dayItems = calendarItems.filter((item) => isSameDay(item.date, day))

            // Count events and activities
            const eventCount = dayItems.filter((item) => item.type === "event").length
            const activityCount = dayItems.filter((item) => item.type === "activity").length

            // Check if day is selected
            const isSelected = selectedDay ? isSameDay(day, selectedDay) : false

            return (
              <div
                key={day.toString()}
                className={`min-h-[100px] p-2 border-b border-r relative ${
                  !isSameMonth(day, currentDate) ? "bg-gray-50 text-gray-400" : ""
                } ${isSelected ? "bg-[#e6f7f2]" : ""}`}
                onClick={() => handleDayClick(day)}
              >
                <div className={`text-right ${isSelected ? "font-bold text-[#3DD4A7]" : ""}`}>{format(day, "d")}</div>

                {dayItems.length > 0 && (
                  <div className="mt-1 space-y-1">
                    {eventCount > 0 && (
                      <Badge className="bg-[#3DD4A7] hover:bg-[#2bc090] text-white">
                        {eventCount} evento{eventCount !== 1 ? "s" : ""}
                      </Badge>
                    )}

                    {activityCount > 0 && (
                      <Badge variant="outline" className="border-[#3DD4A7] text-[#3DD4A7]">
                        {activityCount} atividade{activityCount !== 1 ? "s" : ""}
                      </Badge>
                    )}

                    {dayItems.length <= 2 &&
                      dayItems.map((item, idx) => (
                        <div key={`${item.type}-${item.id}`} className="text-xs truncate">
                          {item.name}
                        </div>
                      ))}

                    {dayItems.length > 2 && <div className="text-xs text-gray-500">+ {dayItems.length - 2} mais</div>}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto py-6 flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3DD4A7]"></div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto py-6 max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold">Calendário de Eventos</h1>

          <div className="flex flex-wrap gap-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="registered-only"
                checked={showRegisteredOnly}
                onCheckedChange={(checked) => setShowRegisteredOnly(!!checked)}
              />
              <Label htmlFor="registered-only">Apenas inscritos</Label>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filtrar categorias
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Categorias</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {availableCategories.map((category) => (
                  <DropdownMenuCheckboxItem
                    key={category}
                    checked={selectedCategories.includes(category)}
                    onCheckedChange={() => toggleCategory(category)}
                  >
                    {category}
                  </DropdownMenuCheckboxItem>
                ))}
                {availableCategories.length === 0 && (
                  <div className="px-2 py-1.5 text-sm text-gray-500">Nenhuma categoria disponível</div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">{renderCalendar()}</div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  {selectedDay ? (
                    <>Eventos em {format(selectedDay, "d 'de' MMMM", { locale: ptBR })}</>
                  ) : (
                    <>Selecione uma data</>
                  )}
                </CardTitle>
                <CardDescription>
                  {selectedDay
                    ? dayEvents.length > 0
                      ? `${dayEvents.length} item(s) agendado(s) para este dia`
                      : "Nenhum evento ou atividade neste dia"
                    : "Clique em um dia no calendário para ver os detalhes"}
                </CardDescription>
              </CardHeader>

              <CardContent>
                {selectedDay && dayEvents.length > 0 ? (
                  <div className="space-y-4">
                    {dayEvents.map((item) => (
                      <div
                        key={`${item.type}-${item.id}`}
                        className="p-3 border rounded-lg hover:border-[#3DD4A7] transition-colors cursor-pointer"
                        onClick={() =>
                          item.type === "event" ? handleViewEvent(item.id) : handleViewActivity(item.eventId!, item.id)
                        }
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <Badge
                              className={
                                item.type === "event"
                                  ? "bg-[#3DD4A7] text-white"
                                  : "bg-white text-[#3DD4A7] border-[#3DD4A7]"
                              }
                            >
                              {item.type === "event" ? "Evento" : "Atividade"}
                            </Badge>

                            {item.isRegistered && (
                              <Badge variant="outline" className="ml-2 bg-green-50 text-green-600 border-green-200">
                                Inscrito
                              </Badge>
                            )}
                          </div>

                          {item.category && <Badge variant="outline">{item.category}</Badge>}
                        </div>

                        <h3 className="font-medium mt-2">{item.name}</h3>

                        {item.type === "activity" && item.eventName && (
                          <p className="text-sm text-gray-500">Evento: {item.eventName}</p>
                        )}

                        <div className="mt-2 text-sm text-gray-600">
                          {item.time && (
                            <div className="flex items-center gap-1">
                              <CalendarIcon className="h-3.5 w-3.5" />
                              <span>{item.time}</span>
                            </div>
                          )}

                          {item.location && (
                            <div className="flex items-center gap-1 mt-1">
                              <CalendarIcon className="h-3.5 w-3.5" />
                              <span>{item.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : selectedDay ? (
                  <div className="text-center py-8 text-gray-500">
                    <CalendarIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                    <p>Nenhum evento ou atividade agendado para este dia.</p>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CalendarIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                    <p>Selecione um dia no calendário para ver os detalhes.</p>
                  </div>
                )}
              </CardContent>

              {selectedDay && dayEvents.length > 0 && (
                <CardFooter>
                  <Button variant="outline" className="w-full" onClick={() => setSelectedDay(null)}>
                    Limpar seleção
                  </Button>
                </CardFooter>
              )}
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}

