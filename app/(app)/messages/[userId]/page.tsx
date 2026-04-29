import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { type Message, type Profile } from '@/lib/types'
import MessageThread from './thread'

export default async function ConversationPage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>
  searchParams: Promise<{ post?: string }>
}) {
  const { userId } = await params
  const { post: postId } = await searchParams

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  if (userId === user.id) redirect('/messages')

  const { data: otherUser } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single<Profile>()

  if (!otherUser) notFound()

  // Marquer les messages reçus comme lus
  await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('sender_id', userId)
    .eq('receiver_id', user.id)
    .is('read_at', null)

  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .or(
      `and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id})`
    )
    .order('created_at', { ascending: true })
    .returns<Message[]>()

  async function sendMessage(formData: FormData) {
    'use server'
    const content = (formData.get('content') as string).trim()
    const postIdValue = formData.get('post_id') as string | null
    if (!content) return

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: userId,
      content,
      post_id: postIdValue || null,
    })
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <Link
          href="/messages"
          className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <Link
            href={`/profile/${otherUser.id}`}
            className="font-semibold text-slate-900 hover:text-blue-600 transition-colors"
          >
            {otherUser.full_name ?? 'Enseignant·e'}
          </Link>
          {otherUser.academy && (
            <p className="text-xs text-slate-400">Académie de {otherUser.academy}</p>
          )}
        </div>
      </div>

      <MessageThread
        initialMessages={messages ?? []}
        currentUserId={user.id}
        otherUser={otherUser}
        postId={postId ?? null}
        sendMessage={sendMessage}
      />
    </div>
  )
}
