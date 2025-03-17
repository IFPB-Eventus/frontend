import { type NextRequest, NextResponse } from "next/server"
import { getTokenFromRequest } from "@/lib/get-jwt"
import { decodeJwt } from "@/lib/jwt"

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request)

    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const decodedToken = decodeJwt(token)
    const userId = decodedToken.sub

    if (!userId) {
      return NextResponse.json({ error: "ID do usuário não encontrado no token" }, { status: 400 })
    }

    const response = await fetch(`http://localhost:9000/activity-registrations/my-activities`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      return NextResponse.json({ error: "Falha ao buscar atividades do usuário" }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Erro ao buscar atividades do usuário:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

