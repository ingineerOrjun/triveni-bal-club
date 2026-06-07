"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Save, CheckCircle2, AlertCircle } from "lucide-react";
import type { FormState } from "@/lib/forms";
import type { MediaFolderRow } from "@/types/database";
import { updateFileMeta } from "@/lib/media/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" disabled={pending}>
      <Save className="size-4" /> {pending ? "Saving…" : "Save details"}
    </Button>
  );
}

export function FileMetaForm({
  id,
  values,
  folders,
}: {
  id: string;
  values: { filename: string; alt_text: string; caption: string; description: string; folder_id: string };
  folders: MediaFolderRow[];
}) {
  const [state, formAction] = useActionState<FormState, FormData>(
    updateFileMeta.bind(null, id),
    {}
  );

  return (
    <form action={formAction} className="flex flex-col gap-sp-3">
      <div className="grid gap-sp-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="filename">Filename</Label>
          <Input id="filename" name="filename" defaultValue={values.filename} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="folder_id">Folder</Label>
          <Select name="folder_id" defaultValue={values.folder_id || "root"}>
            <SelectTrigger id="folder_id">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="root">Unfiled</SelectItem>
              {folders.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="alt_text">Alt text (accessibility)</Label>
        <Input id="alt_text" name="alt_text" defaultValue={values.alt_text} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="caption">Caption</Label>
        <Input id="caption" name="caption" defaultValue={values.caption} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={3} defaultValue={values.description} />
      </div>
      <div className="flex items-center gap-sp-2">
        <SaveButton />
        {state.message ? (
          <span role="status" className="inline-flex items-center gap-1 text-caption text-emerald-700">
            <CheckCircle2 className="size-3.5" /> {state.message}
          </span>
        ) : null}
        {state.error ? (
          <span role="alert" className="inline-flex items-center gap-1 text-caption text-danger">
            <AlertCircle className="size-3.5" /> {state.error}
          </span>
        ) : null}
      </div>
    </form>
  );
}
