import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseUser } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { eventId: string; participantId: string } }
) {
  try {
    // Get user from Supabase session
    const user = await getSupabaseUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const organizerId = user.id
    const eventId = parseInt(params.eventId)
    const participantId = parseInt(params.participantId)

    // Verify the event belongs to this organizer
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select('id')
      .eq('id', eventId)
      .eq('organizer_id', organizerId)
      .single()

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Event not found or unauthorized' },
        { status: 404 }
      )
    }

    // Delete participant
    const { data: deletedParticipant, error: deleteError } = await supabaseAdmin
      .from('participants')
      .delete()
      .eq('id', participantId)
      .eq('event_id', eventId)
      .select()
      .single()

    if (deleteError || !deletedParticipant) {
      return NextResponse.json(
        { error: 'Participant not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: 'Participant removed successfully' })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}