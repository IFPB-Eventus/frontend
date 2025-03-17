// "use client"

// import { useState, useEffect } from "react"
// import { zodResolver } from "@hookform/resolvers/zod"
// import { useForm } from "react-hook-form"
// import * as z from "zod"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Loader2 } from "lucide-react"
// import { useToast } from "@/components/ui/use-toast"
// import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog"

// // Schema de validação
// const profileSchema = z.object({
//   firstName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
//   lastName: z.string().min(2, "Sobrenome deve ter pelo menos 2 caracteres"),
//   email: z.string().email("Email inválido"),
// })

// type ProfileFormValues = z.infer<typeof profileSchema>

// interface ProfileEditFormProps {
//   open: boolean
//   onOpenChange: (open: boolean) => void
//   onProfileUpdated: () => void
// }

// export default function ProfileEditForm({ open, onOpenChange, onProfileUpdated }: ProfileEditFormProps) {
//   const [isLoading, setIsLoading] = useState(false)
//   const [isLoadingData, setIsLoadingData] = useState(true)
//   const { toast } = useToast()

//   // Configurar o formulário com react-hook-form
//   const form = useForm<ProfileFormValues>({
//     resolver: zodResolver(profileSchema),
//     defaultValues: {
//       firstName: "",
//       lastName: "",
//       email: "",
//     },
//   })

//   // Carregar dados do usuário
//   useEffect(() => {
//     if (open) {
//       fetchUserData()
//     }
//   }, [open])

//   const fetchUserData = async () => {
//     setIsLoadingData(true)
//     try {
//       const response = await fetch("/api/auth/user-info")

//       if (!response.ok) {
//         throw new Error("Falha ao carregar dados do usuário")
//       }

//       const userData = await response.json()

//       form.reset({
//         firstName: userData.firstName || "",
//         lastName: userData.lastName || "",
//         email: userData.email || "",
//       })
//     } catch (error) {
//       console.error("Erro ao carregar dados do usuário:", error)
//       toast({
//         variant: "destructive",
//         title: "Erro",
//         description: "Não foi possível carregar seus dados. Tente novamente mais tarde.",
//       })
//       onOpenChange(false)
//     } finally {
//       setIsLoadingData(false)
//     }
//   }

//   const onSubmit = async (data: ProfileFormValues) => {
//     setIsLoading(true)

//     try {
//       const response = await fetch("/api/auth/update-profile", {
//         method: "PUT",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(data),
//       })

//       const result = await response.json()

//       if (!response.ok) {
//         throw new Error(result.error || "Erro ao atualizar perfil")
//       }

//       toast({
//         title: "Perfil atualizado",
//         description: "Suas informações foram atualizadas com sucesso.",
//       })

//       onOpenChange(false)
//       onProfileUpdated()
//     } catch (error) {
//       console.error("Erro ao atualizar perfil:", error)
//       toast({
//         variant: "destructive",
//         title: "Erro ao atualizar perfil",
//         description: error instanceof Error ? error.message : "Verifique suas informações e tente novamente.",
//       })
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="sm:max-w-[425px]">
//         <DialogHeader>
//           <DialogTitle>Editar perfil</DialogTitle>
//           <DialogDescription>Atualize suas informações pessoais. Clique em salvar quando terminar.</DialogDescription>
//         </DialogHeader>

//         {isLoadingData ? (
//           <div className="flex justify-center py-8">
//             <Loader2 className="h-8 w-8 animate-spin text-[#3DD4A7]" />
//           </div>
//         ) : (
//           <Form {...form}>
//             <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
//               <FormField
//                 control={form.control}
//                 name="firstName"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Nome</FormLabel>
//                     <FormControl>
//                       <Input placeholder="Seu nome" {...field} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               <FormField
//                 control={form.control}
//                 name="lastName"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Sobrenome</FormLabel>
//                     <FormControl>
//                       <Input placeholder="Seu sobrenome" {...field} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               <FormField
//                 control={form.control}
//                 name="email"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Email</FormLabel>
//                     <FormControl>
//                       <Input type="email" placeholder="seu.email@exemplo.com" {...field} />
//                     </FormControl>
//                     <FormDescription>Este email será usado para comunicações e recuperação de senha.</FormDescription>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               <DialogFooter>
//                 <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
//                   Cancelar
//                 </Button>
//                 <Button type="submit" className="bg-[#3DD4A7] hover:bg-[#2bc090]" disabled={isLoading}>
//                   {isLoading ? (
//                     <>
//                       <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                       Salvando...
//                     </>
//                   ) : (
//                     "Salvar alterações"
//                   )}
//                 </Button>
//               </DialogFooter>
//             </form>
//           </Form>
//         )}
//       </DialogContent>
//     </Dialog>
//   )
// }

