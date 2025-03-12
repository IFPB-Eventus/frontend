"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Bell,
  Home,
  PlusCircle,
  FileText,
  Users,
  LogOut,
  MenuIcon,
  X,
  Calendar,
  ChevronLeft,
  Search,
  Ticket,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import EventCard from "@/components/event-card"
import type { Event } from "@/types/event"
import { cn } from "@/lib/utils"
import { decodeJwt } from "@/lib/jwt"
import { getAuthToken } from "@/lib/get-jwt"
import Navbar from "@/components/navbar"

// Tipos de usuário
type UserRole = "admin" | "client_admin" | "client_user"

export default function FeedPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeItem, setActiveItem] = useState("dashboard")
  const [userRole, setUserRole] = useState<UserRole>("client_user")
  const [username, setUsername] = useState<string>("")
  const router = useRouter()

  const fetchEvents = async () => {
    const token = getAuthToken()

    if (!token) {
      router.push("/")
      return
    }

    try {
      const response = await fetch("/api/events", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Falha ao carregar eventos")
      }

      const data = await response.json()
      setEvents(data)
    } catch (err) {
      setError("Erro ao carregar eventos. Tente novamente mais tarde.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const token = getAuthToken()

    if (!token) {
      router.push("/")
      return
    }

    try {
      // Decodificar o token JWT
      const decodedToken = decodeJwt(token)

      // Extrair o papel do usuário do token
      const userRoles = decodedToken.resource_access?.["eventus-rest-api"]?.roles || []

      // Verificar se o usuário é admin ou client_user
      if (userRoles.includes("admin")) {
        setUserRole("admin")
      } else if (userRoles.includes("client_admin")) {
        setUserRole("client_admin")
      } else if (userRoles.includes("client_user")) {
        setUserRole("client_user")
      }

      // Extrair o nome de usuário
      setUsername(decodedToken.preferred_username || "")
    } catch (error) {
      console.error("Erro ao decodificar o token:", error)
    }

    fetchEvents()
  }, [router])

  const handleLogout = async () => {
    document.cookie = "token=; path=/; max-age=0"
    router.push("/")
  }

  const handleCreateEvent = () => {
    router.push("/events/create")
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="flex">
        {/* Main Content */}
        <div
          className={cn(
            "flex-1 flex flex-col min-h-screen transition-all duration-300",
            sidebarCollapsed ? "md:ml-20" : "md:ml-0",
          )}
        >
  
          {/* Main Content Area */}
          <main className="flex-1 p-4 md:p-6 overflow-auto bg-gray-50">
            <div className="flex justify-between items-center mb-4 md:mb-6">
              <h1 className="text-2xl md:text-3xl font-bold">Eventos disponíveis</h1>
              {(userRole === "admin" || userRole === "client_admin") && (
                <Button className="bg-[#3DD4A7] hover:bg-[#2bc090] text-white" onClick={handleCreateEvent}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Novo Evento
                </Button>
              )}
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3DD4A7]"></div>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>
            ) : events.length === 0 ? (
              <div className="bg-gray-50 border border-gray-200 text-gray-700 px-4 py-8 rounded text-center">
                Nenhum evento disponível no momento.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {events.map((event) => (
                  <div key={event.id} onClick={() => router.push(`/events/${event.id}`)} className="cursor-pointer">
                    <EventCard event={event} userRole={userRole} onDelete={fetchEvents} />
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>

        {/* Mobile User Profile */}
        <div className="md:hidden fixed bottom-0 right-0 m-4 z-50">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="bg-[#3DD4A7] h-12 w-12 rounded-full flex items-center justify-center shadow-lg"
          >
            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden border-2 border-white">
              <img src="/placeholder.svg?height=40&width=40" alt="User" className="h-full w-full object-cover" />
            </div>
          </button>
          {showDropdown && (
            <div className="absolute right-0 bottom-14 w-48 bg-white rounded-md shadow-lg">
              <div className="py-1">
                <div className="px-4 py-2 border-b">
                  <p className="text-sm font-medium">{username || "Usuário"}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Tipo:{" "}
                    {userRole === "admin" ? "Administrador" : userRole === "client_admin" ? "Admin Cliente" : "Usuário"}
                  </p>
                </div>
                <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  Perfil
                </a>
                <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  Configurações
                </a>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  Sair
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

