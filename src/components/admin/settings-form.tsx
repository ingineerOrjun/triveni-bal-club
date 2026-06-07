"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Save, CheckCircle2, AlertCircle } from "lucide-react";
import type { FormState } from "@/lib/forms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export interface SettingField {
  name: string;
  label: string;
  type?: "text" | "textarea" | "url";
  placeholder?: string;
  help?: string;
}
export interface SettingToggle {
  name: string;
  label: string;
}

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" disabled={pending}>
      <Save className="size-4" /> {pending ? "Saving…" : "Save"}
    </Button>
  );
}

export function SettingsForm({
  action,
  fields = [],
  toggles = [],
  values,
}: {
  action: Action;
  fields?: SettingField[];
  toggles?: SettingToggle[];
  values: Record<string, unknown>;
}) {
  const [state, formAction] = useActionState<FormState, FormData>(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-sp-3">
      <div className="grid gap-sp-3 sm:grid-cols-2">
        {fields.map((f) => {
          const value = (values[f.name] as string | undefined) ?? "";
          return (
            <div
              key={f.name}
              className={f.type === "textarea" ? "flex flex-col gap-1.5 sm:col-span-2" : "flex flex-col gap-1.5"}
            >
              <Label htmlFor={f.name}>{f.label}</Label>
              {f.type === "textarea" ? (
                <Textarea id={f.name} name={f.name} rows={3} defaultValue={value} placeholder={f.placeholder} />
              ) : (
                <Input
                  id={f.name}
                  name={f.name}
                  type={f.type === "url" ? "url" : "text"}
                  defaultValue={value}
                  placeholder={f.placeholder}
                />
              )}
              {f.help ? <p className="text-caption text-soft">{f.help}</p> : null}
            </div>
          );
        })}
      </div>

      {toggles.length > 0 ? (
        <div className="flex flex-col gap-2">
          {toggles.map((t) => (
            <label key={t.name} className="flex items-center gap-2 text-body text-ink">
              <input
                type="checkbox"
                name={t.name}
                defaultChecked={Boolean(values[t.name])}
                className="size-5 rounded accent-[var(--primary)]"
              />
              {t.label}
            </label>
          ))}
        </div>
      ) : null}

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
