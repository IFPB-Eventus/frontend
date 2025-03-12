"use client"

import type React from "react"

import type { Event } from "@/types/event"
import { formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Trash2, MapPin } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
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
import { getAuthToken } from "@/lib/get-jwt"

interface EventCardProps {
  event: Event
  userRole?: string
  onDelete?: () => void
}

export default function EventCard({ event, userRole, onDelete }: EventCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const { toast } = useToast()

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation() 
    setIsDeleting(true)
    try {
      const token = getAuthToken()

      if (!token) {
        throw new Error("Não autenticado")
      }

      const response = await fetch(`/api/events/${event.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-HTTP-Method-Override": "DELETE",
        },
      })

      if (!response.ok) {
        throw new Error("Erro ao excluir evento")
      }

      toast({
        title: "Sucesso!",
        description: "Evento excluído com sucesso.",
      })

      if (onDelete) {
        onDelete()
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Ocorreu um erro ao excluir o evento. Tente novamente.",
      })
      console.error(error)
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 h-full flex flex-col">
      <div className="p-3 md:p-4 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#e6f7f2] text-[#3DD4A7]">
            <MapPin className="h-3 w-3 mr-1" />
            IFPB
          </div>
          {userRole === "admin" || userRole === "client_admin" ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={(e) => {
                e.stopPropagation()
                setShowDeleteDialog(true)
              }}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
        <div className=" bg-gray-100 rounded-md flex items-center justify-center">
            <img src={event.photo || "../IFPB.jpg"} alt={event.name} className="h-60 w-80 object-cover" />
        </div>
        <h3 className="text-lg md:text-xl font-bold mb-2 line-clamp-2">{event.name}</h3>
        <div className="text-xs md:text-sm text-gray-600 mb-3 flex-1">
          <p className="mb-1">
            <strong>Data:</strong> {formatDate(event.eventDate)}
          </p>
          <p className="mb-1">
            <strong>Inscrições até:</strong> {formatDate(event.registrationDeadline)}
          </p>
          <p>
            <strong>Vagas:</strong> {event.maxRegistrations}
          </p>
        </div>
        <div className="mt-auto">
          <p className="text-xs md:text-sm text-gray-500">{event.activities?.length || 0} atividades disponíveis</p>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o evento "{event.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} onClick={(e) => e.stopPropagation()}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-red-500 hover:bg-red-600">
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

