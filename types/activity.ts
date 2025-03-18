export interface ActivityRegistration {
    id: number
    userId: string
    userName?: string
    email?: string
    present?: boolean
  }
  
  export interface Activity {
    id: number
    name: string
    location?: string
    description?: string
    activityDate?: string
    activityTime?: string
    type?: string
    category?: string
    photo?: string | null
    eventId?: number
    registrations?: ActivityRegistration[]
  }
  
  export interface CreateActivityData {
    name: string
    location?: string
    activityDate: string
    activityTime: string
    type?: string
    category?: string
    photo?: string | null
    eventId: number
  }
  
  