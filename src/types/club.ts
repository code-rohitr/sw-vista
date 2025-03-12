export interface ClubMember {
  id: number
  name: string
  role: string
  year: string
}

export interface Club {
  id: number
  name: string
  description: string
  facultyAdvisor: string
  president: string
  lastUpdated: string
  type: string
  members: ClubMember[]
}