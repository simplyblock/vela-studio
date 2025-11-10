import { NextRequest, NextResponse } from 'next/server'
import { getCSP } from './csp'

const csp = getCSP()

export default function proxy(req: NextRequest) {
  const response = NextResponse.next()
  response.headers.set('Content-Security-Policy', csp)
}