import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Obter a origem da requisição
  const origin = request.headers.get("origin") || ""
  console.log("Middleware: Requisição recebida de origem:", origin)
  console.log("Middleware: Método:", request.method)
  console.log("Middleware: Caminho:", request.nextUrl.pathname)

  // Verificar se a requisição é para a API
  if (request.nextUrl.pathname.startsWith("/api/")) {
    // Criar uma resposta com os cabeçalhos CORS
    const response = NextResponse.next()

    // Configurar cabeçalhos CORS - permitir qualquer origem para desenvolvimento
    response.headers.set("Access-Control-Allow-Origin", "*")
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-HTTP-Method-Override")
    response.headers.set("Access-Control-Max-Age", "86400") // 24 horas em segundos

    // Importante: para requisições DELETE, precisamos garantir que o método seja preservado
    if (request.method === "DELETE") {
      console.log("Middleware: Processando requisição DELETE")
    }

    // Para requisições preflight OPTIONS
    if (request.method === "OPTIONS") {
      console.log("Middleware: Respondendo a requisição OPTIONS")
      return new NextResponse(null, {
        status: 204,
        headers: response.headers,
      })
    }

    return response
  }

  return NextResponse.next()
}

// Configurar o middleware para ser executado apenas nas rotas de API
export const config = {
  matcher: "/api/:path*",
}

