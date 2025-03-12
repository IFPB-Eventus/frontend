export interface Registration {
  id: number
  userId: string
  userName: string
}

export interface Activity {
  id: number
  name: string
  registrations: Registration[]
}

export interface Event {
  id: number
  name: string
  maxRegistrations: number
  eventDate: string
  description: string
  registrationDeadline: string
  registrations: Registration[]
  photo: string | null
  activities: Activity[]
}

export interface CreateEventData {
  name: string
  maxRegistrations: number
  eventDate: string
  registrationDeadline: string
  photo?: string | null
  activities: Activity[]
  description?: string
}

