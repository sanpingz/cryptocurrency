import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // Check for static assets: files with specific extensions or Next.js internal assets
  if (pathname.startsWith('/_next') || pathname.startsWith('/static') || /\.(css|js|png|jpg|jpeg|gif|ico|svg|ttf|woff|woff2)$/.test(pathname)) {
    return NextResponse.next()
  }

  const ip = request.ip || request.headers.get('x-forwarded-for') || 'Unknown IP'
  const userAgent = request.headers.get('user-agent') || 'Unknown User Agent'
  const referer = request.headers.get('referer') || 'Direct Access'
  const url = request.url
  const method = request.method
  const timestamp = new Date().toISOString()

  console.log(JSON.stringify({
    timestamp,
    ip,
    method,
    url,
    userAgent,
    referer,
  }, null, 2))

  return NextResponse.next()
}

export const config = {
  matcher: '/:path*',
}