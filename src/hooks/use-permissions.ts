"use client";

import { canAccess, ROLE_META, type ModuleKey } from "@/lib/permissions";
import { useStore } from "@/lib/store";
import type { Role, User } from "@/lib/types";

export function usePermissions() {
  const users = useStore((s) => s.users);
  const currentUserId = useStore((s) => s.currentUserId);
  const access = useStore((s) => s.access);

  const user: User | undefined =
    users.find((u) => u.id === currentUserId) ?? users[0];
  const role: Role = user?.role ?? "admin";

  return {
    user,
    role,
    roleMeta: ROLE_META[role],
    can: (key: ModuleKey) => canAccess(role, access, key),
  };
}
