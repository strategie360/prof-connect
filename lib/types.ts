export type Role = 'admin' | 'moderateur' | 'user'

export type Profile = {
  id: string
  email: string
  full_name: string | null
  academy: string | null
  subject: string | null
  city: string | null
  bio: string | null
  role: Role
  created_at: string
  updated_at: string
}

export type Category = {
  id: string
  name: string
  post_count: number
  created_at: string
}

export type PostType = 'demande' | 'offre'

export type Post = {
  id: string
  author_id: string
  title: string
  content: string
  post_type: PostType
  city: string | null
  address: string | null
  lat: number | null
  lng: number | null
  category_names: string[]
  created_at: string
  updated_at: string
  profiles?: Profile
}

export type Message = {
  id: string
  sender_id: string
  receiver_id: string
  post_id: string | null
  content: string
  read_at: string | null
  created_at: string
  sender?: Profile
  receiver?: Profile
  posts?: Post
}

export type Conversation = {
  other_user: Profile
  last_message: Message
  unread_count: number
}
