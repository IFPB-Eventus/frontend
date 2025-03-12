"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { decodeJwt } from "@/lib/jwt"
import { useToast } from "@/components/ui/use-toast"
import type { Event } from "@/types/event"
import type { Activity } from "@/types/activity"
import { formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, MapPin, Plus, Users, Pencil, Trash2, ArrowLeft, Loader2, ExternalLink } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getAuthToken } from "@/lib/get-jwt"
import Navbar from "@/components/navbar"

interface PageProps {
  params: {
    id: string
    activityId: string
  }
}

export default function EventDetailsPage({ params }: PageProps) {
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string>("")
  const [deleteActivityId, setDeleteActivityId] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
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
      const userRoles = decodedToken.resource_access?.["eventus-rest-api"]?.roles || []

      // Verificar o papel do usuário
      if (userRoles.includes("admin")) {
        setUserRole("admin")
      } else if (userRoles.includes("client_admin")) {
        setUserRole("client_admin")
      } else if (userRoles.includes("client_user")) {
        setUserRole("client_user")
      }

      fetchEvent(token)
    } catch (error) {
      console.error("Erro ao decodificar o token:", error)
      router.push("/feed")
    }
  }, [params.id, router])

  const fetchEvent = async (token: string) => {
    try {
      const response = await fetch(`/api/events/${params.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Falha ao carregar evento")
      }

      const data = await response.json()
      setEvent(data)
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar evento. Tente novamente mais tarde.",
      })
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddActivity = () => {
    router.push(`/events/${params.id}/activities/add`)
  }

  const handleViewDetails = (activityId: number) => {
    router.push(`/events/${params.id}/activities/${activityId}`);
  }

  const handleRegistrantionActivity = async (activityId: number) => {
    try {
      const token = getAuthToken()

      if (!token) {
        router.push("/")
        return
      }

      const response = await fetch(`/api/activity-registrations/${activityId}/register`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,          
        },
      })

      if (!response.ok) {
        throw new Error("Erro ao se inscrever no evento.")
      }

      toast({
        title: "Sucesso!",
        description: "Inscrição realizada com sucesso.",
      })

      router.push(`/events/${params.id}`)

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Usuário já inscrito neste evento.",
      })
      console.error(error)
    } finally {
      setIsDeleting(false)
      setDeleteActivityId(null)
    }
  } 

  const handleRegistration = async () => {
    try {
      const token = getAuthToken()

      if (!token) {
        router.push("/")
        return
      }

      const response = await fetch(`/api/event-registrations/${params.id}/register`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,          
        },
      })

      if (!response.ok) {
        throw new Error("Erro ao se inscrever no evento.")
      }

      toast({
        title: "Sucesso!",
        description: "Inscrição realizada com sucesso.",
      })

      router.push(`/events/${params.id}`)

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Usuário já inscrito neste evento.",
      })
      console.error(error)
    } finally {
      setIsDeleting(false)
      setDeleteActivityId(null)
    }
  }

  const handleDeleteActivity = async () => {
    if (!deleteActivityId) return

    setIsDeleting(true)
    try {
      const token = getAuthToken()

      if (!token) {
        router.push("/")
        return
      }

      const response = await fetch(`/api/activities/${deleteActivityId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-HTTP-Method-Override": "DELETE",
        },
      })

      if (!response.ok) {
        throw new Error("Erro ao excluir atividade")
      }

      toast({
        title: "Sucesso!",
        description: "Atividade excluída com sucesso.",
      })

      const token2 = getAuthToken()

      fetchEvent(token2 || "")
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Ocorreu um erro ao excluir a atividade. Tente novamente.",
      })
      console.error(error)
    } finally {
      setIsDeleting(false)
      setDeleteActivityId(null)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6 flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3DD4A7]"></div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="container mx-auto py-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">Evento não encontrado.</div>
        <Button onClick={() => router.push("/feed")} className="mt-4" variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Feed
        </Button>
      </div>
    )
  }

  return (
    <>
    <Navbar />
    <div className="container mx-auto py-6">
      <Button onClick={() => router.push("/feed")} className="mb-4" variant="outline">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar para Feed
      </Button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">{event.name}</h1>
        {(userRole === "admin" || userRole === "client_admin") && (
          <Button onClick={handleAddActivity} className="bg-[#3DD4A7] hover:bg-[#2bc090]">
            <Plus className="mr-2 h-4 w-4" />
            Adicionar atividade
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Detalhes do Evento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-gray-100 rounded-md mb-4 overflow-hidden">
                  <img
                    src="../../../IFPB.jpg"
                    alt={event.name}
                    className="w-full h-full object-cover"
                  />
              </div>

              {event.description && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-2">Descrição</h3>
                  <p className="text-gray-700">{event.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start">
                <Calendar className="h-5 w-5 text-gray-500 mt-0.5 mr-2" />
                <div>
                  <p className="font-medium">Data do Evento</p>
                  <p className="text-gray-600">{formatDate(event.eventDate)}</p>
                </div>
              </div>

              <div className="flex items-start">
                <Calendar className="h-5 w-5 text-gray-500 mt-0.5 mr-2" />
                <div>
                  <p className="font-medium">Inscrições até</p>
                  <p className="text-gray-600">{formatDate(event.registrationDeadline)}</p>
                </div>
              </div>

              <div className="flex items-start">
                <Users className="h-5 w-5 text-gray-500 mt-0.5 mr-2" />
                <div>
                  <p className="font-medium">Capacidade</p>
                  <p className="text-gray-600">{event.maxRegistrations} participantes</p>
                </div>
              </div>

              <div className="flex items-start">
                <MapPin className="h-5 w-5 text-gray-500 mt-0.5 mr-2" />
                <div>
                  <p className="font-medium">Local</p>
                  <p className="text-gray-600">IFPB</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="mt-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            {(userRole === "user" || userRole === "client_user") && (
              <Button onClick={handleRegistration} className="bg-[#3DD4A7] hover:bg-[#2bc090]">
                <Plus className="mr-2 h-4 w-4" />
                Inscrever-se
              </Button>
            )}
        </div>
        </div>
      </div>

      <Tabs defaultValue="activities" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="activities">Atividades ({event.activities?.length || 0})</TabsTrigger>
          <TabsTrigger value="participants">Participantes</TabsTrigger>
        </TabsList>

        <TabsContent value="activities">
          <h2 className="text-2xl font-bold mb-4">Atividades do Evento</h2>

          {event.activities && event.activities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {event.activities.map((activity: Activity) => (
                <Card key={activity.id} className="overflow-hidden">
                  {activity.photo && (
                    <div className="h-40 overflow-hidden">
                      <img
                        src={activity.photo || "/placeholder.svg"}
                        alt={activity.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{activity.name}</CardTitle>
                        {activity.type && <CardDescription>{activity.type}</CardDescription>}
                      </div>

                      {(userRole === "user" || userRole === "client_user") && (
                        <Button onClick={() => handleRegistrantionActivity(activity.id)} className="bg-[#3DD4A7] hover:bg-[#2bc090]">
                          <Plus className="mr-2 h-4 w-4" />
                          Inscrever-se
                        </Button>
                      )}

                      {(userRole === "admin" || userRole === "client_admin") && (
                        <div className="flex space-x-1">
                          {/* <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Pencil className="h-4 w-4" />
                          </Button> */}
                          <Button variant="outline" size="sm" onClick={() => handleViewDetails(activity.id)}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Detalhes
                          </Button>
                                            
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setDeleteActivityId(activity.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="pb-2">
                    <div className="flex flex-col space-y-2">
                      {activity.location && (
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="h-4 w-4 mr-1" />
                          {activity.location}
                        </div>
                      )}

                      {activity.activityDate && activity.activityTime && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="h-4 w-4 mr-1" />
                          {formatDate(activity.activityDate)} às {activity.activityTime}
                        </div>
                      )}
                    </div>
                  </CardContent>

                  <CardFooter>
                    {activity.category && (
                      <Badge variant="outline" className="bg-[#e6f7f2] text-[#3DD4A7] border-[#3DD4A7]">
                        {activity.category}
                      </Badge>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 text-gray-700 px-4 py-8 rounded text-center">
              <p className="mb-4">Nenhuma atividade cadastrada para este evento.</p>
              {(userRole === "admin" || userRole === "client_admin") && (
                <Button onClick={handleAddActivity} className="bg-[#3DD4A7] hover:bg-[#2bc090]">
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar primeira atividade
                </Button>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="participants">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Participantes ({event.registrations?.length || 0})
              </CardTitle>
              <CardDescription>Lista de pessoas inscritas neste evento</CardDescription>
            </CardHeader>
            <CardContent>
              {event.registrations && event.registrations.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Nome</th>
                        <th className="text-left py-3 px-4">Email</th>
                        <th className="text-left py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {event.registrations.map((participant) => (
                        <tr key={participant.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{participant.userName}</td>
                          <td className="py-3 px-4">
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Confirmado</Badge>
                          </td>
                          <td className="py-3 px-4">
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Confirmado</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center text-gray-500">
                  <Users className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-lg font-medium mb-1">Nenhum participante inscrito</p>
                  <p className="text-sm text-gray-400">
                    Quando as pessoas se inscreverem no evento, elas aparecerão aqui.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Diálogo de confirmação para excluir atividade */}
      <AlertDialog open={deleteActivityId !== null} onOpenChange={(open) => !open && setDeleteActivityId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta atividade? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteActivity}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </>
  )
}

