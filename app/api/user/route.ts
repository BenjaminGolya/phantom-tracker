import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isLocale } from "@/lib/i18n/config";

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, image, language } = await req.json();

  // Guard against oversized avatars (data URLs). ~1.5MB cap.
  if (typeof image === "string" && image.length > 1_500_000) {
    return NextResponse.json({ error: "Image too large" }, { status: 413 });
  }

  const data: { name?: string; image?: string | null; language?: string } = {};
  if (name !== undefined) data.name = name;
  if (image !== undefined) data.image = image;
  if (isLocale(language)) data.language = language;

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data,
  });

  return NextResponse.json({ id: user.id, name: user.name, email: user.email, image: user.image });
}
