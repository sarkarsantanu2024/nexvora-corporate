// Server side: the sites the panel knows, demos plus the registered
// client sites from the store. Route handlers and server pages use these
// instead of calling getSchema directly, so a real client's site resolves
// exactly like a demo.

import { getSchema, allSites } from "./schemas";
import { getStore } from "./store";
import type { ClientSite, SiteSchema } from "./types";

export async function loadClients(): Promise<ClientSite[]> {
  const store = getStore();
  if (!store) return [];
  try {
    return await store.listSites();
  } catch {
    return [];
  }
}

export async function resolveSchema(site: string): Promise<SiteSchema | null> {
  return getSchema(site, await loadClients());
}

export async function resolveAllSites(): Promise<SiteSchema[]> {
  return allSites(await loadClients());
}
