"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileDown, Pencil } from "lucide-react"
import { decodeJwt } from "@/lib/jwt"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getAuthToken } from "@/lib/get-jwt"
import Navbar from "@/components/navbar"

interface UserProfile {
  id: string
  name: string
  email: string
  avatar?: string
}

interface Registration {
  id: number
  eventTitle: string
  date: string
  status: "present" | "absent" | "pending"
}

interface Certificate {
  id: number
  eventTitle: string
  date: string
  downloadUrl: string
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const token = getAuthToken()

    if (!token) {
      router.push("/")
      return
    }

    try {
      // Decodificar o token JWT para obter informações do usuário
      const decodedToken = decodeJwt(token)

      // Simular dados do perfil (substitua por chamada à API real)
      setProfile({
        id: decodedToken.sub || "",
        name: decodedToken.preferred_username || "",
        email: decodedToken.email || "",
        avatar: "/placeholder.svg",
      })

      // Simular registros (substitua por chamada à API real)
      setRegistrations([
        {
          id: 1,
          eventTitle: "Sertão Comp",
          date: "2024-03-15",
          status: "present",
        },
        {
          id: 2,
          eventTitle: "Mini Curso Python",
          date: "2024-03-20",
          status: "pending",
        },
        {
          id: 3,
          eventTitle: "NestJS com ReactJS",
          date: "2024-03-25",
          status: "pending",
        },
      ])

      // Simular certificados (substitua por chamada à API real)
      setCertificates([
        {
          id: 1,
          eventTitle: "Sertão Comp",
          date: "2024-03-15",
          downloadUrl: "#",
        },
      ])

      setLoading(false)
    } catch (error) {
      console.error("Erro ao carregar perfil:", error)
      router.push("/")
    }
  }, [router])

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return <Badge className="bg-[#e6f7f2] text-[#3DD4A7] border-[#3DD4A7]">Presente</Badge>
      case "absent":
        return <Badge variant="destructive">Ausente</Badge>
      case "pending":
        return <Badge variant="secondary">Não confirmada</Badge>
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6 flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3DD4A7]"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="container mx-auto py-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Erro ao carregar perfil. Por favor, tente novamente.
        </div>
      </div>
    )
  }

  return (
    <>
    <Navbar />
    <div className="container mx-auto py-20 max-w-4xl">
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center md:flex-row md:items-start gap-6">
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100">
                <img
                  src={profile.avatar || "/placeholder.svg"}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <Button
                size="icon"
                variant="outline"
                className="absolute bottom-0 right-0 rounded-full bg-white"
                onClick={() => {
                  /* Implementar edição de foto */
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold mb-2">{profile.name}</h1>
              <p className="text-gray-500 mb-4">{profile.email}</p>
              <Button className="bg-[#3DD4A7] hover:bg-[#2bc090]">Editar Perfil</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center mb-6">
        <Tabs defaultValue="registrations" className="w-full">
          <div className="flex justify-between items-center mb-6">
            <TabsList>
              <TabsTrigger value="registrations">Minhas inscrições</TabsTrigger>
              <TabsTrigger value="certificates">Meus certificados</TabsTrigger>
            </TabsList>

            <Button variant="outline" className="hidden md:flex">
              <FileDown className="mr-2 h-4 w-4" />
              Exportar em PDF
            </Button>
          </div>

          <TabsContent value="registrations">
            <Card>
              <CardHeader>
                <CardTitle>Inscrições em Eventos</CardTitle>
                <CardDescription>Lista de todos os eventos em que você se inscreveu</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Título do evento/atividade</th>
                        <th className="text-left py-3 px-4">Data</th>
                        <th className="text-left py-3 px-4">Presente</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registrations.map((registration) => (
                        <tr key={registration.id} className="border-b">
                          <td className="py-3 px-4">{registration.eventTitle}</td>
                          <td className="py-3 px-4">{formatDate(registration.date)}</td>
                          <td className="py-3 px-4">{getStatusBadge(registration.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="certificates">
            <Card>
              <CardHeader>
                <CardTitle>Certificados Disponíveis</CardTitle>
                <CardDescription>Certificados dos eventos que você participou</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Título do evento</th>
                        <th className="text-left py-3 px-4">Data</th>
                        <th className="text-left py-3 px-4">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {certificates.map((certificate) => (
                        <tr key={certificate.id} className="border-b">
                          <td className="py-3 px-4">{certificate.eventTitle}</td>
                          <td className="py-3 px-4">{formatDate(certificate.date)}</td>
                          <td className="py-3 px-4">
                            <Button variant="outline" size="sm">
                              <FileDown className="mr-2 h-4 w-4" />
                              Baixar
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {certificates.length === 0 && (
                        <tr>
                          <td colSpan={3} className="py-8 text-center text-gray-500">
                            Nenhum certificado disponível ainda
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Botão de exportar para mobile */}
      <div className="md:hidden fixed bottom-4 right-4">
        <Button className="bg-[#3DD4A7] hover:bg-[#2bc090] shadow-lg">
          <FileDown className="mr-2 h-4 w-4" />
          Exportar em PDF
        </Button>
      </div>
    </div>
    </>
  )
}

