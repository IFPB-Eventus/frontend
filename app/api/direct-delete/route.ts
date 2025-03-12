import { type NextRequest, NextResponse } from "next/server"

// Esta rota é uma alternativa que faz a requisição DELETE diretamente para o backend
// sem passar pela API do Next.js, útil para testar se o problema está no middleware
export async function POST(request: NextRequest) {
  try {
    // Obter dados do corpo da requisição
    const { id, token } = await request.json()

    if (!id || !token) {
      return NextResponse.json({ message: "ID e token são obrigatórios" }, { status: 400 })
    }

    console.log("Direct DELETE: Iniciando exclusão do plano ID:", id)

    // Fazer a requisição diretamente para o backend
    const response = await fetch(`http://localhost:9000/event-plans/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Origin: "http://localhost:3000",
      },
      credentials: "include",
    })

    console.log("Direct DELETE: Resposta do backend:", response.status)

    if (!response.ok) {
      let errorText = ""
      try {
        errorText = await response.text()
      } catch (e) {
        errorText = "Não foi possível ler o corpo da resposta"
      }

      console.error("Direct DELETE: Erro na API:", response.status, errorText)

      return NextResponse.json(
        {
          message: `Erro da API: ${response.status} ${response.statusText}`,
          details: errorText,
        },
        { status: response.status },
      )
    }

    console.log("Direct DELETE: Exclusão bem-sucedida")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Direct DELETE: Erro ao processar requisição:", error)
    return NextResponse.json(
      {
        message: "Erro interno do servidor",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

