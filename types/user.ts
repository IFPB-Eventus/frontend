export interface UserProfile {
    id: string
    name: string
    email: string
    avatar?: string
    role?: string
  }
  
  export interface Registration {
    id: number
    eventTitle: string
    date: string
    status: "present" | "absent" | "pending"
  }
  
  export interface Certificate {
    id: number
    eventTitle: string
    date: string
    downloadUrl: string
  }
  
  