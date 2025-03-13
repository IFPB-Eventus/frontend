import { redirect } from "next/navigation"
import RegisterForm from "@/components/register-form"
import { cookies } from "next/headers"

export default function RegisterPage() {
  const cookieStore = cookies()
  const token = cookieStore.get("token")

  if (token) {
    redirect("/feed")
  }

  return (
    <main className="flex flex-col md:flex-row min-h-screen">
      <div className="w-full md:w-1/2 bg-[#1a1a1a] text-white p-6 md:p-8 lg:p-16 flex flex-col justify-center min-h-screen md:min-h-0">
        <RegisterForm />
      </div>
      <div className="hidden md:flex md:w-1/2 bg-[#3DD4A7] text-white p-8 lg:p-16 flex-col justify-center relative">
        <div className="max-w-md">
          <h1 className="text-4xl lg:text-5xl font-bold mb-4">Crie sua conta no Eventus.</h1>
          <p className="text-lg lg:text-xl">Organize, Busque e Participe de Eventos com a plataforma Eventus.</p>
        </div>
        <img
          src="./ilustration.png"
          alt="Eventus illustration"
          className="w-full max-w-lg"
        />
      </div>
    </main>
  )
}

