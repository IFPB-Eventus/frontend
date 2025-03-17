"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileDown, Pencil, Calendar, Clock, MapPin, ExternalLink, Loader2 } from "lucide-react"
import { decodeJwt } from "@/lib/jwt"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { getAuthToken } from "@/lib/get-jwt"
import { formatDate } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import Navbar from "@/components/navbar"

interface UserProfile {
  id: string
  name: string
  email: string
  avatar?: string
}

interface Registration {
  id: number
  eventTitle: string
  date: string
  status: "present" | "absent" | "pending"
}

interface Certificate {
  id: number
  eventTitle: string
  date: string
  downloadUrl: string
}

interface Event {
  id: number
  name: string
  maxRegistrations: number
  eventDate: string
  registrationDeadline: string
  registrations: EventRegistration[]
  photo: string | null
  activities: Activity[]
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
}

interface ActivityRegistration {
  id: number
  userId: string
  userName: string
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [registeredEvents, setRegisteredEvents] = useState<Event[]>([])
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingEvents, setLoadingEvents] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const token = getAuthToken()

    if (!token) {
      router.push("/")
      return
    }

    try {
      const decodedToken = decodeJwt(token)

      setProfile({
        id: decodedToken.sub || "",
        name: decodedToken.preferred_username || "",
        email: decodedToken.email || "",
        avatar: "/avatar.jpg",
      })

      fetchRegisteredEvents(token)

      setCertificates([
        {
          id: 1,
          eventTitle: "Sertão Comp",
          date: "2024-03-15",
          downloadUrl: "#",
        },
      ])

      setLoading(false)
    } catch (error) {
      console.error("Erro ao carregar perfil:", error)
      router.push("/")
    }
  }, [router])

  const fetchRegisteredEvents = async (token: string) => {
    setLoadingEvents(true)
    try {
      const response = await fetch("/api/event-registrations/my-events", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Falha ao carregar eventos registrados")
      }

      const data = await response.json()
      setRegisteredEvents(data)
    } catch (error) {
      console.error("Erro ao carregar eventos registrados:", error)
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar seus eventos. Tente novamente mais tarde.",
      })
    } finally {
      setLoadingEvents(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return <Badge className="bg-[#e6f7f2] text-[#3DD4A7] border-[#3DD4A7]">Presente</Badge>
      case "absent":
        return <Badge variant="destructive">Ausente</Badge>
      case "pending":
        return <Badge variant="secondary">Não confirmada</Badge>
      default:
        return null
    }
  }

  const handleViewEvent = (eventId: number) => {
    router.push(`/events/${eventId}`)
  }

  const handleViewActivity = (eventId: number, activityId: number) => {
    router.push(`/events/${eventId}/activities/${activityId}`)
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

  if (!profile) {
    return (
      <>
        <Navbar />  
        <div className="container mx-auto py-6">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            Erro ao carregar perfil. Por favor, tente novamente.
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto py-24 max-w-4xl">
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center md:flex-row md:items-start gap-6">
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100">
                  <img
                    src={profile.avatar || "/placeholder.svg"}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <Button
                  size="icon"
                  variant="outline"
                  className="absolute bottom-0 right-0 rounded-full bg-white"
                  onClick={() => {
                    /* Implementar edição de foto */
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-bold mb-2">{profile.name}</h1>
                <p className="text-gray-500 mb-4">{profile.email}</p>
                <Button className="bg-[#3DD4A7] hover:bg-[#2bc090]">Editar Perfil</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between items-center mb-6">
          <Tabs defaultValue="events" className="w-full">
            <div className="flex justify-between items-center mb-6">
              <TabsList>
                <TabsTrigger value="events">Meus eventos</TabsTrigger>
                <TabsTrigger value="activities">Minhas atividades</TabsTrigger>
                <TabsTrigger value="certificates">Meus certificados</TabsTrigger>
              </TabsList>

              <Button variant="outline" className="hidden md:flex">
                <FileDown className="mr-2 h-4 w-4" />
                Exportar em PDF
              </Button>
            </div>

            <TabsContent value="events">
              <Card>
                <CardHeader>
                  <CardTitle>Eventos Inscritos</CardTitle>
                  <CardDescription>Lista de todos os eventos em que você se inscreveu</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingEvents ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-[#3DD4A7]" />
                    </div>
                  ) : registeredEvents.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {registeredEvents.map((event) => (
                        <Card key={event.id} className="overflow-hidden hover:shadow-md transition-shadow">
                          <div className="h-40 bg-gray-100">
                            {event.photo ? (
                              <img
                                src={event.photo || "/placeholder.svg"}
                                alt={event.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <Calendar className="h-12 w-12" />
                              </div>
                            )}
                          </div>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-xl">{event.name}</CardTitle>
                            <CardDescription>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>{formatDate(event.eventDate)}</span>
                              </div>
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="pb-2">
                            <p className="text-sm text-gray-600 mb-2">
                              {event.activities.length} atividades disponíveis
                            </p>
                            <p className="text-sm text-gray-600">
                              Inscrições até {formatDate(event.registrationDeadline)}
                            </p>
                          </CardContent>
                          <CardFooter>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => handleViewEvent(event.id)}
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Ver detalhes
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                      <p className="text-lg font-medium mb-1">Nenhum evento inscrito</p>
                      <p className="text-sm text-gray-400">Você ainda não se inscreveu em nenhum evento.</p>
                      <Button className="mt-4 bg-[#3DD4A7] hover:bg-[#2bc090]" onClick={() => router.push("/feed")}>
                        Explorar eventos
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activities">
              <Card>
                <CardHeader>
                  <CardTitle>Atividades Inscritas</CardTitle>
                  <CardDescription>Lista de todas as atividades em que você se inscreveu</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingEvents ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-[#3DD4A7]" />
                    </div>
                  ) : registeredEvents.length > 0 ? (
                    <div className="space-y-6">
                      {registeredEvents.map((event) => (
                        <div key={event.id} className="space-y-4">
                          {event.activities.length > 0 && (
                            <>
                              <h3 className="text-lg font-semibold border-b pb-2">{event.name}</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {event.activities.map((activity) => {
                                  // Check if user is registered for this activity
                                  const isRegistered = activity.registrations?.some((reg) => reg.userId === profile.id)

                                  if (!isRegistered) return null

                                  return (
                                    <Card
                                      key={activity.id}
                                      className="overflow-hidden hover:shadow-md transition-shadow"
                                    >
                                      <CardHeader className="pb-2">
                                        <CardTitle className="text-lg">{activity.name}</CardTitle>
                                        <CardDescription>{activity.type}</CardDescription>
                                      </CardHeader>
                                      <CardContent className="pb-2">
                                        <div className="space-y-2 text-sm">
                                          <div className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-gray-500" />
                                            <span>{activity.location}</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-gray-500" />
                                            <span>{formatDate(activity.activityDate)}</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-gray-500" />
                                            <span>{activity.activityTime}</span>
                                          </div>
                                        </div>
                                      </CardContent>
                                      <CardFooter>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="w-full"
                                          onClick={() => handleViewActivity(event.id, activity.id)}
                                        >
                                          <ExternalLink className="h-4 w-4 mr-2" />
                                          Ver detalhes
                                        </Button>
                                      </CardFooter>
                                    </Card>
                                  )
                                })}
                              </div>
                            </>
                          )}
                        </div>
                      ))}

                      {/* Check if there are no activities registered */}
                      {registeredEvents.every(
                        (event) =>
                          !event.activities.some((activity) =>
                            activity.registrations?.some((reg) => reg.userId === profile.id),
                          ),
                      ) && (
                        <div className="text-center py-8 text-gray-500">
                          <Clock className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                          <p className="text-lg font-medium mb-1">Nenhuma atividade inscrita</p>
                          <p className="text-sm text-gray-400">Você ainda não se inscreveu em nenhuma atividade.</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Clock className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                      <p className="text-lg font-medium mb-1">Nenhuma atividade inscrita</p>
                      <p className="text-sm text-gray-400">Você ainda não se inscreveu em nenhuma atividade.</p>
                      <Button className="mt-4 bg-[#3DD4A7] hover:bg-[#2bc090]" onClick={() => router.push("/feed")}>
                        Explorar eventos
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="certificates">
              <Card>
                <CardHeader>
                  <CardTitle>Certificados Disponíveis</CardTitle>
                  <CardDescription>Certificados dos eventos que você participou</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4">Título do evento</th>
                          <th className="text-left py-3 px-4">Data</th>
                          <th className="text-left py-3 px-4">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {certificates.map((certificate) => (
                          <tr key={certificate.id} className="border-b">
                            <td className="py-3 px-4">{certificate.eventTitle}</td>
                            <td className="py-3 px-4">{formatDate(certificate.date)}</td>
                            <td className="py-3 px-4">
                              <Button variant="outline" size="sm">
                                <FileDown className="mr-2 h-4 w-4" />
                                Baixar
                              </Button>
                            </td>
                          </tr>
                        ))}
                        {certificates.length === 0 && (
                          <tr>
                            <td colSpan={3} className="py-8 text-center text-gray-500">
                              Nenhum certificado disponível ainda
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Botão de exportar para mobile */}
        <div className="md:hidden fixed bottom-4 right-4">
          <Button className="bg-[#3DD4A7] hover:bg-[#2bc090] shadow-lg">
            <FileDown className="mr-2 h-4 w-4" />
            Exportar em PDF
          </Button>
        </div>
      </div>
    </>
  )
}

