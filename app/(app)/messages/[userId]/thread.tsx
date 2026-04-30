'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { Send } from 'lucide-react'
import { type Message, type Profile } from '@/lib/types'
import { getInitials } from '@/lib/utils'

type Props = {
  initialMessages: Message[]
  currentUserId: string
  otherUser: Profile
  postId: string | null
  sendMessage: (formData: FormData) => Promise<void>
}

export default function MessageThread({
  initialMessages,
  currentUserId,
  otherUser,
  postId,
  sendMessage,
}: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [isPending, startTransition] = useTransition()
  const bottomRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Polling toutes les 5 secondes pour les nouveaux messages
  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch(`/api/messages/${otherUser.id}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data)
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [otherUser.id])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const content = (formData.get('content') as string).trim()
    if (!content) return

    const optimistic: Message = {
      id: crypto.randomUUID(),
      sender_id: currentUserId,
      receiver_id: otherUser.id,
      post_id: postId,
      content,
      read_at: null,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimistic])
    formRef.current?.reset()

    startTransition(() => {
      sendMessage(formData).then(async () => {
        const res = await fetch(`/api/messages/${otherUser.id}`)
        if (res.ok) setMessages(await res.json())
      })
    })
  }

  function groupDate(dateStr: string) {
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) return "Aujourd'hui"
    if (date.toDateString() === yesterday.toDateString()) return 'Hier'
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
  }

  let lastDate = ''

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-1">
        {messages.map((msg) => {
          const isMe = msg.sender_id === currentUserId
          const msgDate = groupDate(msg.created_at)
          const showDate = msgDate !== lastDate
          lastDate = msgDate

          return (
            <div key={msg.id}>
              {showDate && (
                <div className="text-center my-3">
                  <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                    {msgDate}
                  </span>
                </div>
              )}
              <div className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                {!isMe && (
                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-semibold text-xs flex items-center justify-center flex-shrink-0 mb-1">
                    {getInitials(otherUser.full_name, otherUser.email)}
                  </div>
                )}
                <div
                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isMe
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-white border border-slate-200 text-slate-900 rounded-bl-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Saisie */}
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="flex items-end gap-2 pt-3 border-t border-slate-200"
      >
        {postId && (
          <input type="hidden" name="post_id" value={postId} />
        )}
        <textarea
          name="content"
          required
          rows={1}
          placeholder="Votre message…"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              e.currentTarget.form?.requestSubmit()
            }
          }}
          className="flex-1 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
        <button
          type="submit"
          disabled={isPending}
          className="flex-shrink-0 w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl flex items-center justify-center transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  )
}
