// import { type NextRequest, NextResponse } from "next/server"
// import { getTokenFromRequest } from "@/lib/get-jwt"
// import { decodeJwt } from "@/lib/jwt"

// export async function PUT(request: NextRequest) {
//   try {
//     const token = getTokenFromRequest(request)
//     if (!token) {
//       return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
//     }

//     const decodedToken = decodeJwt(token)
//     const userId = decodedToken.sub
//     if (!userId) {
//       return NextResponse.json({ error: "ID do usuário não encontrado no token" }, { status: 400 })
//     }

//     const body = await request.json()
//     const { firstName, lastName, email } = body

//     if (!firstName || !lastName || !email) {
//       return NextResponse.json({ error: "Nome, sobrenome e email são obrigatórios" }, { status: 400 })
//     }

//     const adminTokenResponse = await fetch("http://localhost:8080/realms/lucassousa/protocol/openid-connect/token", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/x-www-form-urlencoded",
//       },
//       body: new URLSearchParams({
//         grant_type: "password",
//         client_id: "admin-cli",
//         username: "admin", 
//         password: "admin", 
//       }),
//     })

//     if (!adminTokenResponse.ok) {
//       console.error("Falha ao obter token de administrador:", await adminTokenResponse.text())
//       return NextResponse.json({ error: "Falha ao obter token de administrador" }, { status: 500 })
//     }

//     const adminTokenData = await adminTokenResponse.json()
//     const adminToken = adminTokenData.access_token

//     const updateUserResponse = await fetch(`http://localhost:8080/admin/realms/lucassousa/users/${userId}`, {
//       method: "PUT",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${adminToken}`,
//       },
//       body: JSON.stringify({
//         firstName,
//         lastName,
//         email,
//         emailVerified: true,
//       }),
//     })

//     if (!updateUserResponse.ok) {
//       let errorMessage = "Falha ao atualizar usuário"
//       try {
//         const errorData = await updateUserResponse.text()
//         console.error("Erro ao atualizar usuário:", errorData)
//         if (errorData.includes("email")) {
//           errorMessage = "Email já está em uso"
//         }
//       } catch (e) {
//         console.error("Erro ao processar resposta de erro:", e)
//       }

//       return NextResponse.json({ error: errorMessage }, { status: 400 })
//     }

//     return NextResponse.json({ success: true, message: "Perfil atualizado com sucesso" })
//   } catch (error) {
//     console.error("Erro ao atualizar perfil:", error)
//     return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
//   }
// }

