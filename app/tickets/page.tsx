"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, MapPin, ExternalLink, QrCode, Share2, Download } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { getAuthToken } from "@/lib/get-jwt"
import { formatDate } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import Navbar from "@/components/navbar"

interface Event {
  id: number
  name: string
  maxRegistrations: number
  eventDate: string
  registrationDeadline: string
  registrations: EventRegistration[]
  photo: string | null
  activities: Activity[]
  location?: string
}

interface EventRegistration {
  id: number
  userId: string
  userName: string
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
  registrations: ActivityRegistration[]
  eventId: number
  eventName?: string
}

interface ActivityRegistration {
  id: number
  userId: string
  userName: string
}

export default function TicketsPage() {
  const [registeredEvents, setRegisteredEvents] = useState<Event[]>([])
  // const [registeredActivities, setRegisteredActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const token = getAuthToken()

    if (!token) {
      router.push("/")
      return
    }

    try {
      const tokenParts = token.split(".")
      const payload = JSON.parse(atob(tokenParts[1]))
      setUserId(payload.sub)
    } catch (error) {
      console.error("Error extracting user ID from token:", error)
    }

    fetchUserTickets()
  }, [router])

  const fetchUserTickets = async () => {
    setLoading(true)
    try {
      const token = getAuthToken()
      if (!token) return

      const eventsResponse = await fetch("/api/event-registrations/my-events", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!eventsResponse.ok) {
        throw new Error("Failed to load registered events")
      }

      const eventsData = await eventsResponse.json()
      setRegisteredEvents(eventsData)

    } catch (error) {
      console.error("Error loading tickets:", error)
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar seus ingressos. Tente novamente mais tarde.",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleViewEvent = (eventId: number) => {
    router.push(`/events/${eventId}`)
  }

  // const handleViewActivity = (eventId: number, activityId: number) => {
  //   router.push(`/events/${eventId}/activities/${activityId}`)
  // }

  const generateTicketCode = (type: string, id: number, userId: string | null) => {
    return `${type.substring(0, 3).toUpperCase()}-${id}-${userId?.substring(0, 8) || "USER"}`
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
      <div className="container mx-auto py-6 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Meus Ingressos</h1>

        <Tabs defaultValue="events" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="events">Eventos ({registeredEvents.length})</TabsTrigger>
            {/* <TabsTrigger value="activities">Atividades ({registeredActivities.length})</TabsTrigger> */}
          </TabsList>

          <TabsContent value="events">
            {registeredEvents.length > 0 ? (
              <div className="space-y-6">
                {registeredEvents.map((event) => (
                  <Card
                    key={event.id}
                    className="overflow-hidden border-2 border-[#3DD4A7]/20 hover:border-[#3DD4A7]/50 transition-all"
                  >
                    <div className="flex flex-col md:flex-row">
                      {/* Left side - Event image */}
                      <div className="w-full md:w-1/3 h-48 md:h-auto bg-gray-100 relative">
                        {event.photo ? (
                          <img
                            src={event.photo || "/IFPB.jpg"}
                            alt={event.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Calendar className="h-16 w-16" />
                          </div>
                        )}
                        <div className="absolute top-3 left-3">
                          <Badge className="bg-[#3DD4A7] text-white border-none">Evento</Badge>
                        </div>
                      </div>

                      {/* Right side - Event details */}
                      <div className="flex-1 p-6 flex flex-col">
                        <div className="flex justify-between items-start">
                          <div>
                            <h2 className="text-2xl font-bold mb-2">{event.name}</h2>
                            <p className="text-gray-500 mb-4">
                              Código: {generateTicketCode("event", event.id, userId)}
                            </p>
                          </div>
                          <div className="hidden md:block">
                            <QrCode className="h-24 w-24 text-[#3DD4A7]" />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-[#3DD4A7]" />
                            <div>
                              <p className="text-sm text-gray-500">Data</p>
                              <p className="font-medium">{formatDate(event.eventDate)}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-[#3DD4A7]" />
                            <div>
                              <p className="text-sm text-gray-500">Local</p>
                              <p className="font-medium">{event.location || "IFPB"}</p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-auto flex flex-wrap gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleViewEvent(event.id)}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Ver detalhes
                          </Button>

                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Baixar
                          </Button>

                          <Button variant="outline" size="sm">
                            <Share2 className="h-4 w-4 mr-2" />
                            Compartilhar
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Mobile QR code */}
                    <div className="md:hidden p-4 flex justify-center border-t">
                      <QrCode className="h-32 w-32 text-[#3DD4A7]" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg border">
                <Calendar className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-medium mb-2">Nenhum ingresso de evento encontrado</h3>
                <p className="text-gray-500 mb-6">Você ainda não se inscreveu em nenhum evento.</p>
                <Button className="bg-[#3DD4A7] hover:bg-[#2bc090]" onClick={() => router.push("/feed")}>
                  Explorar eventos
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}

