/**
 * Broker Client Manager
 *
 * Provides utilities for managing broker clients and their coverage scenarios.
 */

import { type ShareableScenario } from '@/lib/sharing';

/**
 * Client profile
 */
export interface BrokerClient {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  createdAt: number;
  updatedAt: number;
  notes?: string;
  tags: string[];
  status: ClientStatus;
  scenarios: ClientScenario[];
}

/**
 * Client status options
 */
export type ClientStatus = 'active' | 'inactive' | 'prospect' | 'archived';

/**
 * Client scenario with analysis
 */
export interface ClientScenario {
  id: string;
  name: string;
  scenario: ShareableScenario;
  createdAt: number;
  updatedAt: number;
  recommendedPlan?: string;
  estimatedCost?: {
    low: number;
    high: number;
  };
  notes?: string;
}

/**
 * Client search filters
 */
export interface ClientFilters {
  search?: string;
  status?: ClientStatus;
  tags?: string[];
  hasScenarios?: boolean;
}

/**
 * Storage key
 */
const STORAGE_KEY = 'broker_clients';

/**
 * Generate unique client ID
 */
function generateClientId(): string {
  return `client_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Generate unique scenario ID
 */
function generateScenarioId(): string {
  return `scn_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Get all clients from storage
 */
export function getClients(): BrokerClient[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const clients = JSON.parse(stored) as BrokerClient[];
    return clients.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

/**
 * Get a single client by ID
 */
export function getClient(id: string): BrokerClient | null {
  const clients = getClients();
  return clients.find((c) => c.id === id) || null;
}

/**
 * Create a new client
 */
export function createClient(
  data: Omit<BrokerClient, 'id' | 'createdAt' | 'updatedAt' | 'scenarios'>
): BrokerClient {
  if (typeof window === 'undefined') {
    throw new Error('createClient is only available in browser environments');
  }

  const now = Date.now();
  const client: BrokerClient = {
    ...data,
    id: generateClientId(),
    createdAt: now,
    updatedAt: now,
    scenarios: [],
  };

  const clients = getClients();
  clients.push(client);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));

  return client;
}

/**
 * Update an existing client
 */
export function updateClient(
  id: string,
  updates: Partial<Omit<BrokerClient, 'id' | 'createdAt' | 'scenarios'>>
): BrokerClient | null {
  if (typeof window === 'undefined') {
    throw new Error('updateClient is only available in browser environments');
  }

  const clients = getClients();
  const index = clients.findIndex((c) => c.id === id);

  if (index === -1) return null;

  const existing = clients[index];
  if (!existing) return null;

  const updated: BrokerClient = {
    ...existing,
    ...updates,
    updatedAt: Date.now(),
  };

  clients[index] = updated;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));

  return updated;
}

/**
 * Delete a client
 */
export function deleteClient(id: string): boolean {
  if (typeof window === 'undefined') {
    throw new Error('deleteClient is only available in browser environments');
  }

  const clients = getClients();
  const filtered = clients.filter((c) => c.id !== id);

  if (filtered.length === clients.length) return false;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

/**
 * Add a scenario to a client
 */
export function addClientScenario(
  clientId: string,
  scenario: ShareableScenario,
  name: string,
  notes?: string
): ClientScenario | null {
  if (typeof window === 'undefined') {
    throw new Error('addClientScenario is only available in browser environments');
  }

  const clients = getClients();
  const index = clients.findIndex((c) => c.id === clientId);

  if (index === -1) return null;

  const client = clients[index];
  if (!client) return null;

  const now = Date.now();
  const newScenario: ClientScenario = {
    id: generateScenarioId(),
    name,
    scenario,
    createdAt: now,
    updatedAt: now,
    notes,
  };

  client.scenarios.push(newScenario);
  client.updatedAt = now;

  clients[index] = client;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));

  return newScenario;
}

/**
 * Update a client scenario
 */
export function updateClientScenario(
  clientId: string,
  scenarioId: string,
  updates: Partial<Omit<ClientScenario, 'id' | 'createdAt'>>
): ClientScenario | null {
  if (typeof window === 'undefined') {
    throw new Error('updateClientScenario is only available in browser environments');
  }

  const clients = getClients();
  const clientIndex = clients.findIndex((c) => c.id === clientId);

  if (clientIndex === -1) return null;

  const client = clients[clientIndex];
  if (!client) return null;

  const scenarioIndex = client.scenarios.findIndex((s) => s.id === scenarioId);
  if (scenarioIndex === -1) return null;

  const existing = client.scenarios[scenarioIndex];
  if (!existing) return null;

  const updated: ClientScenario = {
    ...existing,
    ...updates,
    updatedAt: Date.now(),
  };

  client.scenarios[scenarioIndex] = updated;
  client.updatedAt = Date.now();

  clients[clientIndex] = client;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));

  return updated;
}

