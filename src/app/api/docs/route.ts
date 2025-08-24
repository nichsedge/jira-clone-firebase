import { NextRequest } from 'next/server';
import { swaggerDocument } from '@/lib/swagger';

export async function GET(request: NextRequest) {
  return Response.json(swaggerDocument);
}