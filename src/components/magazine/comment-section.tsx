"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { MessageSquare, Send, AlertCircle, CheckCircle2 } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import type { FormState } from "@/lib/forms";
import type { CommentView } from "@/lib/magazine/queries";
import { addComment } from "@/lib/magazine/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FieldError } from "@/components/shared/field-error";

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" disabled={pending}>
      <Send className="size-4" /> {pending ? "Posting…" : "Post comment"}
    </Button>
  );
}

/** Approved comment list + a moderated submission form (PART 8 / PART 16). */
export function CommentSection({
  articleId,
  comments,
  canComment,
}: {
  articleId: string;
  comments: CommentView[];
  canComment: boolean;
}) {
  const [state, formAction] = useActionState<FormState, FormData>(addComment, {});

  return (
    <section className="container-page py-sp-5" aria-labelledby="comments-heading">
      <h2 id="comments-heading" className="mb-sp-3 flex items-center gap-2 text-h2 font-bold text-ink">
        <MessageSquare className="size-6 text-primary-active" /> Comments
        <span className="text-lead font-normal text-soft">({comments.length})</span>
      </h2>

      {canComment ? (
        <form action={formAction} className="mb-sp-4 flex flex-col gap-2" noValidate>
          <input type="hidden" name="article_id" value={articleId} />
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
          <Textarea
            name="content"
            rows={3}
            placeholder="Share a thoughtful comment…"
            aria-label="Your comment"
            aria-invalid={Boolean(state.fieldErrors?.content)}
          />
          <FieldError id="content" message={state.fieldErrors?.content} />
          <div className="flex justify-end"><SubmitButton /></div>
        </form>
      ) : (
        <p className="mb-sp-4 rounded-md border border-line bg-surface p-sp-3 text-body text-soft">
          <a href="/auth/login" className="font-semibold text-primary-active underline">Sign in</a> to join the conversation.
        </p>
      )}

      {comments.length === 0 ? (
        <p className="text-body text-soft">No comments yet — be the first to respond.</p>
      ) : (
        <ul className="flex flex-col gap-sp-3">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-3">
              <Avatar size="sm">
                {c.authorAvatar ? <AvatarImage src={c.authorAvatar} alt="" /> : null}
                <AvatarFallback>{initials(c.authorName ?? "Member")}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 rounded-md border border-line bg-surface p-sp-2">
                <p className="flex flex-wrap items-center gap-x-2 text-caption">
                  <span className="font-heading font-bold text-ink">{c.authorName ?? "Member"}</span>
                  <span className="text-soft">{formatDateTime(c.created_at)}</span>
                </p>
                <p className="mt-1 whitespace-pre-wrap text-body text-ink">{c.content}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
