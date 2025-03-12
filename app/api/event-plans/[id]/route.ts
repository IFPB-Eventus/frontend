import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    // Obter o token do cabeçalho de autorização
    const authHeader = request.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Token não fornecido" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]

    // Fazer a requisição para a API
    const response = await fetch(`http://localhost:9000/event-plans/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Erro na API:", errorText)
      return NextResponse.json(
        { message: `Erro da API: ${response.status} ${response.statusText}` },
        { status: response.status },
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Erro ao processar requisição:", error)
    return NextResponse.json({ message: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    // Obter o token do cabeçalho de autorização
    const authHeader = request.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Token não fornecido" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]

    // Obter dados do corpo da requisição
    const planData = await request.json()

    // Validar dados
    if (!planData.name || !planData.eventDate) {
      return NextResponse.json(
        { message: "Dados incompletos. Nome e data do evento são obrigatórios." },
        { status: 400 },
      )
    }

    // Fazer a requisição para a API
    const response = await fetch(`http://localhost:9000/event-plans/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(planData),
    })

    // Capturar o texto completo da resposta para diagnóstico
    const responseText = await response.text()

    if (!response.ok) {
      console.error("Erro na API:", responseText)
      return NextResponse.json(
        { message: `Erro da API: ${response.status} ${response.statusText}`, details: responseText },
        { status: response.status },
      )
    }

    // Tentar analisar a resposta como JSON, se possível
    let responseData
    try {
      responseData = JSON.parse(responseText)
    } catch (e) {
      // Se não for JSON, usar o texto como está
      responseData = { message: "Sucesso", rawResponse: responseText }
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error("Erro ao processar requisição:", error)
    return NextResponse.json({ message: "Erro interno do servidor", error: String(error) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    console.log("DELETE API: Iniciando exclusão do plano ID:", id)

    // Obter o token do cabeçalho de autorização
    const authHeader = request.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("DELETE API: Token não fornecido ou formato inválido")
      return NextResponse.json({ message: "Token não fornecido" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    console.log("DELETE API: Token obtido, enviando requisição para backend")

    // Fazer a requisição para a API REST com configuração explícita
    const backendUrl = `http://localhost:9000/event-plans/${id}`
    console.log("DELETE API: URL do backend:", backendUrl)

    const response = await fetch(backendUrl, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "*/*",
        "X-HTTP-Method-Override": "DELETE", // Adicionar este cabeçalho para garantir que o método seja DELETE
      },
    })

    console.log("DELETE API: Resposta do backend:", response.status, response.statusText)

    if (!response.ok) {
      let errorText = ""
      try {
        errorText = await response.text()
        console.error("DELETE API: Corpo da resposta de erro:", errorText)
      } catch (e) {
        errorText = "Não foi possível ler o corpo da resposta"
        console.error("DELETE API: Erro ao ler corpo da resposta:", e)
      }

      return NextResponse.json(
        {
          message: `Erro da API: ${response.status} ${response.statusText}`,
          details: errorText,
        },
        { status: response.status },
      )
    }

    console.log("DELETE API: Exclusão bem-sucedida")
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-HTTP-Method-Override",
      },
    })
  } catch (error) {
    console.error("DELETE API: Erro ao processar requisição:", error)
    return NextResponse.json(
      {
        message: "Erro interno do servidor",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

// Necessário para requisições preflight OPTIONS
export async function OPTIONS() {
  console.log("OPTIONS API: Respondendo a requisição preflight para rota específica")
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-HTTP-Method-Override, Accept",
      "Access-Control-Max-Age": "86400", // 24 horas em segundos
    },
  })
}

