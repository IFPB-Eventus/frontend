"use client"
import { Button } from "@/components/ui/button"
import type { EventPlan } from "@/types/event-plan"
import { Pencil, Trash2, FileDown } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { generatePDF } from "@/lib/pdf-generator"
import Link from "next/link"

interface EventPlanListProps {
  plans: EventPlan[]
  loading: boolean
  error: string | null
  onEdit: (plan: EventPlan) => void
  onDelete: (id: number) => void
}

export function EventPlanList({ plans, loading, error, onEdit, onDelete }: EventPlanListProps) {
  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === "string" ? new Date(dateString) : dateString
    return format(date, "dd/MM/yyyy", { locale: ptBR })
  }

  const handleExportPDF = (plan: EventPlan) => {
    generatePDF(plan)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3DD4A7]"></div>
      </div>
    )
  }

  if (error) {
    return <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>
  }

  if (plans.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 text-gray-700 px-4 py-8 rounded text-center">
        Nenhum planejamento encontrado.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50 text-left">
            <th className="px-4 py-3 text-sm font-medium text-gray-500 border-b">Nome</th>
            <th className="px-4 py-3 text-sm font-medium text-gray-500 border-b">Data</th>
            <th className="px-4 py-3 text-sm font-medium text-gray-500 border-b">Microfones</th>
            <th className="px-4 py-3 text-sm font-medium text-gray-500 border-b">Projetores</th>
            <th className="px-4 py-3 text-sm font-medium text-gray-500 border-b">Ações</th>
          </tr>
        </thead>
        <tbody>
          {plans.map((plan) => (
            <tr key={plan.id} className="border-b hover:bg-gray-50">
              <td className="px-4 py-3">{plan.name}</td>
              <td className="px-4 py-3">{formatDate(plan.eventDate)}</td>
              <td className="px-4 py-3">{plan.microphones}</td>
              <td className="px-4 py-3">{plan.projectors}</td>
              <td className="px-4 py-3">
                <div className="flex space-x-2">
                  <Button variant="ghost" size="icon" onClick={() => onEdit(plan)} title="Editar">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(plan.id)}
                    title="Excluir"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleExportPDF(plan)}
                    title="Exportar para PDF"
                    className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <FileDown className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Button type="submit" className="bg-[#3DD4A7] hover:bg-[#2bc090] float-end mt-5">
          <Link href={"/feed"}>Voltar</Link>
      </Button>
    </div>
  )
}

