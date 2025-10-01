import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getAuthUser } from '@/lib/auth'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; participantId: string } }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const eventId = parseInt(params.id)
    const participantId = parseInt(params.participantId)

    // Check if event exists and belongs to the organizer
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .eq('organizer_id', user.id)
      .single()

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Event not found or unauthorized' },
        { status: 404 }
      )
    }

    // Check if participant exists and belongs to this event
    const { data: participant, error: participantError } = await supabase
      .from('participants')
      .select('*')
      .eq('id', participantId)
      .eq('event_id', eventId)
      .single()

    if (participantError || !participant) {
      return NextResponse.json(
        { error: 'Participant not found' },
        { status: 404 }
      )
    }

    // Delete the participant
    const { error: deleteError } = await supabase
      .from('participants')
      .delete()
      .eq('id', participantId)

    if (deleteError) throw deleteError

    return NextResponse.json({ message: 'Participant removed successfully' })
  } catch (error) {
    console.error('Error removing participant:', error)
    return NextResponse.json(
      { error: 'Failed to remove participant' },
      { status: 500 }
    )
  }
}