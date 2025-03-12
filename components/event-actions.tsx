"use client"

import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { useRouter } from "next/navigation"

interface EventActionsProps {
  eventId: string
}

export function EventActions({ eventId }: EventActionsProps) {
  const router = useRouter()

  const handleAddActivity = () => {
    router.push(`/events/${eventId}/activities/new`)
  }

  return (
    <Button onClick={handleAddActivity} className="bg-[#3DD4A7] hover:bg-[#2bc090]">
      <PlusCircle className="mr-2 h-4 w-4" />
      Adicionar atividade
    </Button>
  )
}

