/**
 * Broker Module
 *
 * Exports broker client management utilities.
 */

export {
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
  type ClientScenario,
  type ClientFilters,
} from './client-manager';
