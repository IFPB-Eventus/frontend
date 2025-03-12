/**
 * Cliente API para fazer requisições ao backend
 */

// Função para obter o token de autenticação dos cookies
function getAuthToken(): string | null {
    if (typeof document === "undefined") return null
  
    return (
      document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1] || null
    )
  }
  
  // Função genérica para fazer requisições à API
  async function fetchApi<T>(url: string, method: "GET" | "POST" | "PUT" | "DELETE" = "GET", body?: any): Promise<T> {
    const token = getAuthToken()
  
    if (!token) {
      throw new Error("Não autenticado")
    }
  
    const headers: HeadersInit = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "*/*",
    }
  
    // Para DELETE, adicionar o cabeçalho X-HTTP-Method-Override
    if (method === "DELETE") {
      headers["X-HTTP-Method-Override"] = "DELETE"
    }
  
    const options: RequestInit = {
      method,
      headers,
      credentials: "include",
    }
  
    if (body && (method === "POST" || method === "PUT")) {
      options.body = JSON.stringify(body)
    }
  
    console.log(`API Client: ${method} ${url}`)
    console.log(`API Client: Token (primeiros 10 caracteres): ${token.substring(0, 10)}...`)
    console.log(`API Client: Headers:`, headers)
  
    const response = await fetch(url, options)
  
    console.log(`API Client: Resposta ${response.status}`)
  
    // Para DELETE com resposta 204 No Content
    if (method === "DELETE" && response.status === 204) {
      return {} as T
    }
  
    // Para outras respostas, tentar ler como JSON
    if (!response.ok) {
      let errorMessage = `Erro ${response.status}: ${response.statusText}`
  
      try {
        const errorData = await response.json()
        console.error("API Client: Erro detalhado:", errorData)
        if (errorData.message) {
          errorMessage = errorData.message
        }
      } catch (e) {
        // Se não for JSON, tentar ler como texto
        try {
          const errorText = await response.text()
          console.error("API Client: Erro texto:", errorText)
          if (errorText) {
            errorMessage = errorText
          }
        } catch (e2) {
          // Ignorar erro ao ler texto
        }
      }
  
      throw new Error(errorMessage)
    }
  
    // Se for uma resposta vazia mas bem-sucedida
    if (response.status === 204 || response.headers.get("Content-Length") === "0") {
      return {} as T
    }
  
    return await response.json()
  }
  
  // Funções específicas para cada operação
  export const apiClient = {
    // Funções para planejamentos de eventos
    eventPlans: {
      getAll: async (page = 0, size = 10, search = "") => {
        const queryParams = new URLSearchParams({
          page: page.toString(),
          size: size.toString(),
        })
  
        if (search) {
          queryParams.append("search", search)
        }
  
        return fetchApi(`/api/event-plans?${queryParams.toString()}`)
      },
  
      getById: async (id: number) => {
        return fetchApi(`/api/event-plans/${id}`)
      },
  
      create: async (data: any) => {
        return fetchApi("/api/event-plans", "POST", data)
      },
  
      update: async (id: number, data: any) => {
        return fetchApi(`/api/event-plans/${id}`, "PUT", data)
      },
  
      delete: async (id: number) => {
        console.log(`API Client: Excluindo planejamento ${id}`)
        return fetchApi(`/api/event-plans/${id}`, "DELETE")
      },
  
      // Método alternativo que faz a requisição diretamente para o backend
      directDelete: async (id: number) => {
        const token = getAuthToken()
        if (!token) {
          throw new Error("Não autenticado")
        }
  
        console.log(`API Client: Excluindo planejamento ${id} via rota alternativa`)
  
        // Usar a rota alternativa que tenta diferentes métodos
        const response = await fetch(`/api/direct-delete`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id, token }),
        })
  
        console.log(`API Client: Resposta da rota alternativa ${response.status}`)
  
        if (!response.ok) {
          let errorMessage = `Erro ${response.status}: ${response.statusText}`
          try {
            const errorData = await response.json()
            console.error("API Client: Erro detalhado:", errorData)
            if (errorData.message) {
              errorMessage = errorData.message
            }
          } catch (e) {
            // Se não for JSON, tentar ler como texto
            try {
              const errorText = await response.text()
              if (errorText) errorMessage = errorText
            } catch (e2) {
              // Ignorar erro ao ler texto
            }
          }
          throw new Error(errorMessage)
        }
  
        const result = await response.json()
        console.log("API Client: Resultado da exclusão alternativa:", result)
  
        return {} as any
      },
  
      // Método que tenta usar o método POST com _method=DELETE
      methodOverrideDelete: async (id: number) => {
        const token = getAuthToken()
        if (!token) {
          throw new Error("Não autenticado")
        }
  
        console.log(`API Client: Excluindo planejamento ${id} com method override`)
  
        // Usar POST com _method=DELETE
        const response = await fetch(`http://localhost:9000/event-plans/${id}?_method=DELETE`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "X-HTTP-Method-Override": "DELETE",
          },
        })
  
        console.log(`API Client: Resposta do method override ${response.status}`)
  
        if (!response.ok) {
          let errorMessage = `Erro ${response.status}: ${response.statusText}`
          try {
            const errorText = await response.text()
            if (errorText) errorMessage = errorText
          } catch (e) {
            // Ignorar erro ao ler texto
          }
          throw new Error(errorMessage)
        }
  
        return {} as any
      },
    },
  }
  
  