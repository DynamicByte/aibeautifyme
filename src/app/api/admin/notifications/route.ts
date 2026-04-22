import { NextRequest, NextResponse } from 'next/server';
import { store, NotificationType } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread') === 'true';
    const type = searchParams.get('type') as NotificationType | null;
    const limit = parseInt(searchParams.get('limit') || '50');

    let notifications = await store.getAllNotifications(unreadOnly);

    if (type) {
      notifications = notifications.filter((n) => n.type === type);
    }

    // Sort by created_at descending
    notifications.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Apply limit
    notifications = notifications.slice(0, limit);

    const allNotifications = await store.getAllNotifications();
    const unreadCount = allNotifications.filter((n) => !n.is_read).length;

    return NextResponse.json({
      success: true,
      data: notifications,
      unread_count: unreadCount,
    });
  } catch (error) {
    console.error('Notifications GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// Create a custom notification (for admin-triggered alerts)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type = 'system', title, message, reference_id } = body;

    if (!title || !message) {
      return NextResponse.json(
        { success: false, error: 'Title and message are required' },
        { status: 400 }
      );
    }

    const notification = await store.createNotification({
      type,
      title,
      message,
      reference_id,
      is_read: false,
    });

    return NextResponse.json({ success: true, data: notification });
  } catch (error) {
    console.error('Notifications POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}

// Mark notifications as read
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids, mark_all_read } = body;

    if (mark_all_read) {
      await store.markAllNotificationsRead();
    } else if (ids && Array.isArray(ids)) {
      await Promise.all(ids.map((id: string) => store.markNotificationRead(id)));
    }

    return NextResponse.json({ success: true, message: 'Notifications updated' });
  } catch (error) {
    console.error('Notifications PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}

// Delete notifications
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      await store.deleteNotification(id);
    }

    return NextResponse.json({ success: true, message: 'Notifications deleted' });
  } catch (error) {
    console.error('Notifications DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete notifications' },
      { status: 500 }
    );
  }
}
