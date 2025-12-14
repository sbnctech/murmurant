import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  void body;

  return NextResponse.json(
    {
      answer: "TODO: implement chatbot query execution (template-only, read-only)",
      data: null,
      deep_links: [],
      policy: { read_only: true },
    },
    { status: 501 },
  );
}
