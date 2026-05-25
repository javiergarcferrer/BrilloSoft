"use client";

import { motion } from "framer-motion";
import { Pencil, Plus, Trash2, UserPlus, X } from "lucide-react";
import { useState } from "react";
import { useHydrated } from "@/hooks/use-hydrated";
import { TEAM_PALETTE, teamColor } from "@/lib/colors";
import { useStore } from "@/lib/store";
import type { Team } from "@/lib/types";
import { cn, initials } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Drawer } from "@/components/ui/drawer";
import { Field, Input } from "@/components/ui/field";
import { ConfirmDialog } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { toastSuccess } from "@/components/ui/toast";

export function TeamsView() {
  const hydrated = useHydrated();
  const teams = useStore((s) => s.teams);
  const services = useStore((s) => s.services);
  const addTeam = useStore((s) => s.addTeam);
  const updateTeam = useStore((s) => s.updateTeam);
  const removeTeam = useStore((s) => s.removeTeam);

  const [editing, setEditing] = useState<Team | "new" | null>(null);
  const [toDelete, setToDelete] = useState<Team | null>(null);

  const upcomingFor = (id: string) =>
    services.filter(
      (s) =>
        s.teamId === id &&
        (s.status === "scheduled" || s.status === "in_progress"),
    ).length;

  return (
    <div>
      <PageHeader
        title="Teams"
        description="Crews you can assign to scheduled jobs."
        actions={
          <Button onClick={() => setEditing("new")}>
            <Plus className="size-4" />
            New team
          </Button>
        }
      />

      {!hydrated ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {teams.map((team, i) => {
            const color = teamColor(team.colorKey);
            return (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Card className="overflow-hidden">
                  <div className="h-1.5" style={{ backgroundColor: color.hex }} />
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span
                          className="flex size-11 items-center justify-center rounded-xl text-sm font-bold text-white"
                          style={{ backgroundColor: color.hex }}
                        >
                          {initials(team.name)}
                        </span>
                        <div>
                          <h3 className="font-semibold text-slate-900">
                            {team.name}
                          </h3>
                          <p className="text-xs text-slate-500">
                            {team.members.length} members ·{" "}
                            {upcomingFor(team.id)} upcoming
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setEditing(team)}
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                          aria-label="Edit team"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          onClick={() => setToDelete(team)}
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500"
                          aria-label="Delete team"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {team.members.map((m) => (
                        <span
                          key={m}
                          className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                        >
                          {m}
                        </span>
                      ))}
                      {team.members.length === 0 && (
                        <span className="text-xs text-slate-400">
                          No members yet
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <TeamEditorDrawer
        target={editing}
        onClose={() => setEditing(null)}
        onSave={(data, id) => {
          if (id) {
            updateTeam(id, data);
            toastSuccess("Team updated", data.name);
          } else {
            addTeam({ ...data, active: true });
            toastSuccess("Team created", data.name);
          }
          setEditing(null);
        }}
      />

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) {
            removeTeam(toDelete.id);
            toastSuccess("Team removed", "Assigned jobs were set to unassigned.");
          }
        }}
        title={`Delete ${toDelete?.name ?? "team"}?`}
        description="Any jobs assigned to this team will become unassigned."
        confirmLabel="Delete"
        tone="danger"
      />
    </div>
  );
}

function TeamEditorDrawer({
  target,
  onClose,
  onSave,
}: {
  target: Team | "new" | null;
  onClose: () => void;
  onSave: (
    data: { name: string; colorKey: string; members: string[] },
    id?: string,
  ) => void;
}) {
  const team = target === "new" || target === null ? null : target;
  const [name, setName] = useState("");
  const [colorKey, setColorKey] = useState("indigo");
  const [members, setMembers] = useState<string[]>([]);
  const [newMember, setNewMember] = useState("");
  const [initialized, setInitialized] = useState<string | null>(null);

  const open = target !== null;
  const editKey = team?.id ?? "new";

  // sync form when the drawer target changes
  if (open && initialized !== editKey) {
    setName(team?.name ?? "");
    setColorKey(team?.colorKey ?? "indigo");
    setMembers(team?.members ?? []);
    setNewMember("");
    setInitialized(editKey);
  }
  if (!open && initialized !== null) setInitialized(null);

  const addMember = () => {
    const v = newMember.trim();
    if (!v) return;
    setMembers((m) => [...m, v]);
    setNewMember("");
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      eyebrow={team ? "Edit team" : "New team"}
      title={team ? team.name : "Create a crew"}
      widthClass="sm:w-[26rem]"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!name.trim()}
            onClick={() =>
              onSave({ name: name.trim(), colorKey, members }, team?.id)
            }
          >
            {team ? "Save changes" : "Create team"}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <Field label="Team name">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. North Crew"
            autoFocus
          />
        </Field>

        <Field label="Color">
          <div className="flex flex-wrap gap-2">
            {Object.entries(TEAM_PALETTE).map(([key, c]) => (
              <button
                key={key}
                type="button"
                onClick={() => setColorKey(key)}
                className={cn(
                  "size-9 rounded-xl ring-2 ring-offset-2 transition-transform hover:scale-105",
                  colorKey === key ? "ring-slate-900" : "ring-transparent",
                )}
                style={{ backgroundColor: c.hex }}
                aria-label={c.name}
              />
            ))}
          </div>
        </Field>

        <Field label="Members">
          <div className="flex gap-2">
            <Input
              value={newMember}
              onChange={(e) => setNewMember(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addMember();
                }
              }}
              placeholder="Add a name and press Enter"
            />
            <Button variant="outline" size="icon" type="button" onClick={addMember}>
              <UserPlus className="size-4" />
            </Button>
          </div>
          {members.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {members.map((m, i) => (
                <span
                  key={`${m}-${i}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 py-1 pl-3 pr-1.5 text-sm font-medium text-slate-700"
                >
                  {m}
                  <button
                    type="button"
                    onClick={() =>
                      setMembers((ms) => ms.filter((_, idx) => idx !== i))
                    }
                    className="rounded-full p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                  >
                    <X className="size-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </Field>
      </div>
    </Drawer>
  );
}
