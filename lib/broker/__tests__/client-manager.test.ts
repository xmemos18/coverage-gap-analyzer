/**
 * Client Manager Tests
 */

import { type ShareableScenario } from '@/lib/sharing';
import {
  getClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
  addClientScenario,
  updateClientScenario,
  deleteClientScenario,
  searchClients,
  getAllTags,
  getClientStats,
  exportClients,
  importClients,
  clearAllClients,
  getClientDisplayName,
  getClientInitials,
  STATUS_DISPLAY_NAMES,
  STATUS_COLORS,
  type BrokerClient,
  type ClientStatus,
} from '../client-manager';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('Client Manager', () => {
  const createTestScenario = (): ShareableScenario => ({
    v: 1,
    zip: '90210',
    state: 'CA',
    adults: 2,
    children: 1,
    ages: [35, 33, 5],
    chronic: false,
    tobacco: false,
    prescriptions: 2,
    doctorVisits: 4,
    specialistVisits: 1,
    income: 75000,
    priority: 'balanced',
    planType: 'any',
    hasEmployer: false,
  });

  beforeEach(() => {
    localStorageMock.clear();
  });

  describe('createClient', () => {
    it('should create a new client', () => {
      const client = createClient({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        tags: ['family'],
        status: 'active',
      });

      expect(client.id).toBeDefined();
      expect(client.id).toMatch(/^client_/);
      expect(client.firstName).toBe('John');
      expect(client.lastName).toBe('Doe');
      expect(client.status).toBe('active');
      expect(client.scenarios).toEqual([]);
    });

    it('should set createdAt and updatedAt', () => {
      const before = Date.now();
      const client = createClient({
        firstName: 'Jane',
        lastName: 'Doe',
        tags: [],
        status: 'prospect',
      });
      const after = Date.now();

      expect(client.createdAt).toBeGreaterThanOrEqual(before);
      expect(client.createdAt).toBeLessThanOrEqual(after);
      expect(client.updatedAt).toBeGreaterThanOrEqual(before);
    });
  });

  describe('getClients', () => {
    it('should return empty array when no clients', () => {
      expect(getClients()).toEqual([]);
    });

    it('should return all clients', () => {
      createClient({ firstName: 'A', lastName: 'Client', tags: [], status: 'active' });
      createClient({ firstName: 'B', lastName: 'Client', tags: [], status: 'active' });

      expect(getClients().length).toBe(2);
    });

    it('should return clients sorted by updatedAt', async () => {
      createClient({ firstName: 'First', lastName: 'Client', tags: [], status: 'active' });
      await new Promise((r) => setTimeout(r, 10));
      createClient({ firstName: 'Second', lastName: 'Client', tags: [], status: 'active' });

      const clients = getClients();
      expect(clients[0].firstName).toBe('Second');
    });
  });

  describe('getClient', () => {
    it('should get client by ID', () => {
      const created = createClient({
        firstName: 'John',
        lastName: 'Doe',
        tags: [],
        status: 'active',
      });

      const found = getClient(created.id);
      expect(found).not.toBeNull();
      expect(found?.firstName).toBe('John');
    });

    it('should return null for non-existent ID', () => {
      expect(getClient('non-existent')).toBeNull();
    });
  });

  describe('updateClient', () => {
    it('should update client fields', () => {
      const client = createClient({
        firstName: 'John',
        lastName: 'Doe',
        tags: [],
        status: 'prospect',
      });

      const updated = updateClient(client.id, {
        status: 'active',
        notes: 'Became a client',
      });

      expect(updated?.status).toBe('active');
      expect(updated?.notes).toBe('Became a client');
    });

    it('should update updatedAt', async () => {
      const client = createClient({
        firstName: 'John',
        lastName: 'Doe',
        tags: [],
        status: 'active',
      });

      await new Promise((r) => setTimeout(r, 10));
      const updated = updateClient(client.id, { notes: 'Updated' });

      expect(updated?.updatedAt).toBeGreaterThan(client.createdAt);
    });

    it('should return null for non-existent client', () => {
      expect(updateClient('non-existent', { notes: 'test' })).toBeNull();
    });
  });

  describe('deleteClient', () => {
    it('should delete existing client', () => {
      const client = createClient({
        firstName: 'John',
        lastName: 'Doe',
        tags: [],
        status: 'active',
      });

      expect(deleteClient(client.id)).toBe(true);
      expect(getClient(client.id)).toBeNull();
    });

    it('should return false for non-existent client', () => {
      expect(deleteClient('non-existent')).toBe(false);
    });
  });

  describe('Client Scenarios', () => {
    it('should add scenario to client', () => {
      const client = createClient({
        firstName: 'John',
        lastName: 'Doe',
        tags: [],
        status: 'active',
      });

      const scenario = createTestScenario();
      const added = addClientScenario(client.id, scenario, 'Family Coverage');

      expect(added).not.toBeNull();
      expect(added?.name).toBe('Family Coverage');
      expect(added?.scenario).toEqual(scenario);

      const updated = getClient(client.id);
      expect(updated?.scenarios.length).toBe(1);
    });

    it('should update scenario', () => {
      const client = createClient({
        firstName: 'John',
        lastName: 'Doe',
        tags: [],
        status: 'active',
      });

      const added = addClientScenario(client.id, createTestScenario(), 'Original');
      const updated = updateClientScenario(client.id, added!.id, {
        name: 'Updated Name',
        recommendedPlan: 'Silver PPO',
      });

      expect(updated?.name).toBe('Updated Name');
      expect(updated?.recommendedPlan).toBe('Silver PPO');
    });

    it('should delete scenario', () => {
      const client = createClient({
        firstName: 'John',
        lastName: 'Doe',
        tags: [],
        status: 'active',
      });

      const added = addClientScenario(client.id, createTestScenario(), 'Test');
      expect(deleteClientScenario(client.id, added!.id)).toBe(true);

      const updated = getClient(client.id);
      expect(updated?.scenarios.length).toBe(0);
    });
  });

  describe('searchClients', () => {
    beforeEach(() => {
      createClient({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        tags: ['family', 'premium'],
        status: 'active',
      });
      createClient({
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        tags: ['individual'],
        status: 'prospect',
      });
      createClient({
        firstName: 'Bob',
        lastName: 'Wilson',
        tags: ['family'],
        status: 'inactive',
      });
    });

    it('should search by name', () => {
      const results = searchClients({ search: 'john' });
      expect(results.length).toBe(1);
      expect(results[0].firstName).toBe('John');
    });

    it('should search by email', () => {
      const results = searchClients({ search: 'jane@example' });
      expect(results.length).toBe(1);
      expect(results[0].firstName).toBe('Jane');
    });

    it('should filter by status', () => {
      const results = searchClients({ status: 'active' });
      expect(results.length).toBe(1);
      expect(results[0].firstName).toBe('John');
    });

    it('should filter by tags', () => {
      const results = searchClients({ tags: ['family'] });
      expect(results.length).toBe(2);
    });

    it('should filter by hasScenarios', () => {
      const clients = getClients();
      addClientScenario(clients[0].id, createTestScenario(), 'Test');

      const withScenarios = searchClients({ hasScenarios: true });
      expect(withScenarios.length).toBe(1);

      const withoutScenarios = searchClients({ hasScenarios: false });
      expect(withoutScenarios.length).toBe(2);
    });

    it('should combine filters', () => {
      const results = searchClients({ status: 'active', tags: ['premium'] });
      expect(results.length).toBe(1);
      expect(results[0].firstName).toBe('John');
    });
  });

  describe('getAllTags', () => {
    it('should return unique tags', () => {
      createClient({
        firstName: 'A',
        lastName: 'Client',
        tags: ['family', 'premium'],
        status: 'active',
      });
      createClient({
        firstName: 'B',
        lastName: 'Client',
        tags: ['individual', 'premium'],
        status: 'active',
      });

      const tags = getAllTags();
      expect(tags).toContain('family');
      expect(tags).toContain('premium');
      expect(tags).toContain('individual');
      expect(tags.length).toBe(3);
    });

    it('should return sorted tags', () => {
      createClient({ firstName: 'A', lastName: 'B', tags: ['z', 'a', 'm'], status: 'active' });

      const tags = getAllTags();
      expect(tags).toEqual(['a', 'm', 'z']);
    });
  });

  describe('getClientStats', () => {
    it('should calculate statistics', () => {
      createClient({ firstName: 'A', lastName: 'A', tags: [], status: 'active' });
      createClient({ firstName: 'B', lastName: 'B', tags: [], status: 'active' });
      createClient({ firstName: 'C', lastName: 'C', tags: [], status: 'prospect' });
      createClient({ firstName: 'D', lastName: 'D', tags: [], status: 'inactive' });

      const clients = getClients();
      addClientScenario(clients[0].id, createTestScenario(), 'Scenario 1');
      addClientScenario(clients[0].id, createTestScenario(), 'Scenario 2');
      addClientScenario(clients[1].id, createTestScenario(), 'Scenario 3');

      const stats = getClientStats();

      expect(stats.total).toBe(4);
      expect(stats.active).toBe(2);
      expect(stats.prospect).toBe(1);
      expect(stats.inactive).toBe(1);
      expect(stats.archived).toBe(0);
      expect(stats.withScenarios).toBe(2);
      expect(stats.totalScenarios).toBe(3);
    });
  });

  describe('Export/Import', () => {
    it('should export clients', () => {
      createClient({ firstName: 'John', lastName: 'Doe', tags: [], status: 'active' });

      const exported = exportClients();
      const data = JSON.parse(exported);

      expect(data.exportedAt).toBeDefined();
      expect(data.clients.length).toBe(1);
    });

    it('should import clients', () => {
      const client = createClient({
        firstName: 'John',
        lastName: 'Doe',
        tags: [],
        status: 'active',
      });
      const exported = exportClients();

      clearAllClients();
      expect(getClients().length).toBe(0);

      const result = importClients(exported);

      expect(result.imported).toBe(1);
      expect(result.errors).toEqual([]);
      expect(getClients().length).toBe(1);
    });

    it('should handle duplicate IDs on import', () => {
      createClient({ firstName: 'John', lastName: 'Doe', tags: [], status: 'active' });
      const exported = exportClients();

      // Import without clearing - should generate new ID
      const result = importClients(exported);

      expect(result.imported).toBe(1);
      expect(getClients().length).toBe(2);
    });
  });

  describe('Display Helpers', () => {
    it('should get display name', () => {
      const client = createClient({
        firstName: 'John',
        lastName: 'Doe',
        tags: [],
        status: 'active',
      });

      expect(getClientDisplayName(client)).toBe('John Doe');
    });

    it('should get initials', () => {
      const client = createClient({
        firstName: 'John',
        lastName: 'Doe',
        tags: [],
        status: 'active',
      });

      expect(getClientInitials(client)).toBe('JD');
    });

    it('should handle lowercase names for initials', () => {
      const client = createClient({
        firstName: 'john',
        lastName: 'doe',
        tags: [],
        status: 'active',
      });

      expect(getClientInitials(client)).toBe('JD');
    });
  });

  describe('Status Constants', () => {
    it('should have display names for all statuses', () => {
      const statuses: ClientStatus[] = ['active', 'inactive', 'prospect', 'archived'];

      for (const status of statuses) {
        expect(STATUS_DISPLAY_NAMES[status]).toBeDefined();
        expect(typeof STATUS_DISPLAY_NAMES[status]).toBe('string');
      }
    });

    it('should have colors for all statuses', () => {
      const statuses: ClientStatus[] = ['active', 'inactive', 'prospect', 'archived'];

      for (const status of statuses) {
        expect(STATUS_COLORS[status]).toBeDefined();
        expect(typeof STATUS_COLORS[status]).toBe('string');
      }
    });
  });

  describe('clearAllClients', () => {
    it('should remove all clients', () => {
      createClient({ firstName: 'A', lastName: 'A', tags: [], status: 'active' });
      createClient({ firstName: 'B', lastName: 'B', tags: [], status: 'active' });

      clearAllClients();

      expect(getClients()).toEqual([]);
    });
  });
});
