import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const res = await fetch(`https://dreamina-worker.taylortang458303.workers.dev/api/status/${id}`);
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
} 