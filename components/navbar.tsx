"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { MenuIcon, Bell, Home, PlusCircle, FileText, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet"
import { NavigationMenu, NavigationMenuList, NavigationMenuLink } from "@/components/ui/navigation-menu"
import { decodeJwt } from "@/lib/jwt"
import { getAuthToken } from "@/lib/get-jwt"

export default function Navbar() {
  const [userRole, setUserRole] = useState("client_user")
  const [username, setUsername] = useState("")
  const router = useRouter()

  useEffect(() => {
    const token = getAuthToken()
    if (!token) {
      router.push("/")
      return
    }

    try {
      const decodedToken = decodeJwt(token)
      const userRoles = decodedToken.resource_access?.["eventus-rest-api"]?.roles || []
      if (userRoles.includes("admin")) setUserRole("admin")
      else if (userRoles.includes("client_admin")) setUserRole("client_admin")
      else if (userRoles.includes("client_user")) setUserRole("client_user")
      setUsername(decodedToken.preferred_username || "")
    } catch (error) {
      console.error("Erro ao decodificar o token:", error)
    }
  }, [router])

  const handleLogout = () => {
    document.cookie = "token=; path=/; max-age=0"
    router.push("/")
  }

  return (
    <header className="flex h-20 w-full items-center px-4 md:px-6 bg-[#1a1a1a] text-white">
      {/* Mobile Menu */}
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" className="lg:hidden">
            <MenuIcon className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <div className="grid gap-2 py-6">
            <Link href="/feed" className="py-2 text-lg font-semibold">Dashboard</Link>
            <Link href="/profile" className="py-2 text-lg font-semibold">Perfil</Link>
            {(userRole === "admin" || userRole === "client_admin") && (
              <Link href="/events/create" className="py-2 text-lg font-semibold">Criar Evento</Link>
            )}
            {(userRole === "admin" || userRole === "client_admin") && (
                <Link href="/planning" className="py-2 text-lg font-semibold">Planejamento</Link>
            )}
            <Button onClick={handleLogout} variant="destructive" className="mt-4">Sair</Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Logo */}
      <Link href="/feed" className="mr-6 hidden lg:flex text-xl font-bold">Eventus</Link>

      {/* Desktop Navigation */}
      <div className="hidden lg:flex w-full justify-center">
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuLink asChild>
              <Link href="/feed" className="px-4 py-2">Dashboard</Link>
            </NavigationMenuLink>
            <NavigationMenuLink asChild>
              <Link href="/profile" className="px-4 py-2">Perfil</Link>
            </NavigationMenuLink>
            {(userRole === "admin" || userRole === "client_admin") && (
              <NavigationMenuLink asChild>
                <Link href="/events/create" className="px-4 py-2">Criar Evento</Link>
              </NavigationMenuLink>
            )}
            {(userRole === "admin" || userRole === "client_admin") && (
              <NavigationMenuLink asChild>
                <Link href="/planning" className="px-4 py-2">Planejamento</Link>
              </NavigationMenuLink>
            )}
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      {/* User Actions */}
      <div className="ml-auto flex items-center gap-4">
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>
        <Button onClick={handleLogout} variant="destructive">
          <LogOut className="h-5 w-5 mr-2" /> Sair
        </Button>
      </div>
    </header>
  )
}