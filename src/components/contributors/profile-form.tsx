"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Save, AlertCircle, CheckCircle2 } from "lucide-react";
import type { FormState } from "@/lib/forms";
import type { ContributorRow } from "@/types/database";
import { upsertMyContributorProfile } from "@/lib/contributors/actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldError } from "@/components/shared/field-error";
import { MediaField } from "@/components/media/media-field";

const TYPES = [
  { value: "student", label: "Student" },
  { value: "teacher", label: "Teacher" },
  { value: "staff", label: "Staff" },
  { value: "alumni", label: "Alumnus" },
  { value: "guest", label: "Guest author" },
  { value: "club_member", label: "Club member" },
];

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" size="lg" disabled={pending}>
      <Save className="size-4" /> {pending ? "Saving…" : "Save profile"}
    </Button>
  );
}

export function ContributorProfileForm({ contributor }: { contributor: ContributorRow | null }) {
  const [state, formAction] = useActionState<FormState, FormData>(upsertMyContributorProfile, {});
  const social = (contributor?.social_links ?? {}) as Record<string, string>;

  return (
    <form action={formAction} className="flex flex-col gap-sp-4" noValidate>
      {state.error ? (
        <div role="alert" className="flex items-center gap-2 rounded-md border border-danger/40 bg-danger-bg/50 px-3 py-2 text-caption text-danger">
          <AlertCircle className="size-4 shrink-0" /> {state.error}
        </div>
      ) : null}
      {state.message ? (
        <div role="status" className="flex items-center gap-2 rounded-md border border-success/40 bg-success-bg/50 px-3 py-2 text-caption text-emerald-700">
          <CheckCircle2 className="size-4 shrink-0" /> {state.message}
        </div>
      ) : null}

      <Card>
        <CardHeader><CardTitle>Identity</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-sp-3">
          <div className="grid gap-sp-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="display_name">Display name</Label>
              <Input id="display_name" name="display_name" defaultValue={contributor?.display_name ?? ""} aria-invalid={Boolean(state.fieldErrors?.display_name)} />
              <FieldError id="display_name" message={state.fieldErrors?.display_name} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="type">I am a…</Label>
              <select id="type" name="type" defaultValue={contributor?.type ?? "student"} className="rounded-md border border-line bg-surface px-3 py-2 text-body">
                {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="headline">Headline</Label>
            <Input id="headline" name="headline" defaultValue={contributor?.headline ?? ""} placeholder="e.g. Young poet & science enthusiast" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bio">Biography</Label>
            <Textarea id="bio" name="bio" rows={4} defaultValue={contributor?.bio ?? ""} placeholder="A short introduction shown on your public profile." />
          </div>
          <div className="grid gap-sp-3 sm:grid-cols-2">
            <MediaField name="profile_photo" label="Profile photo" defaultValue={contributor?.profile_photo ?? ""} />
            <MediaField name="cover_photo" label="Cover banner" defaultValue={contributor?.cover_photo ?? ""} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Affiliation</CardTitle></CardHeader>
        <CardContent className="grid gap-sp-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="class_level">Class</Label>
            <Input id="class_level" name="class_level" defaultValue={contributor?.class_level ?? ""} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="section">Section</Label>
            <Input id="section" name="section" defaultValue={contributor?.section ?? ""} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="department">Department</Label>
            <Input id="department" name="department" defaultValue={contributor?.department ?? ""} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="designation">Designation</Label>
            <Input id="designation" name="designation" defaultValue={contributor?.designation ?? ""} placeholder="e.g. Science teacher" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="organization">Organization</Label>
            <Input id="organization" name="organization" defaultValue={contributor?.organization ?? ""} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="graduation_year">Graduation year</Label>
            <Input id="graduation_year" name="graduation_year" type="number" defaultValue={contributor?.graduation_year ?? ""} placeholder="e.g. 2026" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Links</CardTitle></CardHeader>
        <CardContent className="grid gap-sp-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="website">Website</Label>
            <Input id="website" name="website" type="url" defaultValue={contributor?.website ?? ""} placeholder="https://…" />
            <FieldError id="website" message={state.fieldErrors?.website} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="instagram">Instagram</Label>
            <Input id="instagram" name="instagram" defaultValue={social.instagram ?? ""} placeholder="https://instagram.com/…" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="facebook">Facebook</Label>
            <Input id="facebook" name="facebook" defaultValue={social.facebook ?? ""} placeholder="https://facebook.com/…" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="linkedin">LinkedIn</Label>
            <Input id="linkedin" name="linkedin" defaultValue={social.linkedin ?? ""} placeholder="https://linkedin.com/in/…" />
          </div>
        </CardContent>
      </Card>

      <div><SaveButton /></div>
    </form>
  );
}
