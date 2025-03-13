import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { firstName, lastName, email, username, password, role } = body

    if (!firstName || !lastName || !email || !username || !password || !role) {
      return NextResponse.json({ error: "Todos os campos são obrigatórios" }, { status: 400 })
    }

    const adminTokenResponse = await fetch("http://localhost:8080/realms/master/protocol/openid-connect/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "password",
        client_id: "admin-cli",
        username: "admin", 
        password: "admin",
      }),
    })

    if (!adminTokenResponse.ok) {
      console.error("Falha ao obter token de administrador:", await adminTokenResponse.text())
      return NextResponse.json({ error: "Falha ao obter token de administrador" }, { status: 500 })
    }

    const adminTokenData = await adminTokenResponse.json()
    const adminToken = adminTokenData.access_token

    const keycloakData = {
      firstName,
      lastName,
      email,
      username,
      enabled: true,
      emailVerified: false,
      attributes: {},
      groups: [],
      requiredActions: [],
      credentials: [
        {
          type: "password",
          value: password,
          temporary: false,
        },
      ],
    }

    const createUserResponse = await fetch("http://localhost:8080/admin/realms/lucassousa/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(keycloakData),
    })

    if (!createUserResponse.ok) {
      let errorMessage = "Falha ao criar usuário"
      try {
        const errorData = await createUserResponse.text()
        console.error("Erro ao criar usuário:", errorData)
        if (errorData.includes("username")) {
          errorMessage = "Nome de usuário já existe"
        } else if (errorData.includes("email")) {
          errorMessage = "Email já está em uso"
        }
      } catch (e) {
        console.error("Erro ao processar resposta de erro:", e)
      }

      return NextResponse.json({ error: errorMessage }, { status: 400 })
    }

    const usersResponse = await fetch(`http://localhost:8080/admin/realms/lucassousa/users?username=${username}`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    })

    if (!usersResponse.ok) {
      return NextResponse.json({ error: "Falha ao obter informações do usuário" }, { status: 500 })
    }

    const users = await usersResponse.json()
    if (users.length === 0) {
      return NextResponse.json({ error: "Usuário não encontrado após criação" }, { status: 500 })
    }

    const userId = users[0].id

    const clientsResponse = await fetch("http://localhost:8080/admin/realms/lucassousa/clients", {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    })

    if (!clientsResponse.ok) {
      return NextResponse.json({ error: "Falha ao obter clientes" }, { status: 500 })
    }

    const clients = await clientsResponse.json()
    const eventusClient = clients.find((client: any) => client.clientId === "eventus-rest-api")

    if (!eventusClient) {
      return NextResponse.json({ error: "Cliente eventus-rest-api não encontrado" }, { status: 500 })
    }

    const rolesResponse = await fetch(
      `http://localhost:8080/admin/realms/lucassousa/clients/${eventusClient.id}/roles`,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      },
    )

    if (!rolesResponse.ok) {
      return NextResponse.json({ error: "Falha ao obter roles" }, { status: 500 })
    }

    const roles = await rolesResponse.json()
    const selectedRole = roles.find((r: any) => r.name === role)

    if (!selectedRole) {
      return NextResponse.json({ error: `Role ${role} não encontrada` }, { status: 500 })
    }

    const assignRoleResponse = await fetch(
      `http://localhost:8080/admin/realms/lucassousa/users/${userId}/role-mappings/clients/${eventusClient.id}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify([selectedRole]),
      },
    )

    if (!assignRoleResponse.ok) {
      return NextResponse.json({ error: "Falha ao atribuir role ao usuário" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Usuário criado com sucesso" })
  } catch (error) {
    console.error("Erro no registro:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

