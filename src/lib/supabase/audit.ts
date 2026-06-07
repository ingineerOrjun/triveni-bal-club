import "server-only";

/**
 * Append an audit-log entry via the SECURITY DEFINER `log_audit` function.
 * Best-effort: failures are swallowed so they never block the user action.
 *
 * `client` is accepted structurally (typed `unknown` then narrowed) because the
 * `SupabaseClient` generic signature — and the generated vs. hand-authored
 * `Functions` typings — differ across supabase-js versions.
 */
type RpcFn = (
  fn: string,
  args: Record<string, unknown>
) => PromiseLike<{ error: unknown }>;

export async function logAudit(
  client: unknown,
  action: string,
  entityType: string,
  entityId: string | null = null,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  const rpc = (client as { rpc: RpcFn }).rpc.bind(client) as RpcFn;

  try {
    await rpc("log_audit", {
      p_action: action,
      p_entity_type: entityType,
      p_entity_id: entityId,
      p_metadata: metadata,
    });
  } catch {
    // Never let audit logging break the primary operation.
  }
}
