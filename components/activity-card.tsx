"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin, Plus, ExternalLink, Check, Trash2, Loader2, TicketIcon } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { getAuthToken } from "@/lib/get-jwt"
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
import { motion } from "framer-motion"

interface ActivityCardProps {
  activity: any
  eventId: string
  userRole: string
  registeredActivities: number[]
  onRegister: (activityId: number) => Promise<void>
  onDelete?: (activityId: number) => void
  onRefresh?: () => void
}

export default function ActivityCard({
  activity,
  eventId,
  userRole,
  registeredActivities,
  onRegister,
  onDelete,
  onRefresh,
}: ActivityCardProps) {
  const [registeringActivity, setRegisteringActivity] = useState<boolean>(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [isCanceling, setIsCanceling] = useState(false)

  const router = useRouter()
  const { toast } = useToast()

  const isRegistered = registeredActivities.includes(activity.id)

  const handleViewDetails = () => {
    router.push(`/events/${eventId}/activities/${activity.id}`)
  }

  const handleRegistration = async () => {
    setRegisteringActivity(true)
    try {
      await onRegister(activity.id)
    } finally {
      setRegisteringActivity(false)
    }
  }

  const handleCancelRegistration = async () => {
    setIsCanceling(true)
    try {
      const token = getAuthToken()

      if (!token) {
        router.push("/")
        return
      }

      const response = await fetch(`/api/activity-registrations/${activity.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-HTTP-Method-Override": "DELETE",
        },
      })

      if (!response.ok) {
        throw new Error("Erro ao cancelar inscrição na atividade.")
      }

      toast({
        title: "Sucesso!",
        description: "Sua inscrição na atividade foi cancelada com sucesso.",
      })

      // Refresh the activity list
      if (onRefresh) {
        onRefresh()
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao cancelar inscrição.",
      })
      console.error(error)
    } finally {
      setIsCanceling(false)
      setShowCancelDialog(false)
    }
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

  return (
    <>
      <motion.div
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
            {isRegistered && (
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
            <Button variant="outline" size="sm" onClick={handleViewDetails}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Ver detalhes
            </Button>

            {(userRole === "user" || userRole === "client_user") && !isRegistered && (
              <Button
                size="sm"
                className="bg-[#3DD4A7] hover:bg-[#2bc090]"
                onClick={handleRegistration}
                disabled={registeringActivity}
              >
                {registeringActivity ? (
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
                size="sm"
                variant="outline"
                className="border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600"
                onClick={() => setShowCancelDialog(true)}
                disabled={isCanceling}
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

            {(userRole === "admin" || userRole === "client_admin") && (
              <Button
                variant="outline"
                size="sm"
                className="text-red-500 hover:text-red-700 hover:bg-red-50 border-red-200"
                onClick={() => onDelete && onDelete(activity.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Diálogo de confirmação para cancelar inscrição */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar cancelamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar sua inscrição nesta atividade? Esta ação não pode ser desfeita.
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

