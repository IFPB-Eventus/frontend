"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"

export default function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const formData = new URLSearchParams()
      formData.append("grant_type", "password")
      formData.append("client_id", "eventus-rest-api")
      formData.append("username", email)
      formData.append("password", password)

      const response = await fetch("http://localhost:8080/realms/lucassousa/protocol/openid-connect/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Credenciais inválidas")
      }

      const data = await response.json()

      // Save token in cookie
      document.cookie = `token=${data.access_token}; path=/; max-age=${data.expires_in}`

      // Redirect to feed
      router.push("/feed")
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao fazer login",
        description: "Verifique suas credenciais e tente novamente.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <h1 className="text-3xl md:text-4xl font-bold mb-2">Login</h1>
      <p className="text-gray-400 mb-6 md:mb-8">Insira os detalhes da sua conta</p>

      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email">Username</Label>
          <Input
            id="username"
            type="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-transparent border-gray-700 focus:border-[#3DD4A7]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-transparent border-gray-700 focus:border-[#3DD4A7]"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </Button>
          </div>
        </div>

        <div className="text-right">
          <a href="#" className="text-sm text-gray-400 hover:text-[#3DD4A7]">
            Forgot Password?
          </a>
        </div>

        <Button
          type="submit"
          className="w-full bg-[#3DD4A7] hover:bg-[#2bc090] text-black font-medium"
          disabled={isLoading}
        >
          {isLoading ? "Entrando..." : "Login"}
        </Button>
      </form>

      <div className="mt-6 md:mt-8 text-center">
        <span className="text-gray-400">Não tem uma conta?</span>{" "}
        <a href="#" className="text-[#3DD4A7] hover:underline ml-1">
          Sign up
        </a>
      </div>
    </div>
  )
}

