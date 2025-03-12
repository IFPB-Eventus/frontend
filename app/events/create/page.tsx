"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, ImageIcon, Loader2, Plus } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Navbar from "@/components/navbar"

export default function CreateEventPage() {
  const [name, setName] = useState("")
  const [maxRegistrations, setMaxRegistrations] = useState("300")
  const [eventDate, setEventDate] = useState<Date>()
  const [registrationDeadline, setRegistrationDeadline] = useState<Date>()
  const [description, setDescription] = useState("")
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const router = useRouter()
  const { toast } = useToast()

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFile = (file: File) => {
    if (file.type.startsWith("image/")) {
      setPhoto(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Por favor, selecione apenas arquivos de imagem.",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1]

      if (!token) {
        router.push("/")
        return
      }

      let photoBase64 = null
      if (photo) {
        const reader = new FileReader()
        photoBase64 = await new Promise((resolve) => {
          reader.onloadend = () => {
            const base64String = reader.result as string
            const base64 = base64String.split(",")[1] 
            resolve(base64)
          }
          reader.readAsDataURL(photo)
        })
      }

      const eventData = {
        name,
        maxRegistrations: Number.parseInt(maxRegistrations),
        eventDate: eventDate?.toISOString().split("T")[0],
        registrationDeadline: registrationDeadline?.toISOString().split("T")[0],
        photo: photoBase64,
        activities: [], // Inicialmente vazio
      }

      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(eventData),
      })

      if (!response.ok) {
        throw new Error("Erro ao criar evento")
      }

      toast({
        title: "Sucesso!",
        description: "Evento criado com sucesso.",
      })

      router.push("/feed")
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Ocorreu um erro ao criar o evento. Tente novamente.",
      })
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
    <Navbar />
    <div className="container max-w-3xl mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Criar evento</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Nome do Evento</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Digite o nome do evento"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxRegistrations">Expectativa de participantes</Label>
          <Select value={maxRegistrations} onValueChange={setMaxRegistrations}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o número máximo de participantes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="100">Até 100 participantes</SelectItem>
              <SelectItem value="200">Até 200 participantes</SelectItem>
              <SelectItem value="300">Até 300 participantes</SelectItem>
              <SelectItem value="500">Até 500 participantes</SelectItem>
              <SelectItem value="1000">Até 1000 participantes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Data do Evento</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn("w-full justify-start text-left font-normal", !eventDate && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {eventDate ? format(eventDate, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={eventDate} onSelect={setEventDate} initialFocus locale={ptBR} />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Data máxima para inscrição</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !registrationDeadline && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {registrationDeadline ? (
                    format(registrationDeadline, "PPP", { locale: ptBR })
                  ) : (
                    <span>Selecione uma data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={registrationDeadline}
                  onSelect={setRegistrationDeadline}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descrição do evento</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Informe a descrição do evento"
            rows={5}
          />
        </div>

        <div className="space-y-2">
          <Label>Foto do evento</Label>
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
              dragActive ? "border-primary bg-primary/10" : "border-gray-300 hover:border-primary",
              photoPreview && "border-none p-0",
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById("file-upload")?.click()}
          >
            {photoPreview ? (
              <div className="relative aspect-video rounded-lg overflow-hidden">
                <img src={photoPreview || "/placeholder.svg"} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                  onClick={(e) => {
                    e.stopPropagation()
                    setPhoto(null)
                    setPhotoPreview("")
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="mx-auto w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <ImageIcon className="h-5 w-5 text-gray-600" />
                </div>
                <div className="text-sm text-gray-600">
                  <span className="text-primary font-semibold">Click para upload</span> ou arraste e solte
                </div>
                <p className="text-xs text-gray-500">JPG, JPEG, PNG (max. 1MB)</p>
              </div>
            )}
            <input
              id="file-upload"
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleFile(e.target.files[0])
                }
              }}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" className="bg-[#3DD4A7] hover:bg-[#2bc090]" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar"
            )}
          </Button>
        </div>
      </form>
    </div>
  </>
  )
}

