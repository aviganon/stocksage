import { NextRequest, NextResponse } from 'next/server';
import { LOCALES } from '@/lib/i18n/locales';
import fs from 'fs';
import path from 'path';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale } = await params;
  if (!LOCALES.includes(locale as never)) {
    return NextResponse.json({}, { status: 404 });
  }

  try {
    const filePath = path.join(process.cwd(), 'messages', `${locale}.json`);
    const content  = fs.readFileSync(filePath, 'utf-8');
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch {
    return NextResponse.json({}, { status: 404 });
  }
}
