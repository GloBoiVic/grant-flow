"use client";

import { useState } from "react";
import { X } from "lucide-react";

import { assignTagToGrant, createTag, removeTagFromGrant } from "@/app/(authenticated)/(org-required)/grants/tag-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TagDto } from "@/types/tag";

interface TagManagerProps {
  grantId: string;
  assignedTags: TagDto[];
  activeTags: TagDto[];
}

export function TagManager({ grantId, assignedTags: initialAssignedTags, activeTags: initialActiveTags }: TagManagerProps): React.ReactNode {
  const [assignedTags, setAssignedTags] = useState(initialAssignedTags);
  const [activeTags, setActiveTags] = useState(initialActiveTags);
  const [selectedTagId, setSelectedTagId] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const unassignedTags = activeTags.filter((tag) => !assignedTags.some((assigned) => assigned.id === tag.id));

  async function assign(tagId: string, name: string): Promise<void> {
    if (!tagId) return;
    setIsWorking(true); setError(null); setSuccess(null);
    const result = await assignTagToGrant({ grantId, tagId });
    if (!result.success) { setError(result.error); setIsWorking(false); return; }
    setAssignedTags(result.data); setSelectedTagId(""); setSuccess(`${name} added.`); setIsWorking(false);
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setIsWorking(true); setError(null); setSuccess(null);
    const result = await createTag({ name: newTagName });
    if (!result.success) { setError(result.errors?.name?.[0] ?? result.error); setIsWorking(false); return; }
    setActiveTags((current) => [...current, result.data].sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id)));
    setNewTagName("");
    const assignment = await assignTagToGrant({ grantId, tagId: result.data.id });
    if (!assignment.success) { setError(assignment.error); setIsWorking(false); return; }
    setAssignedTags(assignment.data); setSuccess(`${result.data.name} created and added.`); setIsWorking(false);
  }

  async function handleRemove(tag: TagDto): Promise<void> {
    setIsWorking(true); setError(null); setSuccess(null);
    const result = await removeTagFromGrant({ grantId, tagId: tag.id });
    if (!result.success) { setError(result.error); setIsWorking(false); return; }
    setAssignedTags(result.data); setSuccess(`${tag.name} removed.`); setIsWorking(false);
  }

  return <section className="mt-6 border-b border-border pb-5" aria-labelledby="grant-tags-title" aria-busy={isWorking}>
    <div className="flex items-center justify-between"><h3 id="grant-tags-title" className="text-h2">Tags</h3>{isWorking && <span className="text-caption text-muted-foreground">Saving…</span>}</div>
    <div className="mt-3 flex flex-wrap gap-2" aria-label="Assigned tags">
      {assignedTags.length === 0 ? <p className="text-sm text-muted-foreground">No tags assigned yet.</p> : assignedTags.map((tag) => <span key={tag.id} className="inline-flex items-center gap-1"><Badge variant="secondary">{tag.name}</Badge><Button type="button" variant="ghost" size="icon-xs" disabled={isWorking} aria-label={`Remove ${tag.name} tag`} onClick={() => void handleRemove(tag)}><X aria-hidden="true" /></Button></span>)}
    </div>
    <div className="mt-4 space-y-3">
      {unassignedTags.length > 0 ? <div className="flex items-end gap-2"><div className="min-w-0 flex-1"><label htmlFor="grant-tag-select" className="mb-1 block text-label text-muted-foreground">Add existing tag</label><select id="grant-tag-select" value={selectedTagId} disabled={isWorking} onChange={(event) => setSelectedTagId(event.target.value)} className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"><option value="">Choose a tag…</option>{unassignedTags.map((tag) => <option key={tag.id} value={tag.id}>{tag.name}</option>)}</select></div><Button type="button" size="sm" disabled={!selectedTagId || isWorking} onClick={() => { const tag = unassignedTags.find((item) => item.id === selectedTagId); if (tag) void assign(tag.id, tag.name); }}>Add tag</Button></div> : <p className="text-caption text-muted-foreground">{activeTags.length === 0 ? "No organization tags yet. Create one below." : "All active organization tags are assigned."}</p>}
      <form className="flex items-end gap-2" onSubmit={(event) => void handleCreate(event)}><div className="min-w-0 flex-1"><label htmlFor="new-grant-tag" className="mb-1 block text-label text-muted-foreground">Create a new tag</label><input id="new-grant-tag" value={newTagName} maxLength={50} placeholder="e.g. Housing" disabled={isWorking} onChange={(event) => setNewTagName(event.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50" /></div><Button type="submit" variant="outline" size="sm" disabled={!newTagName.trim() || isWorking}>Create</Button></form>
    </div>
    {error && <p className="mt-3 rounded-md border border-destructive/30 bg-destructive-soft px-3 py-2 text-sm text-destructive" role="alert">{error}</p>}
    {success && <p className="mt-3 rounded-md border border-success/30 bg-status-approved px-3 py-2 text-sm text-status-approved-fg" role="status" aria-live="polite">{success}</p>}
  </section>;
}
