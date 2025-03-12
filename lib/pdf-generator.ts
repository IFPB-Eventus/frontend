import type { EventPlan } from "@/types/event-plan"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { jsPDF } from "jspdf"
import "jspdf-autotable"

declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

export function generatePDF(plan: EventPlan) {
  // Criar uma nova instância do jsPDF
  const doc = new jsPDF()

  // Adicionar título
  doc.setFontSize(20)
  doc.setTextColor(61, 212, 167) // Cor do Eventus
  doc.text("Planejamento de Evento", 105, 20, { align: "center" })

  // Adicionar logo ou texto do Eventus
  doc.setFontSize(24)
  doc.setTextColor(61, 212, 167)
  doc.text("EVENTUS", 105, 15, { align: "center" })

  // Adicionar informações do planejamento
  doc.setFontSize(12)
  doc.setTextColor(0, 0, 0)

  // Formatação da data
  const eventDate = typeof plan.eventDate === "string" ? new Date(plan.eventDate) : plan.eventDate
  const formattedDate = format(eventDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })

  // Informações básicas
  doc.text(`Nome do Planejamento: ${plan.name}`, 20, 35)
  doc.text(`Data do Evento: ${formattedDate}`, 20, 45)
  doc.text(`Quantidade de Microfones: ${plan.microphones}`, 20, 55)
  doc.text(`Quantidade de Projetores: ${plan.projectors}`, 20, 65)

  // Linha separadora
  doc.setDrawColor(61, 212, 167)
  doc.line(20, 75, 190, 75)

  // Salas
  doc.setFontSize(14)
  doc.text("Salas", 20, 85)
  doc.setFontSize(12)

  const rooms = plan.rooms.split("\n")
  let yPosition = 95

  rooms.forEach((room, index) => {
    if (room.trim()) {
      doc.text(`${index + 1}. ${room.trim()}`, 25, yPosition)
      yPosition += 7
    }
  })

  // Membros da equipe
  yPosition += 10
  doc.setFontSize(14)
  doc.text("Membros da Equipe", 20, yPosition)
  doc.setFontSize(12)

  yPosition += 10
  const members = plan.members.split("\n")

  members.forEach((member, index) => {
    if (member.trim()) {
      doc.text(`${index + 1}. ${member.trim()}`, 25, yPosition)
      yPosition += 7

      // Se estiver chegando ao final da página, criar uma nova
      if (yPosition > 270) {
        doc.addPage()
        yPosition = 20
      }
    }
  })

  // Rodapé
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(10)
    doc.setTextColor(150, 150, 150)
    doc.text(`Gerado por Eventus em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 105, 285, {
      align: "center",
    })
    doc.text(`Página ${i} de ${pageCount}`, 105, 290, { align: "center" })
  }

  // Salvar o PDF
  doc.save(`planejamento-${plan.name.replace(/\s+/g, "-").toLowerCase()}.pdf`)
}

