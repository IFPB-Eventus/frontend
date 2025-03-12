"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, MapPin, Tag, Trash2, Loader2, ExternalLink } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface Activity {
  id: number
  name: string
  location: string
  date: string
  time: string
  type: string
  category: string
  image?: string
}

interface ActivityCardProps {
  activity: Activity
  eventId: string
  canDelete?: boolean
  onDelete?: () => void
}

export function ActivityCard({ activity, eventId, canDelete = false, onDelete }: ActivityCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy")
  }

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1]

      if (!token) {
        throw new Error("Usuário não autenticado")
      }

      const response = await fetch(
        `/api/events/${eventId}/activities/${activity.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if (!response.ok) {
        throw new Error("Falha ao excluir atividade")
      }

      toast({
        title: "Atividade excluída",
        description: "A atividade foi excluída com sucesso.",
      })

      if (onDelete) {
        onDelete()
      }
    } catch (error) {
      console.error("Erro ao excluir atividade:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir a atividade. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleViewDetails = () => {
    router.push(`/activities/${activity.id}`)
  }

  return (
    <Card className="overflow-hidden">
      <div className="relative h-48 w-full cursor-pointer" onClick={handleViewDetails}>
        <img
          src={activity.image || "/placeholder.svg?height=200&width=300"}
          alt={activity.name}
          className="h-full w-full object-cover transition-transform hover:scale-105"
        />
      </div>

      <CardContent className="p-4">
        <h3
          className="text-xl font-semibold mb-2 cursor-pointer hover:text-[#3DD4A7] transition-colors"
          onClick={handleViewDetails}
        >
          {activity.name}
        </h3>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span>{formatDate(activity.date)}</span>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <span>{activity.time}</span>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-500" />
            <span>{activity.location}</span>
          </div>

          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-gray-500" />
            <span>{activity.category}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex flex-wrap gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={handleViewDetails}>
          <ExternalLink className="h-4 w-4 mr-2" />
          Detalhes
        </Button>

        {canDelete && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-red-500 border-red-200">
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir atividade</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir esta atividade? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault()
                    handleDelete()
                  }}
                  disabled={isDeleting}
                  className="bg-red-500 hover:bg-red-600"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Excluindo...
                    </>
                  ) : (
                    "Sim, excluir"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardFooter>
    </Card>
  )
}

