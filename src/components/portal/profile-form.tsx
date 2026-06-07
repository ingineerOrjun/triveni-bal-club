"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Save, CheckCircle2, AlertCircle } from "lucide-react";
import { updateProfile, type ProfileFormState } from "@/lib/profile/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface ProfileFormValues {
  fullName: string;
  email: string;
  classLevel: string;
  section: string;
  bio: string;
  avatarUrl: string;
  interests: string[];
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" size="lg" disabled={pending}>
      <Save className="size-4" />
      {pending ? "Saving…" : "Save changes"}
    </Button>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function ProfileForm({ values }: { values: ProfileFormValues }) {
  const [state, formAction] = useActionState<ProfileFormState, FormData>(
    updateProfile,
    {}
  );

  return (
    <form action={formAction} className="flex flex-col gap-sp-4" noValidate>
      {state.message ? (
        <div
          role="status"
          className="flex items-center gap-2 rounded-md border border-success/40 bg-success-bg/50 px-3 py-2 text-caption text-emerald-700"
        >
          <CheckCircle2 className="size-4 shrink-0" /> {state.message}
        </div>
      ) : null}
      {state.error ? (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-md border border-danger/40 bg-danger-bg/50 px-3 py-2 text-caption text-danger"
        >
          <AlertCircle className="size-4 shrink-0" /> {state.error}
        </div>
      ) : null}

      {/* Avatar + email (email read-only) */}
      <div className="flex flex-col gap-sp-3 sm:flex-row sm:items-center">
        <Avatar size="xl">
          {values.avatarUrl ? (
            <AvatarImage src={values.avatarUrl} alt="" />
          ) : null}
          <AvatarFallback>{initials(values.fullName)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Label htmlFor="avatar_url">Avatar URL</Label>
          <Input
            id="avatar_url"
            name="avatar_url"
            type="url"
            defaultValue={values.avatarUrl}
            placeholder="https://…/photo.jpg"
            aria-invalid={Boolean(state.fieldErrors?.avatar_url)}
            aria-describedby={
              state.fieldErrors?.avatar_url ? "avatar-error" : undefined
            }
          />
          {state.fieldErrors?.avatar_url ? (
            <p id="avatar-error" className="mt-1 text-caption text-danger">
              {state.fieldErrors.avatar_url}
            </p>
          ) : (
            <p className="mt-1 text-caption text-soft">
              Paste a link to your photo. Uploads come in a later update.
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-sp-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="full_name">Full name</Label>
          <Input
            id="full_name"
            name="full_name"
            defaultValue={values.fullName}
            aria-invalid={Boolean(state.fieldErrors?.full_name)}
            aria-describedby={
              state.fieldErrors?.full_name ? "name-error" : undefined
            }
          />
          {state.fieldErrors?.full_name ? (
            <p id="name-error" className="text-caption text-danger">
              {state.fieldErrors.full_name}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={values.email} disabled readOnly />
          <p className="text-caption text-soft">
            Contact an administrator to change your email.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="class_level">Class</Label>
          <Input
            id="class_level"
            name="class_level"
            defaultValue={values.classLevel}
            placeholder="e.g. Grade 9"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="section">Section</Label>
          <Input
            id="section"
            name="section"
            defaultValue={values.section}
            placeholder="e.g. A"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="interests">Interests</Label>
        <Input
          id="interests"
          name="interests"
          defaultValue={values.interests.join(", ")}
          placeholder="Debate, Art, Football (comma-separated)"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          name="bio"
          rows={4}
          defaultValue={values.bio}
          placeholder="Tell the club a little about yourself…"
          aria-invalid={Boolean(state.fieldErrors?.bio)}
          aria-describedby={state.fieldErrors?.bio ? "bio-error" : undefined}
        />
        {state.fieldErrors?.bio ? (
          <p id="bio-error" className="text-caption text-danger">
            {state.fieldErrors.bio}
          </p>
        ) : null}
      </div>

      <div>
        <SubmitButton />
      </div>
    </form>
  );
}