/**
 * Delete a client scenario
 */
export function deleteClientScenario(clientId: string, scenarioId: string): boolean {
  if (typeof window === 'undefined') {
    throw new Error('deleteClientScenario is only available in browser environments');
  }

  const clients = getClients();
  const clientIndex = clients.findIndex((c) => c.id === clientId);

  if (clientIndex === -1) return false;

  const client = clients[clientIndex];
  if (!client) return false;

  const originalLength = client.scenarios.length;
  client.scenarios = client.scenarios.filter((s) => s.id !== scenarioId);

  if (client.scenarios.length === originalLength) return false;

  client.updatedAt = Date.now();

  clients[clientIndex] = client;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));

  return true;
}

/**
 * Search and filter clients
 */
export function searchClients(filters: ClientFilters): BrokerClient[] {
  let clients = getClients();

  // Text search
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    clients = clients.filter(
      (c) =>
        c.firstName.toLowerCase().includes(searchLower) ||
        c.lastName.toLowerCase().includes(searchLower) ||
        c.email?.toLowerCase().includes(searchLower) ||
        c.notes?.toLowerCase().includes(searchLower)
    );
  }

  // Status filter
  if (filters.status) {
    clients = clients.filter((c) => c.status === filters.status);
  }

  // Tags filter
  if (filters.tags && filters.tags.length > 0) {
    clients = clients.filter((c) =>
      filters.tags!.some((tag) => c.tags.includes(tag))
    );
  }

  // Has scenarios filter
  if (filters.hasScenarios !== undefined) {
    clients = clients.filter((c) =>
      filters.hasScenarios ? c.scenarios.length > 0 : c.scenarios.length === 0
    );
  }

  return clients;
}

/**
 * Get all unique tags
 */
export function getAllTags(): string[] {
  const clients = getClients();
  const tagSet = new Set<string>();

  for (const client of clients) {
    for (const tag of client.tags) {
      tagSet.add(tag);
    }
  }

  return Array.from(tagSet).sort();
}

/**
 * Get client statistics
 */
export function getClientStats(): {
  total: number;
  active: number;
  inactive: number;
  prospect: number;
  archived: number;
  withScenarios: number;
  totalScenarios: number;
} {
  const clients = getClients();

  return {
    total: clients.length,
    active: clients.filter((c) => c.status === 'active').length,
    inactive: clients.filter((c) => c.status === 'inactive').length,
    prospect: clients.filter((c) => c.status === 'prospect').length,
    archived: clients.filter((c) => c.status === 'archived').length,
    withScenarios: clients.filter((c) => c.scenarios.length > 0).length,
    totalScenarios: clients.reduce((sum, c) => sum + c.scenarios.length, 0),
  };
}

/**
 * Export all clients as JSON
 */
export function exportClients(): string {
  const clients = getClients();
  return JSON.stringify(
    {
      exportedAt: Date.now(),
      clients,
    },
    null,
    2
  );
}

/**
 * Import clients from JSON
 */
export function importClients(json: string): { imported: number; errors: string[] } {
  if (typeof window === 'undefined') {
    throw new Error('importClients is only available in browser environments');
  }

  const errors: string[] = [];
  let imported = 0;

  try {
    const data = JSON.parse(json) as { clients: BrokerClient[] };

    if (!Array.isArray(data.clients)) {
      errors.push('Invalid import format: clients must be an array');
      return { imported, errors };
    }

    const existing = getClients();
    const existingIds = new Set(existing.map((c) => c.id));

    for (const client of data.clients) {
      if (!client.id || !client.firstName || !client.lastName) {
        errors.push(`Skipped invalid client: ${client.firstName || 'unknown'} ${client.lastName || ''}`);
        continue;
      }

      if (existingIds.has(client.id)) {
        client.id = generateClientId();
      }

      existing.push(client);
      imported++;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch (error) {
    errors.push(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return { imported, errors };
}

/**
 * Clear all clients
 */
export function clearAllClients(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Get client display name
 */
export function getClientDisplayName(client: BrokerClient): string {
  return `${client.firstName} ${client.lastName}`;
}

/**
 * Get client initials
 */
export function getClientInitials(client: BrokerClient): string {
  const first = client.firstName.charAt(0).toUpperCase();
  const last = client.lastName.charAt(0).toUpperCase();
  return `${first}${last}`;
}

/**
 * Status display names
 */
export const STATUS_DISPLAY_NAMES: Record<ClientStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  prospect: 'Prospect',
  archived: 'Archived',
};

/**
 * Status colors for UI
 */
export const STATUS_COLORS: Record<ClientStatus, string> = {
  active: 'green',
  inactive: 'gray',
  prospect: 'blue',
  archived: 'red',
};
