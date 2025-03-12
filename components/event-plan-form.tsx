"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { EventPlan } from "@/types/event-plan"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import Link from "next/link"

interface EventPlanFormProps {
  initialData: EventPlan | null
  onSubmit: (data: EventPlan | Omit<EventPlan, "id">) => Promise<void>
  onCancel: () => void
}

export function EventPlanForm({ initialData, onSubmit, onCancel }: EventPlanFormProps) {
  const [formData, setFormData] = useState<EventPlan | Omit<EventPlan, "id">>({
    id: initialData?.id,
    name: initialData?.name || "",
    eventDate: initialData?.eventDate ? new Date(initialData.eventDate) : new Date(),
    microphones: initialData?.microphones || 0,
    projectors: initialData?.projectors || 0,
    rooms: initialData?.rooms || "",
    members: initialData?.members || "",
  })

  const [date, setDate] = useState<Date | undefined>(
    initialData?.eventDate ? new Date(initialData.eventDate) : new Date(),
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    // Converter para número se for um campo numérico
    if (name === "microphones" || name === "projectors") {
      setFormData({
        ...formData,
        [name]: Number.parseInt(value) || 0,
      })
    } else {
      setFormData({
        ...formData,
        [name]: value,
      })
    }
  }

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setDate(date)

      // Certifique-se de que a data está sendo definida corretamente
      // Defina a hora para meio-dia para evitar problemas de fuso horário
      const adjustedDate = new Date(date)
      adjustedDate.setHours(12, 0, 0, 0)

      setFormData({
        ...formData,
        eventDate: adjustedDate,
      })

      console.log("Data selecionada:", adjustedDate)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Nome do Planejamento</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          placeholder="Digite o nome do planejamento"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="eventDate">Data do Evento</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar mode="single" selected={date} onSelect={handleDateChange} initialFocus locale={ptBR} />
          </PopoverContent>
        </Popover>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="microphones">Quantidade de Microfones</Label>
          <Input
            id="microphones"
            name="microphones"
            type="number"
            min="0"
            value={formData.microphones}
            onChange={handleChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="projectors">Quantidade de Projetores</Label>
          <Input
            id="projectors"
            name="projectors"
            type="number"
            min="0"
            value={formData.projectors}
            onChange={handleChange}
            required
          />
        </div>
      </div>

    
      <div className="space-y-2">
        <Label htmlFor="members">Membros da Equipe</Label>
        <Textarea
          id="members"
          name="members"
          value={formData.members}
          onChange={handleChange}
          required
          placeholder="Liste os membros da equipe (um por linha)"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="rooms">Salas</Label>
        <Textarea
          id="rooms"
          name="rooms"
          value={formData.rooms}
          onChange={handleChange}
          required
          placeholder="Liste as salas necessárias (uma por linha)"
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-[#3DD4A7] hover:bg-[#2bc090]">
          {initialData ? "Atualizar" : "Criar"} Planejamento
        </Button>
      </div>
    </form>
  )
}

