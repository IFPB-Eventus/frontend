"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PlusCircle, Search, ArrowLeft, ArrowRight, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EventPlanForm } from "@/components/event-plan-form"
import { EventPlanList } from "@/components/event-plan-list"
import type { EventPlan } from "@/types/event-plan"
import { decodeJwt } from "@/lib/jwt"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getAuthToken } from "@/lib/get-jwt"
import Navbar from "@/components/navbar"

export default function PlanningPage() {
  const [plans, setPlans] = useState<EventPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("list")
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedPlan, setSelectedPlan] = useState<EventPlan | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [planToDelete, setPlanToDelete] = useState<number | null>(null)

  const router = useRouter()
  const { toast } = useToast()
  const itemsPerPage = 10

  // const token = getAuthToken()

  useEffect(() => {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1]

    if (!token) {
      router.push("/")
      return
    }

    try {
      const decodedToken = decodeJwt(token)
      const userRoles = decodedToken.resource_access?.["eventus-rest-api"]?.roles || []

      if (!userRoles.includes("admin") && !userRoles.includes("client_admin")) {
        router.push("/feed")
        return
      }
    } catch (error) {
      console.error("Erro ao decodificar o token:", error)
      router.push("/feed")
      return
    }

    fetchPlans()
  }, [currentPage, router])

  const fetchPlans = async () => {
    setLoading(true)
    setError(null)

    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1]

      if (!token) {
        router.push("/")
        return
      }

      let url = `/api/event-plans?page=${currentPage - 1}&size=${itemsPerPage}`
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error("Falha ao carregar planejamentos")

      const data = await response.json()
      setPlans(data.content || data)
      setTotalPages(data.totalPages || 1)
    } catch (err) {
      setError("Erro ao carregar planejamentos. Tente novamente mais tarde.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePlan = async (plan: Omit<EventPlan, "id">) => {
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

      const formattedPlan = {
        ...plan,
        eventDate: plan.eventDate instanceof Date ? plan.eventDate.toISOString() : plan.eventDate,
      }

      const response = await fetch("/api/event-plans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formattedPlan),
      })

      if (!response.ok) {
        throw new Error("Falha ao criar planejamento")
      }

      toast({
        title: "Sucesso!",
        description: "Planejamento criado com sucesso.",
      })

      setActiveTab("list")
      fetchPlans()
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao criar planejamento. Tente novamente.",
      })
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const confirmDelete = (id: number) => {
    setPlanToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleDeletePlan = async (id: number) => {
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

      console.log("Enviando requisição DELETE para:", `/api/event-plans/${id}`)

      const response = await fetch(`/api/event-plans/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        // Importante: incluir credentials para enviar cookies
        credentials: "include",
      })

      console.log("Resposta status:", response.status)

      if (!response.ok) {
        let errorMessage = "Falha ao excluir planejamento"

        try {
          const errorData = await response.json()
          if (errorData.message) {
            errorMessage = errorData.message
          }
        } catch (e) {
          // Se não for JSON, tentar ler como texto
          try {
            const errorText = await response.text()
            if (errorText) {
              errorMessage = errorText
            }
          } catch (e2) {
            // Ignorar erro ao ler texto
          }
        }

        throw new Error(errorMessage)
      }

      toast({
        title: "Sucesso!",
        description: "Planejamento excluído com sucesso.",
      })

      fetchPlans()
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: err instanceof Error ? err.message : "Falha ao excluir planejamento. Tente novamente.",
      })
      console.error(err)
    } finally {
      setIsSubmitting(false)
      setDeleteDialogOpen(false)
      setPlanToDelete(null)
    }
  }

  const handleEditPlan = (plan: EventPlan) => {
    setSelectedPlan(plan)
    setActiveTab("form")
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1) // Resetar para a primeira página ao buscar
    fetchPlans()
  }

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage)
    }
  }

  return (
    <>
    <Navbar />
    <div className="container mx-auto py-6 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Planejamento de Eventos</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-between items-center mb-6">
          <TabsList>
            <TabsTrigger value="list">Lista de Planejamentos</TabsTrigger>
            <TabsTrigger value="form" disabled={isSubmitting}>
              {selectedPlan ? "Editar Planejamento" : "Novo Planejamento"}
            </TabsTrigger>
          </TabsList>

          {activeTab === "list" && (
            <Button
              onClick={() => {
                setSelectedPlan(null)
                setActiveTab("form")
              }}
              className="bg-[#3DD4A7] hover:bg-[#2bc090]"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Novo Planejamento
            </Button>
          )}
        </div>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleSearch} className="flex gap-2 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar planejamentos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Buscar
                </Button>
              </form>

              <EventPlanList
                plans={plans}
                loading={loading}
                error={error}
                onEdit={handleEditPlan}
                onDelete={confirmDelete}
              />

              {/* Paginação */}
              {!loading && !error && plans.length > 0 && (
                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-gray-500">
                    Mostrando página {currentPage} de {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="form">
          <Card>
            <CardContent className="pt-6">
              <EventPlanForm
                initialData={selectedPlan}
                onSubmit={handleCreatePlan}
                onCancel={() => {
                  setSelectedPlan(null)
                  setActiveTab("list")
                }}
                isSubmitting={isSubmitting}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Diálogo de confirmação de exclusão */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este planejamento? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => planToDelete && handleDeletePlan(planToDelete)}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
    </>
  )
}

