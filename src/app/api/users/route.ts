import { NextResponse } from "next/server";

import {
  getUserRepository,
  parseUserCreate,
  UserRepositoryConflictError,
  ValidationError,
} from "@/lib/server/users";

export async function GET() {
  const users = await getUserRepository().list();
  return NextResponse.json(users);
}

export async function POST(req: Request) {
  try {
    const input = parseUserCreate(await req.json());
    const user = await getUserRepository().create(input);
    return NextResponse.json(user, { status: 201 });
  } catch (e) {
    if (e instanceof ValidationError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    if (e instanceof UserRepositoryConflictError) {
      return NextResponse.json({ error: e.message }, { status: 409 });
    }
    throw e;
  }
}
