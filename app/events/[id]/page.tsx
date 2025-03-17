"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { decodeJwt } from "@/lib/jwt"
import { useToast } from "@/components/ui/use-toast"
import type { Event } from "@/types/event"
import { formatDate, cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  Users,
  Trash2,
  ArrowLeft,
  Loader2,
  ExternalLink,
  CalendarDays,
  Check,
  Share2,
  Star,
  TicketIcon,
  Heart,
  Download,
  ChevronDown,
  Filter,
  Search,
} from "lucide-react"
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
import { Separator } from "@/components/ui/separator"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { motion, AnimatePresence } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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
  const [isRegistered, setIsRegistered] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [checkingRegistration, setCheckingRegistration] = useState(true)
  const [registeredActivities, setRegisteredActivities] = useState<number[]>([])
  const [registeringActivity, setRegisteringActivity] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [showAllActivities, setShowAllActivities] = useState(false)
  const [activityFilter, setActivityFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isFavorite, setIsFavorite] = useState(false)
  const [showShareOptions, setShowShareOptions] = useState(false)
  // Add a new state variable to track the user's registration ID
  const [userRegistrationId, setUserRegistrationId] = useState<number | null>(null)
  const [isCanceling, setIsCanceling] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  // Adicione um estado para rastrear o status da inscrição
  const [registrationStatus, setRegistrationStatus] = useState<string>("PENDING")

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

  // Adicione uma função para verificar periodicamente o status da inscrição
  useEffect(() => {
    // Verificar o status da inscrição a cada 30 segundos se o usuário estiver inscrito
    if (isRegistered && !checkingRegistration) {
      const intervalId = setInterval(() => {
        const token = getAuthToken()
        if (token) {
          checkRegistrationStatus(token)
        }
      }, 30000) // 30 segundos

      return () => clearInterval(intervalId)
    }
  }, [isRegistered, checkingRegistration, params.id])

  // Add a function to check registration status
  const checkRegistrationStatus = async (token: string) => {
    setCheckingRegistration(true)
    try {
      // Buscar dados do evento que inclui as inscrições
      const eventResponse = await fetch(`/api/events/${params.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (eventResponse.ok) {
        const eventData = await eventResponse.json()

        // Obter informações do usuário do token
        const decodedToken = decodeJwt(token)
        const userId = decodedToken.sub

        // Verificar se o usuário está na lista de registrations
        const userRegistration = eventData.registrations?.find(
          (reg: any) => reg.userId === userId && reg.registered === true,
        )

        setIsRegistered(!!userRegistration)

        if (userRegistration) {
          setUserRegistrationId(userRegistration.id)
          // Como não temos informações detalhadas sobre o status, assumimos ACTIVE se registered for true
          setRegistrationStatus(userRegistration.registered ? "ACTIVE" : "PENDING")
        } else {
          setUserRegistrationId(null)
          setRegistrationStatus("PENDING")
        }

        // Para as atividades, como não temos a rota específica,
        // podemos manter o estado atual ou implementar uma lógica baseada nos dados disponíveis
        // Por enquanto, mantemos o array existente
      }
    } catch (error) {
      console.error("Erro ao verificar status de inscrição:", error)
    } finally {
      setCheckingRegistration(false)
    }
  }

  // Add a function to handle cancellation of registration
  const handleCancelRegistration = async () => {
    setIsCanceling(true)
    try {
      const token = getAuthToken()

      if (!token) {
        router.push("/")
        return
      }

      // Usar o ID do evento para cancelar a inscrição
      const response = await fetch(`/api/event-registrations/${params.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-HTTP-Method-Override": "DELETE",
        },
      })

      if (!response.ok) {
        throw new Error("Erro ao cancelar inscrição no evento.")
      }

      toast({
        title: "Sucesso!",
        description: "Sua inscrição foi cancelada com sucesso.",
      })

      // Update registration status
      setIsRegistered(false)
      setUserRegistrationId(null)
      setShowCancelDialog(false)

      // Also clear registered activities since the user is no longer registered for the event
      setRegisteredActivities([])
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao cancelar inscrição.",
      })
      console.error(error)
    } finally {
      setIsCanceling(false)
    }
  }

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

      // Check registration status after fetching event
      await checkRegistrationStatus(token)
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
    router.push(`/events/${params.id}/activities/${activityId}`)
  }

  const handleRegistrationActivity = async (activityId: number) => {
    setRegisteringActivity(activityId)

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
        const data = await response.json()
        throw new Error(data.error || "Erro ao se inscrever na atividade.")
      }

      toast({
        title: "Sucesso!",
        description: "Inscrição na atividade realizada com sucesso.",
      })

      // Update registered activities list
      setRegisteredActivities((prev) => [...prev, activityId])
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao processar inscrição.",
      })
      console.error(error)
    } finally {
      setRegisteringActivity(null)
    }
  }

  // Modifique a função handleRegistration para atualizar o estado após a inscrição
  const handleRegistration = async () => {
    setIsRegistering(true)

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
        const data = await response.json()
        throw new Error(data.error || "Erro ao se inscrever no evento.")
      }

      // Obter o ID da inscrição da resposta
      const data = await response.json()
      if (data && data.id) {
        setUserRegistrationId(data.id)
      }

      toast({
        title: "Sucesso!",
        description: "Inscrição no evento realizada com sucesso.",
      })

      // Update registration status
      setIsRegistered(true)
      setRegistrationStatus("ACTIVE")

      // Atualizar os dados do evento após o registro
      const token2 = getAuthToken()
      if (token2) {
        fetchEvent(token2)
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao processar inscrição.",
      })
      console.error(error)
    } finally {
      setIsRegistering(false)
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

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite)
    toast({
      title: isFavorite ? "Removido dos favoritos" : "Adicionado aos favoritos",
      description: isFavorite
        ? "Este evento foi removido da sua lista de favoritos"
        : "Este evento foi adicionado à sua lista de favoritos",
    })
  }

  const handleShare = (platform: string) => {
    const eventUrl = window.location.href
    let shareUrl = ""

    switch (platform) {
      case "whatsapp":
        shareUrl = `https://wa.me/?text=${encodeURIComponent(`Confira este evento: ${event?.name} - ${eventUrl}`)}`
        break
      case "telegram":
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(eventUrl)}&text=${encodeURIComponent(`Confira este evento: ${event?.name}`)}`
        break
      case "email":
        shareUrl = `mailto:?subject=${encodeURIComponent(`Confira este evento: ${event?.name}`)}&body=${encodeURIComponent(`Olá, achei que você poderia se interessar por este evento: ${event?.name}. Confira em: ${eventUrl}`)}`
        break
      case "copy":
        navigator.clipboard.writeText(eventUrl)
        toast({
          title: "Link copiado!",
          description: "O link do evento foi copiado para a área de transferência.",
        })
        setShowShareOptions(false)
        return
    }

    if (shareUrl) {
      window.open(shareUrl, "_blank")
    }

    setShowShareOptions(false)
  }

  const getActivityTypeColor = (type: string) => {
    const typeColors: Record<string, string> = {
      Palestra: "bg-blue-100 text-blue-800 border-blue-200",
      Workshop: "bg-purple-100 text-purple-800 border-purple-200",
      "Mesa Redonda": "bg-amber-100 text-amber-800 border-amber-200",
      Curso: "bg-emerald-100 text-emerald-800 border-emerald-200",
      Minicurso: "bg-teal-100 text-teal-800 border-teal-200",
      Apresentação: "bg-indigo-100 text-indigo-800 border-indigo-200",
    }

    return typeColors[type] || "bg-gray-100 text-gray-800 border-gray-200"
  }

  const getActivityCategoryColor = (category: string) => {
    const categoryColors: Record<string, string> = {
      Computação: "bg-blue-50 text-blue-600 border-blue-100",
      Redes: "bg-indigo-50 text-indigo-600 border-indigo-100",
      Programação: "bg-violet-50 text-violet-600 border-violet-100",
      Design: "bg-pink-50 text-pink-600 border-pink-100",
      Inovação: "bg-amber-50 text-amber-600 border-amber-100",
      Empreendedorismo: "bg-emerald-50 text-emerald-600 border-emerald-100",
    }

    return categoryColors[category] || "bg-gray-50 text-gray-600 border-gray-100"
  }

  const getFilteredActivities = () => {
    if (!event?.activities) return []

    let filtered = [...event.activities]

    // Apply category/type filter
    if (activityFilter !== "all") {
      filtered = filtered.filter((activity) => activity.category === activityFilter || activity.type === activityFilter)
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (activity) =>
          activity.name.toLowerCase().includes(query) ||
          (activity.description && activity.description.toLowerCase().includes(query)),
      )
    }

    return filtered
  }

  const getUniqueFilters = () => {
    if (!event?.activities) return []

    const categories = new Set<string>()
    const types = new Set<string>()

    event.activities.forEach((activity) => {
      if (activity.category) categories.add(activity.category)
      if (activity.type) types.add(activity.type)
    })

    return [
      { label: "Todas", value: "all" },
      ...Array.from(categories).map((cat) => ({ label: cat, value: cat })),
      ...Array.from(types).map((type) => ({ label: type, value: type })),
    ]
  }

  const filteredActivities = getFilteredActivities()
  const filterOptions = getUniqueFilters()

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

  if (!event) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto py-6">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">Evento não encontrado.</div>
          <Button onClick={() => router.push("/feed")} className="mt-4" variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Feed
          </Button>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/30 z-10"></div>
        <div
          className="h-[40vh] md:h-[60vh] w-full bg-cover bg-center"
          style={{
            backgroundImage: `url(${event.photo || "../../../IFPB.jpg"})`,
          }}
        ></div>

        <div className="container mx-auto absolute inset-0 z-20 flex flex-col justify-end pb-8 px-4 md:px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="flex items-center gap-2 mb-4">
              <Badge className="bg-[#3DD4A7] hover:bg-[#3DD4A7] text-white border-none">Evento</Badge>
              {isRegistered && (
                <Badge className="bg-green-500 hover:bg-green-500 text-white border-none">
                  <Check className="h-3 w-3 mr-1" />
                  {registrationStatus === "CONFIRMED" ? "Confirmado" : "Inscrito"}
                </Badge>
              )}
            </div>

            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">{event.name}</h1>

            <div className="flex flex-wrap gap-4 mt-4">
              <div className="flex items-center text-white/90 text-sm">
                <CalendarDays className="h-4 w-4 mr-2" />
                {formatDate(event.eventDate)}
              </div>
              <div className="flex items-center text-white/90 text-sm">
                <MapPin className="h-4 w-4 mr-2" />
                IFPB Campus Cajazeiras
              </div>
              <div className="flex items-center text-white/90 text-sm">
                <Users className="h-4 w-4 mr-2" />
                {event.maxRegistrations} participantes
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {(userRole === "user" || userRole === "client_user") && !isRegistered && (
                <Button
                  onClick={handleRegistration}
                  className="bg-[#3DD4A7] hover:bg-[#2bc090] text-white"
                  disabled={isRegistering}
                  size="lg"
                >
                  {isRegistering ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Inscrevendo...
                    </>
                  ) : (
                    <>
                      <TicketIcon className="mr-2 h-4 w-4" />
                      Inscrever-se
                    </>
                  )}
                </Button>
              )}
              {(userRole === "user" || userRole === "client_user") && isRegistered && (
                <Button
                  onClick={() => setShowCancelDialog(true)}
                  className="bg-red-500 hover:bg-red-600 text-white"
                  disabled={isCanceling}
                  size="lg"
                >
                  {isCanceling ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cancelando...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Cancelar inscrição
                    </>
                  )}
                </Button>
              )}

              <Button
                variant="outline"
                className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
                onClick={() => setShowShareOptions(!showShareOptions)}
              >
                <Share2 className="mr-2 h-4 w-4" />
                Compartilhar
              </Button>

              {/* Share options dropdown */}
              <AnimatePresence>
                {showShareOptions && (
                  <motion.div
                    className="absolute mt-12 bg-white rounded-lg shadow-lg p-2 z-30"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex flex-col gap-1 min-w-[180px]">
                      <Button variant="ghost" className="justify-start" onClick={() => handleShare("whatsapp")}>
                        WhatsApp
                      </Button>
                      <Button variant="ghost" className="justify-start" onClick={() => handleShare("telegram")}>
                        Telegram
                      </Button>
                      <Button variant="ghost" className="justify-start" onClick={() => handleShare("email")}>
                        Email
                      </Button>
                      <Separator className="my-1" />
                      <Button variant="ghost" className="justify-start" onClick={() => handleShare("copy")}>
                        Copiar link
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto py-8 px-4 md:px-6">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Column - Main Content */}
          <div className="w-full md:w-2/3">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-6 bg-white border rounded-lg p-1">
                <TabsTrigger
                  value="overview"
                  className="data-[state=active]:bg-[#3DD4A7] data-[state=active]:text-white rounded-md"
                >
                  Visão Geral
                </TabsTrigger>
                <TabsTrigger
                  value="activities"
                  className="data-[state=active]:bg-[#3DD4A7] data-[state=active]:text-white rounded-md"
                >
                  Atividades ({event.activities?.length || 0})
                </TabsTrigger>
                <TabsTrigger
                  value="participants"
                  className="data-[state=active]:bg-[#3DD4A7] data-[state=active]:text-white rounded-md"
                >
                  Participantes
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="focus-visible:outline-none focus-visible:ring-0">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                  <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <h2 className="text-2xl font-bold mb-4">Sobre o evento</h2>
                    <p className="text-gray-700 mb-6 leading-relaxed">
                      {event.description ||
                        "Este evento promete ser uma experiência enriquecedora para todos os participantes, oferecendo oportunidades de aprendizado, networking e crescimento profissional. Junte-se a nós para explorar as últimas tendências e inovações da área."}
                    </p>

                    <Separator className="my-6" />

                    <h3 className="text-lg font-semibold mb-4">Destaques</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-start">
                        <div className="bg-[#e6f7f2] p-2 rounded-lg mr-3">
                          <Star className="h-5 w-5 text-[#3DD4A7]" />
                        </div>
                        <div>
                          <h4 className="font-medium">Palestrantes Renomados</h4>
                          <p className="text-sm text-gray-600">Aprenda com especialistas da área</p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <div className="bg-[#e6f7f2] p-2 rounded-lg mr-3">
                          <Users className="h-5 w-5 text-[#3DD4A7]" />
                        </div>
                        <div>
                          <h4 className="font-medium">Networking</h4>
                          <p className="text-sm text-gray-600">Conecte-se com outros profissionais</p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <div className="bg-[#e6f7f2] p-2 rounded-lg mr-3">
                          <TicketIcon className="h-5 w-5 text-[#3DD4A7]" />
                        </div>
                        <div>
                          <h4 className="font-medium">Certificado</h4>
                          <p className="text-sm text-gray-600">Receba certificado de participação</p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <div className="bg-[#e6f7f2] p-2 rounded-lg mr-3">
                          <Calendar className="h-5 w-5 text-[#3DD4A7]" />
                        </div>
                        <div>
                          <h4 className="font-medium">Atividades Diversas</h4>
                          <p className="text-sm text-gray-600">
                            {event.activities?.length || 0} atividades disponíveis
                          </p>
                        </div>
                      </div>
                    </div>

                    <Separator className="my-6" />

                    <h3 className="text-lg font-semibold mb-4">Perguntas Frequentes</h3>
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="item-1">
                        <AccordionTrigger>Como faço para me inscrever nas atividades?</AccordionTrigger>
                        <AccordionContent>
                          Após se inscrever no evento, você pode navegar até a aba "Atividades" e clicar no botão
                          "Inscrever-se" em cada atividade de seu interesse.
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-2">
                        <AccordionTrigger>Posso cancelar minha inscrição?</AccordionTrigger>
                        <AccordionContent>
                          Sim, você pode cancelar sua inscrição a qualquer momento antes do início do evento. Basta
                          acessar seu perfil e gerenciar suas inscrições.
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>

                  {event.activities && event.activities.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold">Próximas atividades</h2>
                        <Button
                          variant="link"
                          onClick={() => setActiveTab("activities")}
                          className="text-[#3DD4A7] hover:text-[#2bc090]"
                        >
                          Ver todas
                        </Button>
                      </div>

                      <div className="space-y-4">
                        {event.activities.slice(0, 3).map((activity) => (
                          <motion.div
                            key={activity.id}
                            className="flex flex-col sm:flex-row gap-4 p-4 border rounded-lg hover:border-[#3DD4A7] transition-colors cursor-pointer group"
                            onClick={() => handleViewDetails(activity.id)}
                            whileHover={{ scale: 1.01 }}
                            transition={{ type: "spring", stiffness: 400, damping: 10 }}
                          >
                            <div className="sm:w-24 h-24 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                              {activity.photo ? (
                                <img
                                  src={activity.photo || "/placeholder.svg"}
                                  alt={activity.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Calendar className="h-8 w-8 text-gray-400" />
                                </div>
                              )}
                            </div>

                            <div className="flex-1">
                              <div className="flex flex-wrap gap-2 mb-2">
                                {activity.type && (
                                  <Badge variant="outline" className={getActivityTypeColor(activity.type)}>
                                    {activity.type}
                                  </Badge>
                                )}
                                {activity.category && (
                                  <Badge variant="outline" className={getActivityCategoryColor(activity.category)}>
                                    {activity.category}
                                  </Badge>
                                )}
                                {registeredActivities.includes(activity.id) && (
                                  <Badge className="bg-green-100 text-green-800 border-green-200">
                                    <Check className="h-3 w-3 mr-1" />
                                    Inscrito
                                  </Badge>
                                )}
                              </div>

                              <h3 className="font-semibold text-lg group-hover:text-[#3DD4A7] transition-colors">
                                {activity.name}
                              </h3>

                              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-gray-600">
                                <div className="flex items-center">
                                  <Calendar className="h-4 w-4 mr-1" />
                                  {formatDate(activity.activityDate)}
                                </div>
                                <div className="flex items-center">
                                  <Clock className="h-4 w-4 mr-1" />
                                  {activity.activityTime}
                                </div>
                                <div className="flex items-center">
                                  <MapPin className="h-4 w-4 mr-1" />
                                  {activity.location}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              </TabsContent>

              <TabsContent value="activities" className="focus-visible:outline-none focus-visible:ring-0">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                  <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                      <h2 className="text-2xl font-bold">Atividades do evento</h2>

                      {(userRole === "admin" || userRole === "client_admin") && (
                        <Button onClick={handleAddActivity} className="bg-[#3DD4A7] hover:bg-[#2bc090]">
                          <Plus className="mr-2 h-4 w-4" />
                          Adicionar atividade
                        </Button>
                      )}
                    </div>

                    {/* Search and filter controls */}
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Buscar atividades..."
                          className="pl-10"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="w-full md:w-auto">
                            <Filter className="h-4 w-4 mr-2" />
                            Filtrar: {activityFilter === "all" ? "Todas" : activityFilter}
                            <ChevronDown className="h-4 w-4 ml-2" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[200px]" align="end">
                          {filterOptions.map((option) => (
                            <DropdownMenuItem
                              className={cn(
                                "cursor-pointer",
                                activityFilter === option.value && "bg-[#e6f7f2] text-[#3DD4A7] font-medium",
                              )}
                              key={option.value}
                              onClick={() => setActivityFilter(option.value)}
                              className={cn(
                                "cursor-pointer",
                                activityFilter === option.value && "bg-[#e6f7f2] text-[#3DD4A7] font-medium",
                              )}
                            >
                              {option.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {filteredActivities.length > 0 ? (
                      <div className="space-y-6">
                        {(showAllActivities ? filteredActivities : filteredActivities.slice(0, 5)).map((activity) => (
                          <motion.div
                            key={activity.id}
                            className="flex flex-col md:flex-row gap-4 p-4 border rounded-lg hover:border-[#3DD4A7] transition-colors"
                            whileHover={{ scale: 1.01 }}
                            transition={{ type: "spring", stiffness: 400, damping: 10 }}
                          >
                            <div className="md:w-32 h-32 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                              {activity.photo ? (
                                <img
                                  src={activity.photo || "/placeholder.svg"}
                                  alt={activity.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Calendar className="h-10 w-10 text-gray-400" />
                                </div>
                              )}
                            </div>

                            <div className="flex-1">
                              <div className="flex flex-wrap gap-2 mb-2">
                                {activity.type && (
                                  <Badge variant="outline" className={getActivityTypeColor(activity.type)}>
                                    {activity.type}
                                  </Badge>
                                )}
                                {activity.category && (
                                  <Badge variant="outline" className={getActivityCategoryColor(activity.category)}>
                                    {activity.category}
                                  </Badge>
                                )}
                                {registeredActivities.includes(activity.id) && (
                                  <Badge className="bg-green-100 text-green-800 border-green-200">
                                    <Check className="h-3 w-3 mr-1" />
                                    Inscrito
                                  </Badge>
                                )}
                              </div>

                              <h3 className="font-semibold text-lg">{activity.name}</h3>

                              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-gray-600">
                                <div className="flex items-center">
                                  <Calendar className="h-4 w-4 mr-1" />
                                  {formatDate(activity.activityDate)}
                                </div>
                                <div className="flex items-center">
                                  <Clock className="h-4 w-4 mr-1" />
                                  {activity.activityTime}
                                </div>
                                <div className="flex items-center">
                                  <MapPin className="h-4 w-4 mr-1" />
                                  {activity.location}
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2 mt-4">
                                <Button variant="outline" size="sm" onClick={() => handleViewDetails(activity.id)}>
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  Ver detalhes
                                </Button>

                                {(userRole === "user" || userRole === "client_user") &&
                                  !registeredActivities.includes(activity.id) && (
                                    <Button
                                      size="sm"
                                      className="bg-[#3DD4A7] hover:bg-[#2bc090]"
                                      onClick={() => handleRegistrationActivity(activity.id)}
                                      disabled={registeringActivity === activity.id}
                                    >
                                      {registeringActivity === activity.id ? (
                                        <>
                                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                          Inscrevendo...
                                        </>
                                      ) : (
                                        <>
                                          <Plus className="mr-2 h-4 w-4" />
                                          Inscrever-se
                                        </>
                                      )}
                                    </Button>
                                  )}

                                {(userRole === "admin" || userRole === "client_admin") && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 border-red-200"
                                    onClick={() => setDeleteActivityId(activity.id)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Excluir
                                  </Button>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))}

                        {filteredActivities.length > 5 && (
                          <div className="flex justify-center mt-6">
                            <Button
                              variant="outline"
                              onClick={() => setShowAllActivities(!showAllActivities)}
                              className="w-full md:w-auto"
                            >
                              {showAllActivities ? (
                                <>Mostrar menos</>
                              ) : (
                                <>Mostrar todas as {filteredActivities.length} atividades</>
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-gray-50 rounded-lg border">
                        <Calendar className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-xl font-medium mb-2">
                          {searchQuery || activityFilter !== "all"
                            ? "Nenhuma atividade encontrada"
                            : "Nenhuma atividade cadastrada"}
                        </h3>
                        <p className="text-gray-500 mb-6">
                          {searchQuery || activityFilter !== "all"
                            ? "Tente ajustar os filtros ou termos de busca."
                            : "Este evento ainda não possui atividades."}
                        </p>

                        {(userRole === "admin" || userRole === "client_admin") &&
                          !searchQuery &&
                          activityFilter === "all" && (
                            <Button onClick={handleAddActivity} className="bg-[#3DD4A7] hover:bg-[#2bc090]">
                              <Plus className="mr-2 h-4 w-4" />
                              Adicionar primeira atividade
                            </Button>
                          )}
                      </div>
                    )}
                  </div>
                </motion.div>
              </TabsContent>

              <TabsContent value="participants" className="focus-visible:outline-none focus-visible:ring-0">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="text-2xl font-bold mb-6">Participantes</h2>

                    {event.registrations && event.registrations.length > 0 ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {event.registrations.map((participant) => (
                            <motion.div
                              key={participant.id}
                              className="flex items-center p-3 border rounded-lg hover:border-[#3DD4A7] transition-colors"
                              whileHover={{ scale: 1.02 }}
                              transition={{ type: "spring", stiffness: 400, damping: 10 }}
                            >
                              <Avatar className="h-10 w-10 mr-3">
                                <AvatarImage
                                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${participant.userName}`}
                                />
                                <AvatarFallback className="bg-[#e6f7f2] text-[#3DD4A7]">
                                  {participant.userName?.charAt(0) || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{participant.userName || "Participante"}</p>
                                <p className="text-sm text-gray-500">Confirmado</p>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-gray-50 rounded-lg border">
                        <Users className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-xl font-medium mb-2">Nenhum participante inscrito</h3>
                        <p className="text-gray-500">
                          Quando as pessoas se inscreverem no evento, elas aparecerão aqui.
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Sidebar */}
          <div className="w-full md:w-1/3">
            <div className="sticky top-24">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                  <h2 className="text-xl font-bold mb-4">Informações do evento</h2>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="bg-[#e6f7f2] p-2 rounded-lg mr-3">
                        <Calendar className="h-5 w-5 text-[#3DD4A7]" />
                      </div>
                      <div>
                        <h4 className="font-medium">Data do evento</h4>
                        <p className="text-gray-600">{formatDate(event.eventDate)}</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="bg-[#e6f7f2] p-2 rounded-lg mr-3">
                        <MapPin className="h-5 w-5 text-[#3DD4A7]" />
                      </div>
                      <div>
                        <h4 className="font-medium">Local</h4>
                        <p className="text-gray-600">IFPB</p>
                        <p className="text-sm text-gray-500">Campus Cajazeiras</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="bg-[#e6f7f2] p-2 rounded-lg mr-3">
                        <Users className="h-5 w-5 text-[#3DD4A7]" />
                      </div>
                      <div>
                        <h4 className="font-medium">Capacidade</h4>
                        <p className="text-gray-600">{event.maxRegistrations} participantes</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="bg-[#e6f7f2] p-2 rounded-lg mr-3">
                        <CalendarDays className="h-5 w-5 text-[#3DD4A7]" />
                      </div>
                      <div>
                        <h4 className="font-medium">Inscrições até</h4>
                        <p className="text-gray-600">{formatDate(event.registrationDeadline)}</p>
                      </div>
                    </div>
                  </div>
                  <Separator className="my-6" />
                  <div className="space-y-4">
                    {(userRole === "user" || userRole === "client_user") && (
                      <>
                        {!isRegistered ? (
                          <Button
                            className="w-full bg-[#3DD4A7] hover:bg-[#2bc090] h-12 text-base"
                            disabled={isRegistering || checkingRegistration}
                            onClick={handleRegistration}
                          >
                            {checkingRegistration ? (
                              <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Verificando...
                              </>
                            ) : isRegistering ? (
                              <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Inscrevendo...
                              </>
                            ) : (
                              <>
                                <TicketIcon className="mr-2 h-5 w-5" />
                                Inscrever-se no evento
                              </>
                            )}
                          </Button>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Badge className="bg-green-100 text-green-800 px-3 py-1 text-xs rounded-full">
                                Inscrito
                              </Badge>
                              {userRegistrationId && (
                                <span className="text-xs text-gray-500">ID: {userRegistrationId}</span>
                              )}
                            </div>
                            <Button
                              className="w-full bg-red-500 hover:bg-red-600 h-12 text-base text-white"
                              disabled={isCanceling || checkingRegistration}
                              onClick={() => setShowCancelDialog(true)}
                            >
                              {checkingRegistration ? (
                                <>
                                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                  Verificando...
                                </>
                              ) : isCanceling ? (
                                <>
                                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                  Cancelando...
                                </>
                              ) : (
                                <>
                                  <Trash2 className="mr-2 h-5 w-5" />
                                  Cancelar inscrição
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

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

      {/* Botão de voltar para mobile */}
      <div className="md:hidden fixed bottom-4 left-4 z-30">
        <Button onClick={() => router.push("/feed")} className="bg-white text-gray-800 shadow-lg border" size="icon">
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      {/* Diálogo de confirmação para cancelar inscrição */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar cancelamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar sua inscrição neste evento? Esta ação não pode ser desfeita e você perderá
              todas as suas inscrições em atividades.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCanceling}>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelRegistration}
              disabled={isCanceling}
              className="bg-red-500 hover:bg-red-600"
            >
              {isCanceling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelando...
                </>
              ) : (
                "Confirmar cancelamento"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

