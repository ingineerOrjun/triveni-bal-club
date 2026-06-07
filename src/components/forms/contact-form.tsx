"use client";

import * as React from "react";
import { Send, CheckCircle2 } from "lucide-react";
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

type FieldErrors = Partial<Record<"name" | "email" | "message", string>>;

/**
 * Contact form — UI only for Phase 3 (no backend). Validates on the client and
 * shows a confirmation. Wiring to a Server Action lands in a later phase.
 */
export function ContactForm() {
  const [errors, setErrors] = React.useState<FieldErrors>({});
  const [submitted, setSubmitted] = React.useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();

    const next: FieldErrors = {};
    if (!name) next.name = "Please enter your name.";
    if (!email) next.email = "Please enter your email.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      next.email = "Please enter a valid email address.";
    if (!message) next.message = "Please enter a message.";

    setErrors(next);
    if (Object.keys(next).length === 0) {
      setSubmitted(true);
      form.reset();
    }
  }

  if (submitted) {
    return (
      <div
        role="status"
        className="flex flex-col items-center gap-sp-2 rounded-lg border border-success/40 bg-success-bg/40 p-sp-4 text-center"
      >
        <CheckCircle2 className="size-12 text-emerald-700" />
        <h3 className="text-h3 font-bold text-ink">Thank you!</h3>
        <p className="max-w-sm text-body text-soft">
          Your message has been received. We&apos;ll get back to you soon.
        </p>
        <Button variant="ghost" onClick={() => setSubmitted(false)}>
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-sp-3">
      <div className="grid gap-sp-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">
            Name <span className="text-danger">*</span>
          </Label>
          <Input
            id="name"
            name="name"
            placeholder="Your full name"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "name-error" : undefined}
          />
          {errors.name ? (
            <p id="name-error" className="text-caption text-danger">
              {errors.name}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">
            Email <span className="text-danger">*</span>
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
          {errors.email ? (
            <p id="email-error" className="text-caption text-danger">
              {errors.email}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="topic">Topic</Label>
        <Select name="topic" defaultValue="general">
          <SelectTrigger id="topic">
            <SelectValue placeholder="Select a topic" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="general">General enquiry</SelectItem>
            <SelectItem value="join">Joining the club</SelectItem>
            <SelectItem value="activity">Activities & events</SelectItem>
            <SelectItem value="magazine">Magazine submission</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="message">
          Message <span className="text-danger">*</span>
        </Label>
        <Textarea
          id="message"
          name="message"
          rows={5}
          placeholder="How can we help?"
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? "message-error" : undefined}
        />
        {errors.message ? (
          <p id="message-error" className="text-caption text-danger">
            {errors.message}
          </p>
        ) : null}
      </div>

      <div>
        <Button type="submit" variant="primary" size="lg">
          <Send className="size-4" /> Send message
        </Button>
      </div>
      <p className="text-caption text-soft">
        <span className="text-danger">*</span> Required fields.
      </p>
    </form>
  );
}
