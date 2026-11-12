import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/core/storage/user-store';

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('devesec_session')?.value;

    if (!sessionCookie) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    const payload = verifySessionToken(sessionCookie);
    if (!payload) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: payload.userId,
        email: payload.email,
        name: payload.name,
        role: payload.role,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ authenticated: false, user: null });
  }
}
