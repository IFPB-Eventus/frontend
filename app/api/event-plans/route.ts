import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Obter o token do cabeçalho de autorização
    const authHeader = request.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Token não fornecido" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]

    // Obter parâmetros de consulta
    const searchParams = request.nextUrl.searchParams
    const page = searchParams.get("page") || "0"
    const size = searchParams.get("size") || "10"
    const search = searchParams.get("search") || ""

    // Construir URL da API
    let apiUrl = `http://localhost:9000/event-plans?page=${page}&size=${size}`
    if (search) {
      apiUrl += `&search=${encodeURIComponent(search)}`
    }

    // Fazer a requisição para a API
    const response = await fetch(apiUrl, {
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

export async function POST(request: NextRequest) {
  try {
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
    const response = await fetch("http://localhost:9000/event-plans", {
      method: "POST",
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

// Necessário para requisições preflight OPTIONS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Credentials": "true",
    },
  })
}

