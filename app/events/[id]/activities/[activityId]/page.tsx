"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Calendar, Clock, MapPin, Tag, ArrowLeft, Users, Search, Check, X, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "@/hooks/use-toast"
import { decodeJwt } from "@/lib/jwt"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { getAuthToken } from "@/lib/get-jwt"
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface Registration {
  id: number
  userId: string
  userName: string
  email: string
  present?: boolean
}

interface Activity {
  id: number
  name: string
  description: string
  location: string
  activityDate: string
  activityTime: string
  type: string
  category: string
  photo?: string
  registrations: Registration[]
}

interface Participant {
  id: number
  userId: string
  userName: string
  email: string
  present: boolean
  loading?: boolean
}

export default function ActivityDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const activityId = params.activityId as string

  const [activity, setActivity] = useState<Activity | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [filteredParticipants, setFilteredParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingAttendance, setLoadingAttendance] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    const token = getAuthToken()

    if (!token) {
      router.push("/")
      return
    }

    try {
      const decodedToken = decodeJwt(token)
      const userRoles = decodedToken.resource_access?.["eventus-rest-api"]?.roles || []

      if (userRoles.includes("admin")) {
        setUserRole("admin")
      } else if (userRoles.includes("client_admin")) {
        setUserRole("client_admin")
      } else if (userRoles.includes("client_user")) {
        setUserRole("client_user")
      }

      fetchActivityDetails()
    } catch (error) {
      console.error("Erro ao decodificar token:", error)
      router.push("/")
    }
  }, [activityId, router])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredParticipants(participants)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = participants.filter(
        (participant) =>
          participant.userName?.toLowerCase().includes(query) || participant.email?.toLowerCase().includes(query),
      )
      setFilteredParticipants(filtered)
    }
  }, [searchQuery, participants])

  const fetchActivityDetails = async () => {
    const token = getAuthToken()

    try {
      const response = await fetch(`/api/activities/${activityId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Falha ao buscar a atividade")
      }

      const data = await response.json()
      setActivity(data)

      if (data.registrations && data.registrations.length > 0) {
        await fetchParticipantsDetails(data.registrations)
      } else {
        setLoading(false)
      }
    } catch (error) {
      console.error("Erro ao carregar detalhes da atividade:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os detalhes da atividade.",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  const fetchParticipantsDetails = async (registrations: Registration[]) => {
    setLoadingAttendance(true)

    try {
      const participantsData = registrations.map((registration) => ({
        id: registration.id,
        userId: registration.userId,
        userName: registration.userName,
        email: registration.email,
        present: !!registration.present,
      }))

      setParticipants(participantsData)
      setFilteredParticipants(participantsData)
    } catch (error) {
      console.error("Erro ao processar detalhes dos participantes:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de participantes.",
        variant: "destructive",
      })
    } finally {
      setLoadingAttendance(false)
      setLoading(false)
    }
  }

  // Atualizar a função handleToggleAttendance para usar o id numérico
  const handleToggleAttendance = async (participantId: number, userId: string, present: boolean) => {
    // Atualizar estado local para mostrar loading
    setParticipants((prev) => prev.map((p) => (p.id === participantId ? { ...p, loading: true } : p)))
    setFilteredParticipants((prev) => prev.map((p) => (p.id === participantId ? { ...p, loading: true } : p)))

    try {
      const token = getAuthToken()

      if (!token) {
        throw new Error("Usuário não autenticado")
      }

      // Chamada à API para marcar presença
      const response = await fetch(`/api/attendance/${activityId}/${userId}?present=${present}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Falha ao atualizar presença")
      }

      // Atualizar estado local com a nova presença
      setParticipants((prev) => prev.map((p) => (p.id === participantId ? { ...p, present, loading: false } : p)))
      setFilteredParticipants((prev) =>
        prev.map((p) => (p.id === participantId ? { ...p, present, loading: false } : p)),
      )

      toast({
        title: "Presença atualizada",
        description: `${present ? "Presença marcada" : "Presença desmarcada"} com sucesso.`,
      })
    } catch (error) {
      console.error("Erro ao atualizar presença:", error)

      // Reverter estado local em caso de erro
      setParticipants((prev) => prev.map((p) => (p.id === participantId ? { ...p, loading: false } : p)))
      setFilteredParticipants((prev) => prev.map((p) => (p.id === participantId ? { ...p, loading: false } : p)))

      toast({
        title: "Erro",
        description: "Não foi possível atualizar a presença. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
  }

  const getPresentCount = () => {
    return participants.filter((p) => p.present).length
  }

  const getAbsentCount = () => {
    return participants.filter((p) => !p.present).length
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6 flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3DD4A7]"></div>
      </div>
    )
  }

  if (!activity) {
    return (
      <div className="container mx-auto py-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Atividade não encontrada ou erro ao carregar detalhes.
        </div>
      </div>
    )
  }

  const generatePDF = () => {
    const input = document.getElementById("attendance-table");
  
    if (input) {
      input.style.fontSize = "12px";
      input.style.borderCollapse = "collapse";
      input.style.width = "100%";
  
      html2canvas(input, {
        scale: 2, 
        logging: true,
        useCORS: true,
      }).then((canvas) => {
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4"); 
        const imgWidth = 190; 
        const pageHeight = 280;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 10; 
  
        pdf.setFontSize(18);
        pdf.setFont("helvetica", "bold");
        pdf.text("Lista de Presença", 15, position);
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "normal");
        pdf.text(`Atividade: ${activity.name}`, 15, position + 10);
        pdf.text(`Data: ${formatDate(activity.activityDate)}`, 15, position + 16);
  
        pdf.addImage(imgData, "PNG", 10, position + 20, imgWidth, imgHeight);
        heightLeft -= pageHeight;
  
        pdf.setFontSize(10);
        pdf.text(`Total de Presentes: ${getPresentCount()}`, 15, pageHeight - 20);
        pdf.text(`Total de Ausentes: ${getAbsentCount()}`, 15, pageHeight - 15);
  
        pdf.save("lista_de_presenca.pdf");
      });
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Detalhes da Atividade</h1>
      </div>

      <div className="mb-6">
        <div className="relative w-full h-64 rounded-lg overflow-hidden mb-6">
          <img
            src={activity.photo || "/placeholder.svg?height=300&width=600"}
            alt={activity.name}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">{activity.name}</h1>
            <p className="text-gray-500 mb-2">{activity.description}</p>
          </div>
        </div>

        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <div>
                    <div className="font-medium">Data</div>
                    <div>{formatDate(activity.activityDate)}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-gray-500" />
                  <div>
                    <div className="font-medium">Horário</div>
                    <div>{activity.activityTime}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-gray-500" />
                  <div>
                    <div className="font-medium">Local</div>
                    <div>{activity.location}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Tag className="h-5 w-5 text-gray-500" />
                  <div>
                    <div className="font-medium">Categoria</div>
                    <div>{activity.category}</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {(userRole === "admin" || userRole === "client_admin") && (
        <Tabs defaultValue="attendance" className="mb-6">
          <TabsList className="mb-6">
            <TabsTrigger value="participants">Participantes</TabsTrigger>
            <TabsTrigger value="attendance">Controle de Presença</TabsTrigger>
          </TabsList>

          <TabsContent value="participants">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Participantes ({participants.length})
                </CardTitle>
                <CardDescription>Lista de pessoas inscritas nesta atividade</CardDescription>
              </CardHeader>
              <CardContent>
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
                      {participants.length > 0 ? (
                        participants.map((participant) => (
                          <tr key={participant.id} className="border-b">
                            <td className="py-3 px-4">{participant.userName}</td>
                            <td className="py-3 px-4">{participant.email}</td>
                            <td className="py-3 px-4">
                              {participant.present ? (
                                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                  Presente
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-red-500 border-red-200 hover:bg-red-50">
                                  Ausente
                                </Badge>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="text-center py-6 text-gray-500">
                            Nenhum participante inscrito nesta atividade.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendance">
            <Card>
              <CardHeader>
                <CardTitle>Controle de Presença</CardTitle>
                <CardDescription>Marque a presença dos participantes nesta atividade</CardDescription>
                <Button onClick={generatePDF} className="ml-auto">
                Exportar Lista de Presença
              </Button>
              </CardHeader>
             
              <CardContent>
                <div className="flex flex-wrap gap-4 mb-6">
                  <div className="bg-gray-100 rounded-lg p-4 flex-1">
                    <div className="text-sm text-gray-500">Total de participantes</div>
                    <div className="text-2xl font-bold">{participants.length}</div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4 flex-1">
                    <div className="text-sm text-green-600">Presentes</div>
                    <div className="text-2xl font-bold text-green-600">{getPresentCount()}</div>
                  </div>

                  <div className="bg-red-50 rounded-lg p-4 flex-1">
                    <div className="text-sm text-red-600">Ausentes</div>
                    <div className="text-2xl font-bold text-red-600">{getAbsentCount()}</div>
                  </div>
                </div>

                <div className="relative mb-6">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Buscar participante por nome ou email..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="overflow-x-auto">
                  <Table id="attendance-table">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Presença</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loadingAttendance ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-6">
                            <div className="flex justify-center">
                              <Loader2 className="h-6 w-6 animate-spin text-[#3DD4A7]" />
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : filteredParticipants.length > 0 ? (
                        filteredParticipants.map((participant) => (
                          <TableRow key={participant.id}>
                            <TableCell className="font-medium">{participant.userName}</TableCell>
                            <TableCell>{participant.email}</TableCell>
                            <TableCell>
                              {participant.present ? (
                                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                  Presente
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-red-500 hover:bg-red-50">
                  
                                  Ausente
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end">
                                {participant.loading ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-[#3DD4A7]" />
                                ) : (
                                  <Checkbox
                                    checked={participant.present}
                                    onCheckedChange={(checked) => {
                                      handleToggleAttendance(participant.id, participant.userId, checked === true)
                                    }}
                                    className="data-[state=checked]:bg-[#3DD4A7] data-[state=checked]:border-[#3DD4A7]"
                                  />
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-6 text-gray-500">
                            {searchQuery
                              ? "Nenhum participante encontrado com este termo de busca."
                              : "Nenhum participante registrado nesta atividade."}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {userRole === "client_user" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Participantes
            </CardTitle>
            <CardDescription>Lista de pessoas inscritas nesta atividade</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="py-6 text-center text-gray-500">
              Você não tem permissão para visualizar a lista de participantes.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

