'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'

interface ChatMessage {
  id: number
  event_id: number
  user_id: string
  message: string
  created_at: string
  user: {
    full_name: string
    nickname: string
    avatar_url: string
  }
}

interface EventChatProps {
  eventId: number
  isParticipant: boolean
  isOrganizer: boolean
}

export default function EventChat({ eventId, isParticipant, isOrganizer }: EventChatProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const canAccessChat = isParticipant || isOrganizer

  useEffect(() => {
    if (canAccessChat) {
      fetchMessages()
      const cleanup = subscribeToMessages()
      return cleanup
    }
  }, [eventId, canAccessChat])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          id,
          event_id,
          user_id,
          message,
          created_at,
          user:users!chat_messages_user_id_fkey (
            full_name,
            nickname,
            avatar_url
          )
        `)
        .eq('event_id', eventId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching messages:', error)
      } else {
        // Transform data to match ChatMessage interface (user is returned as array, extract first element)
        const transformedData = (data || []).map((msg: any) => ({
          ...msg,
          user: Array.isArray(msg.user) ? msg.user[0] : msg.user
        }))
        setMessages(transformedData)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const subscribeToMessages = () => {
    console.log(`🔔 Setting up realtime subscription for event ${eventId}`)

    const channel = supabase
      .channel(`chat:${eventId}`, {
        config: {
          broadcast: { self: true }
        }
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `event_id=eq.${eventId}`,
        },
        async (payload) => {
          console.log('📨 New message received:', payload)

          // Fetch the new message with user data
          const { data, error } = await supabase
            .from('chat_messages')
            .select(`
              id,
              event_id,
              user_id,
              message,
              created_at,
              user:users!chat_messages_user_id_fkey (
                full_name,
                nickname,
                avatar_url
              )
            `)
            .eq('id', payload.new.id)
            .single()

          if (!error && data) {
            console.log('✅ Adding message to state:', data)
            // Transform data to match ChatMessage interface
            const transformedMessage: any = {
              ...data,
              user: Array.isArray(data.user) ? data.user[0] : data.user
            }
            setMessages((prev) => {
              // Prevent duplicates
              if (prev.some(msg => msg.id === transformedMessage.id)) {
                return prev
              }
              return [...prev, transformedMessage]
            })
          } else {
            console.error('❌ Error fetching message:', error)
          }
        }
      )
      .subscribe((status) => {
        console.log('🔌 Subscription status:', status)
      })

    return () => {
      console.log('🔴 Cleaning up subscription')
      supabase.removeChannel(channel)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMessage.trim() || !user || sending) return

    setSending(true)

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          event_id: eventId,
          user_id: user.id,
          message: newMessage.trim(),
        })

      if (error) {
        console.error('Error sending message:', error)
        alert('Failed to send message')
      } else {
        setNewMessage('')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`

    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  if (!user) {
    return (
      <div className="card text-center py-8 bg-gray-50">
        <div className="text-4xl mb-4">🔒</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Login Required</h3>
        <p className="text-gray-600">Sign in to chat with other participants</p>
      </div>
    )
  }

  if (!canAccessChat) {
    return (
      <div className="card text-center py-8 bg-gray-50">
        <div className="text-4xl mb-4">💬</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Join Event to Chat</h3>
        <p className="text-gray-600">Complete your payment to access the event chat</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <div className="text-lg text-gray-600">Loading chat...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="card flex flex-col h-[600px]">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Event Chat</h2>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span>Live</span>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">💬</div>
            <p className="text-gray-600">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwnMessage = msg.user_id === user.id

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
              >
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200">
                    <Image
                      src={msg.user.avatar_url || '/default-avatar.svg'}
                      alt={msg.user.full_name}
                      width={40}
                      height={40}
                      className="object-cover"
                    />
                  </div>
                </div>

                <div className={`flex-1 max-w-[70%] ${isOwnMessage ? 'flex flex-col items-end' : ''}`}>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className={`text-sm font-medium text-gray-900 ${isOwnMessage ? 'order-2' : ''}`}>
                      {msg.user.full_name}
                    </span>
                    <span className={`text-xs text-gray-500 ${isOwnMessage ? 'order-1' : ''}`}>
                      @{msg.user.nickname}
                    </span>
                  </div>

                  <div
                    className={`rounded-2xl px-4 py-2 ${
                      isOwnMessage
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                  </div>

                  <span className="text-xs text-gray-500 mt-1">
                    {formatMessageTime(msg.created_at)}
                  </span>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="border-t border-gray-200 pt-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            maxLength={1000}
            disabled={sending}
            className="flex-1 input"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
        <div className="text-xs text-gray-500 mt-2">
          {newMessage.length}/1000 characters
        </div>
      </form>
    </div>
  )
}
