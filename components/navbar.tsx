"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import {
  MenuIcon,
  Bell,
  Home,
  PlusCircle,
  FileText,
  LogOut,
  User,
  Calendar,
  ChevronDown,
  X,
  Ticket,
  Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetTrigger, SheetContent, SheetClose } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { decodeJwt } from "@/lib/jwt"
import { getAuthToken } from "@/lib/get-jwt"

export default function Navbar() {
  const [userRole, setUserRole] = useState("client_user")
  const [username, setUsername] = useState("")
  const [notificationCount, setNotificationCount] = useState(3)
  const [isScrolled, setIsScrolled] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

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

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleLogout = () => {
    document.cookie = "token=; path=/; max-age=0"
    router.push("/")
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  const navItems = [
    {
      href: "/feed",
      label: "Dashboard",
      icon: <Home className="h-4 w-4 mr-2" />,
      roles: ["admin", "client_admin", "client_user"],
    },
    {
      href: "/events/create",
      label: "Criar Evento",
      icon: <PlusCircle className="h-4 w-4 mr-2" />,
      roles: ["admin", "client_admin"],
    },
    {
      href: "/planning",
      label: "Planejamento",
      icon: <FileText className="h-4 w-4 mr-2" />,
      roles: ["admin", "client_admin"],
    },
    {
      href: "/calendar",
      label: "Calendário",
      icon: <Calendar className="h-4 w-4 mr-2" />,
      roles: ["admin", "client_admin", "client_user"],
    },
    {
      href: "/tickets",
      label: "Meus Ingressos",
      icon: <Ticket className="h-4 w-4 mr-2" />,
      roles: ["client_user"],
    },
  ]

  const filteredNavItems = navItems.filter((item) => item.roles.includes(userRole))

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled ? "bg-[#1a1a1a]/95 backdrop-blur-sm shadow-md py-2" : "bg-[#1a1a1a] py-4",
      )}
    >
      <div className="container mx-auto flex items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/feed" className="text-xl font-bold text-white flex items-center">
            <span className="text-[#3DD4A7] mr-1">E</span>ventus
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          {filteredNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center",
                pathname === item.href
                  ? "bg-[#3DD4A7]/10 text-[#3DD4A7]"
                  : "text-gray-300 hover:bg-white/10 hover:text-white",
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User Actions */}
        <div className="flex items-center space-x-2">
        
          {/* User Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2 text-gray-300 hover:text-white hover:bg-white/10"
              >
                <Avatar className="h-8 w-8 border-2 border-[#3DD4A7]/50">
                  <AvatarImage src="/avatar.jpg" />
                  <AvatarFallback className="bg-[#3DD4A7]/20 text-[#3DD4A7]">
                    {getInitials(username || "User")}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium line-clamp-1">{username || "Usuário"}</p>
                  <p className="text-xs opacity-60">
                    {userRole === "admin" ? "Administrador" : userRole === "client_admin" ? "Admin Cliente" : "Usuário"}
                  </p>
                </div>
                <ChevronDown className="h-4 w-4 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/profile")}>
                <User className="h-4 w-4 mr-2" />
                Perfil
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500">
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="md:hidden text-gray-300 hover:text-white hover:bg-white/10"
              >
                <MenuIcon className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-[#1a1a1a] text-white border-r border-white/10">
              <div className="flex items-center justify-between mb-8">
                <Link href="/feed" className="text-xl font-bold">
                  <span className="text-[#3DD4A7]">E</span>ventus
                </Link>
                {/* <SheetClose className="rounded-full p-1 hover:bg-white/10">
                  <X className="h-5 w-5" />
                </SheetClose> */}
              </div>

              <div className="flex flex-col space-y-1">
                {filteredNavItems.map((item) => (
                  <SheetClose asChild key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "px-3 py-3 rounded-md text-base font-medium transition-colors flex items-center",
                        pathname === item.href
                          ? "bg-[#3DD4A7]/10 text-[#3DD4A7]"
                          : "text-gray-300 hover:bg-white/10 hover:text-white",
                      )}
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  </SheetClose>
                ))}
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
                <div className="flex items-center space-x-3 mb-4">
                  <Avatar className="h-10 w-10 border-2 border-[#3DD4A7]/50">
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback className="bg-[#3DD4A7]/20 text-[#3DD4A7]">
                      {getInitials(username || "User")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{username || "Usuário"}</p>
                    <p className="text-sm opacity-60">
                      {userRole === "admin"
                        ? "Administrador"
                        : userRole === "client_admin"
                          ? "Admin Cliente"
                          : "Usuário"}
                    </p>
                  </div>
                </div>
                <Button onClick={handleLogout} variant="destructive" className="w-full">
                  <LogOut className="h-4 w-4 mr-2" /> Sair
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}