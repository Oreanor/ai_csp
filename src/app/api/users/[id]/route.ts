import { NextResponse } from "next/server";

import {
  getUserRepository,
  parseUserUpdate,
  UserRepositoryConflictError,
  UserRepositoryNotFoundError,
  ValidationError,
} from "@/lib/server/users";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: RouteContext) {
  const { id } = await ctx.params;
  const user = await getUserRepository().getById(id);
  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(user);
}

export async function PATCH(req: Request, ctx: RouteContext) {
  const { id } = await ctx.params;
  try {
    const patch = parseUserUpdate(await req.json());
    const user = await getUserRepository().update(id, patch);
    return NextResponse.json(user);
  } catch (e) {
    if (e instanceof ValidationError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    if (e instanceof UserRepositoryNotFoundError) {
      return NextResponse.json({ error: e.message }, { status: 404 });
    }
    if (e instanceof UserRepositoryConflictError) {
      return NextResponse.json({ error: e.message }, { status: 409 });
    }
    throw e;
  }
}

export async function DELETE(_req: Request, ctx: RouteContext) {
  const { id } = await ctx.params;
  try {
    await getUserRepository().delete(id);
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    if (e instanceof UserRepositoryNotFoundError) {
      return NextResponse.json({ error: e.message }, { status: 404 });
    }
    throw e;
  }
}
