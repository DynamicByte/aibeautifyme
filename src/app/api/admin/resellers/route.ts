import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/db/store';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';

  let resellers = await store.getAllResellers();

  if (search) {
    const searchLower = search.toLowerCase();
    resellers = resellers.filter(
      (r) =>
        r.name.toLowerCase().includes(searchLower) ||
        r.referral_code.toLowerCase().includes(searchLower)
    );
  }

  resellers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return NextResponse.json({
    success: true,
    data: resellers,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, referral_code } = body;

    if (!name || !referral_code) {
      return NextResponse.json(
        { success: false, error: 'Name and referral code are required' },
        { status: 400 }
      );
    }

    const cleanCode = referral_code.toLowerCase().replace(/[^a-z0-9-_]/g, '');

    if (cleanCode.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Referral code must be at least 2 characters' },
        { status: 400 }
      );
    }

    const existing = await store.getResellerByCode(cleanCode);
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Referral code already exists' },
        { status: 400 }
      );
    }

    const reseller = await store.createReseller({
      name,
      referral_code: cleanCode,
      total_referrals: 0,
      total_revenue: 0,
    });

    return NextResponse.json({
      success: true,
      data: reseller,
    });
  } catch (error) {
    console.error('Create reseller error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create reseller' },
      { status: 500 }
    );
  }
}
