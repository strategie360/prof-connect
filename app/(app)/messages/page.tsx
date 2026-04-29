import Link from 'next/link'
import { redirect } from 'next/navigation'
import { MessageSquare } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { type Message, type Profile } from '@/lib/types'
import { formatRelativeDate, getInitials, truncate } from '@/lib/utils'

type ConversationRow = {
  other: Profile
  lastMessage: Message
  unread: number
}

export default async function MessagesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: messages } = await supabase
    .from('messages')
    .select('*, sender:profiles!messages_sender_id_fkey(*), receiver:profiles!messages_receiver_id_fkey(*)')
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order('created_at', { ascending: false })
    .returns<Message[]>()

  // Grouper par conversation (paire d'utilisateurs)
  const conversationMap = new Map<string, ConversationRow>()
  for (const msg of messages ?? []) {
    const other = msg.sender_id === user.id ? msg.receiver! : msg.sender!
    if (!conversationMap.has(other.id)) {
      const unread =
        msg.receiver_id === user.id && !msg.read_at ? 1 : 0
      conversationMap.set(other.id, { other, lastMessage: msg, unread })
    } else {
      const existing = conversationMap.get(other.id)!
      if (msg.receiver_id === user.id && !msg.read_at) {
        existing.unread += 1
      }
    }
  }

  const conversations = Array.from(conversationMap.values())

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900 mb-6">Messages</h1>

      {conversations.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-lg font-medium mb-1">Aucun message</p>
          <p className="text-sm">
            Contactez un enseignant depuis une annonce pour démarrer une conversation.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map(({ other, lastMessage, unread }) => (
            <Link
              key={other.id}
              href={`/messages/${other.id}`}
              className="flex items-center gap-4 bg-white border border-slate-200 rounded-xl px-5 py-4 hover:shadow-md hover:border-slate-300 transition-all"
            >
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm flex items-center justify-center">
                  {getInitials(other.full_name, other.email)}
                </div>
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-600 rounded-full border-2 border-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span className={`text-sm font-medium ${unread > 0 ? 'text-slate-900' : 'text-slate-700'}`}>
                    {other.full_name ?? 'Enseignant·e'}
                  </span>
                  <span className="text-xs text-slate-400 flex-shrink-0">
                    {formatRelativeDate(lastMessage.created_at)}
                  </span>
                </div>
                <p className={`text-sm truncate ${unread > 0 ? 'text-slate-800 font-medium' : 'text-slate-400'}`}>
                  {lastMessage.sender_id === user.id ? 'Vous : ' : ''}
                  {truncate(lastMessage.content, 60)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
