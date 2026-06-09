"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Plus, ArrowUp, ArrowDown, Trash2, ExternalLink } from "lucide-react";
import type { FormState } from "@/lib/forms";
import type { CmsMenuRow, CmsMenuItemRow } from "@/types/database";
import { createMenu, addMenuItem, deleteMenuItem, moveMenuItem } from "@/lib/cms/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActionButton } from "@/components/shared/action-button";

export interface MenuWithItems {
  menu: CmsMenuRow;
  items: CmsMenuItemRow[];
}

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" size="sm" disabled={pending}>
      <Plus className="size-4" /> {pending ? "Saving…" : label}
    </Button>
  );
}

function CreateMenuForm() {
  const [state, action] = useActionState<FormState, FormData>(createMenu, {});
  return (
    <form action={action} className="flex flex-wrap items-end gap-sp-2">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="menu-name">Menu name</Label>
        <Input id="menu-name" name="name" placeholder="e.g. Header" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="menu-loc">Location key</Label>
        <Input id="menu-loc" name="location" placeholder="header" />
      </div>
      <Submit label="Create menu" />
      {state.error ? <p role="alert" className="text-caption text-danger sm:basis-full">{state.error}</p> : null}
    </form>
  );
}

function AddItemForm({ menuId }: { menuId: string }) {
  const [state, action] = useActionState<FormState, FormData>(addMenuItem.bind(null, menuId), {});
  return (
    <form action={action} className="flex flex-wrap items-end gap-sp-2">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`label-${menuId}`}>Label</Label>
        <Input id={`label-${menuId}`} name="label" placeholder="About" className="w-40" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`href-${menuId}`}>Link</Label>
        <Input id={`href-${menuId}`} name="href" placeholder="/about" className="w-48" />
      </div>
      <label className="flex items-center gap-1.5 text-caption text-ink">
        <input type="checkbox" name="new_tab" className="size-4 accent-[var(--primary)]" /> New tab
      </label>
      <Submit label="Add link" />
      {state.error ? <p role="alert" className="text-caption text-danger sm:basis-full">{state.error}</p> : null}
    </form>
  );
}

export function MenuManager({ menus }: { menus: MenuWithItems[] }) {
  return (
    <div className="flex flex-col gap-sp-4">
      <Card>
        <CardHeader>
          <CardTitle>New menu</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateMenuForm />
        </CardContent>
      </Card>

      {menus.map(({ menu, items }) => (
        <Card key={menu.id}>
          <CardHeader>
            <CardTitle>
              {menu.name}{" "}
              <span className="font-mono text-caption font-normal text-soft">/{menu.location}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-sp-3">
            {items.length === 0 ? (
              <p className="text-body text-soft">No links yet.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-line">
                {items.map((it, i) => (
                  <li key={it.id} className="flex items-center justify-between gap-2 py-2">
                    <span className="min-w-0">
                      <span className="font-semibold text-ink">{it.label}</span>
                      <span className="ml-2 inline-flex items-center gap-1 text-caption text-soft">
                        {it.href}
                        {it.new_tab ? <ExternalLink className="size-3" /> : null}
                      </span>
                    </span>
                    <span className="flex items-center gap-1">
                      <ActionButton action={moveMenuItem.bind(null, it.id, "up")} variant="ghost" size="sm">
                        <ArrowUp className="size-4" />
                      </ActionButton>
                      <ActionButton action={moveMenuItem.bind(null, it.id, "down")} variant="ghost" size="sm">
                        <ArrowDown className="size-4" />
                      </ActionButton>
                      <ActionButton action={deleteMenuItem.bind(null, it.id)} variant="ghost" size="sm">
                        <Trash2 className="size-4 text-danger" />
                      </ActionButton>
                    </span>
                    {/* index reserved for future drag handles */}
                    <span className="sr-only">{i + 1}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="border-t border-line pt-sp-3">
              <AddItemForm menuId={menu.id} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
