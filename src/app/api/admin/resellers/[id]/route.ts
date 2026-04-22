import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/db/store';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const reseller = await store.getReseller(id);
  if (!reseller) {
    return NextResponse.json(
      { success: false, error: 'Reseller not found' },
      { status: 404 }
    );
  }

  await store.deleteReseller(id);

  return NextResponse.json({ success: true });
}
