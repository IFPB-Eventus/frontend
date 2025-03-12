"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, ImageIcon, Loader2, Clock } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getAuthToken } from "@/lib/get-jwt"

interface PageProps {
  params: {
    id: string
  }
}

const locations = ["Lab 1", "Lab 2", "Lab 3", "Lab 4", "Lab 5", "Auditório", "Sala 1", "Sala 2", "Sala 3"]

const types = ["Curso", "Minicurso", "Palestra", "Workshop", "Mesa Redonda", "Apresentação"]

const categories = ["Computação", "Redes", "Programação", "Design", "Inovação", "Empreendedorismo"]

export default function AddActivityPage({ params }: PageProps) {
  const [name, setName] = useState("")
  const [location, setLocation] = useState("")
  const [activityDate, setActivityDate] = useState<Date>()
  const [activityTime, setActivityTime] = useState("")
  const [type, setType] = useState("")
  const [category, setCategory] = useState("")
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
      const token = getAuthToken()

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

      const activityData = {
        name,
        location,
        activityDate: activityDate?.toISOString().split("T")[0],
        activityTime,
        type,
        category,
        photo: photoBase64,
        eventId: Number.parseInt(params.id),
      }

      const response = await fetch(`/api/activities?eventId=${params.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(activityData),
      })

      if (!response.ok) {
        throw new Error("Erro ao criar atividade")
      }

      toast({
        title: "Sucesso!",
        description: "Atividade criada com sucesso.",
      })

      router.push(`/events/${params.id}`)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Ocorreu um erro ao criar a atividade. Tente novamente.",
      })
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container max-w-3xl mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Adicionar atividade ao evento</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Nome da atividade</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Digite o nome da atividade"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="location">Local</Label>
            <Select value={location} onValueChange={setLocation} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o local" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((loc) => (
                  <SelectItem key={loc} value={loc}>
                    {loc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Data da atividade</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn("w-full justify-start text-left font-normal", !activityDate && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {activityDate ? format(activityDate, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={activityDate} onSelect={setActivityDate} initialFocus locale={ptBR} />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="time">Horário</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="time"
                type="time"
                value={activityTime}
                onChange={(e) => setActivityTime(e.target.value)}
                required
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipo</Label>
            <Select value={type} onValueChange={setType} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {types.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Foto da atividade</Label>
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
  )
}

