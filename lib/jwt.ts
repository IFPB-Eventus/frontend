/**
 * Decodifica um token JWT
 * @param token Token JWT a ser decodificado
 * @returns Objeto com os dados do token
 */
export function decodeJwt(token: string) {
    try {
      // O token JWT tem três partes separadas por pontos: header.payload.signature
      // Precisamos da segunda parte (payload)
      const base64Url = token.split(".")[1]
  
      // Substituir caracteres especiais para decodificação base64 padrão
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
  
      // Decodificar o payload
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join(""),
      )
  
      // Converter o JSON para objeto
      return JSON.parse(jsonPayload)
    } catch (error) {
      console.error("Erro ao decodificar o token JWT:", error)
      return {}
    }
  }
  
  