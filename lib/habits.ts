import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";

// Active (non-archived) habits with their logs. Wrapped in React cache() so the
// dashboard layout and the page render share a single query per request instead
// of each hitting the database separately.
export const getActiveHabitsWithLogs = cache((userId: string) =>
  prisma.habit.findMany({
    where: { userId, archived: false },
    include: { logs: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  })
);
