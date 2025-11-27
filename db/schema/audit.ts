/**
 * Audit and Versioning Schema
 * Track data changes, user actions, and maintain audit trails
 *
 * ============================================================================
 * RETENTION POLICY REQUIREMENTS
 * ============================================================================
 *
 * These tables will grow unbounded without a retention policy. Implement cleanup:
 *
 * 1. auditLog: Retain for 90 days minimum (regulatory compliance), archive after 1 year
 *    - Run: DELETE FROM audit_log WHERE timestamp < NOW() - INTERVAL '90 days'
 *    - Consider archiving to cold storage before deletion
 *
 * 2. apiCallLogs: Retain for 30 days (debugging), aggregate after 7 days
 *    - Run: DELETE FROM api_call_logs WHERE called_at < NOW() - INTERVAL '30 days'
 *    - Consider creating daily/hourly aggregates before deletion
 *
 * 3. analysisSessions: Retain for 90 days (analytics), anonymize older data
 *    - Sessions older than 90 days should be aggregated into monthly reports
 *    - Delete PII-adjacent fields (user_agent, ip_address_hash) after 30 days
 *
 * 4. systemHealthMetrics: Retain for 30 days at granular level, aggregate to hourly/daily
 *    - Keep hourly aggregates for 6 months
 *    - Keep daily aggregates for 2 years
 *
 * 5. dataQualityAlerts: No auto-delete, but close/archive resolved alerts after 90 days
 *    - Archive closed alerts annually
 *
 * 6. dataImports: Retain indefinitely (historical record), but clean logs field after 30 days
 *    - The import history itself should be preserved for audit purposes
 *
 * IMPLEMENTATION OPTIONS:
 * - PostgreSQL pg_cron extension for scheduled jobs
 * - Supabase Edge Functions with scheduled triggers
 * - External cron job calling cleanup API endpoint
 * - Drizzle ORM migration with cleanup script
 *
 * TODO: Implement automated retention policy with one of the above methods
 * ============================================================================
 */

import {
  pgTable,
  serial,
  varchar,
  integer,
  timestamp,
  boolean,
  jsonb,
  text,
  uuid,
} from 'drizzle-orm/pg-core';

/**
 * Data Change Audit Log
 * Tracks all modifications to critical tables
 */
export const auditLog = pgTable('audit_log', {
  id: serial('id').primaryKey(),
  auditId: uuid('audit_id').defaultRandom().notNull().unique(),

  // What changed
  tableName: varchar('table_name', { length: 100 }).notNull(),
  recordId: integer('record_id').notNull(),
  operation: varchar('operation', { length: 20 }).notNull(), // 'INSERT', 'UPDATE', 'DELETE'

  // Who made the change
  userId: varchar('user_id', { length: 100 }), // Admin user ID (if applicable)
  userEmail: varchar('user_email', { length: 255 }),
  ipAddress: varchar('ip_address', { length: 50 }),

  // What was changed
  oldValues: jsonb('old_values'), // Previous values (for UPDATE/DELETE)
  newValues: jsonb('new_values'), // New values (for INSERT/UPDATE)
  changedFields: jsonb('changed_fields'), // Array of field names that changed

  // Why/how it changed
  changeReason: text('change_reason'), // Optional explanation
  changeSource: varchar('change_source', { length: 100 }), // 'admin_panel', 'api', 'migration', 'import'

  // When
  timestamp: timestamp('timestamp').defaultNow().notNull(),

  // Additional context
  metadata: jsonb('metadata'), // Additional context (e.g., request ID, batch ID)
});

/**
 * Data Versions
 * Maintain versioned snapshots of critical data for rollback
 */
export const dataVersions = pgTable('data_versions', {
  id: serial('id').primaryKey(),
  versionId: uuid('version_id').defaultRandom().notNull().unique(),

  // Version metadata
  versionName: varchar('version_name', { length: 200 }).notNull(), // e.g., '2025-cost-update'
  description: text('description'),
  versionNumber: varchar('version_number', { length: 50 }).notNull(), // e.g., 'v1.2.0'

  // What data is versioned
  dataType: varchar('data_type', { length: 100 }).notNull(), // 'insurance_costs', 'state_data', etc.
  affectedTables: jsonb('affected_tables').notNull(), // Array of table names
  affectedStates: jsonb('affected_states'), // Array of state codes (if applicable)

  // Version status
  status: varchar('status', { length: 50 }).notNull(), // 'draft', 'active', 'archived', 'rollback'
  isProduction: boolean('is_production').default(false), // Is this the live version?

  // Dates
  createdAt: timestamp('created_at').defaultNow().notNull(),
  activatedAt: timestamp('activated_at'),
  deprecatedAt: timestamp('deprecated_at'),

  // Who created this version
  createdBy: varchar('created_by', { length: 100 }),

  // Data snapshot (for small datasets) or reference to backup
  dataSnapshot: jsonb('data_snapshot'), // Small data can be stored directly
  backupLocation: varchar('backup_location', { length: 500 }), // S3/file path for large datasets

  // Rollback information
  canRollback: boolean('can_rollback').default(true),
  rollbackInstructions: text('rollback_instructions'),

  // Validation
  isValidated: boolean('is_validated').default(false),
  validationErrors: jsonb('validation_errors'),

  metadata: jsonb('metadata'),
});

/**
 * User Analysis Sessions
 * Track user interactions with the calculator (privacy-respecting)
 */
export const analysisSessions = pgTable('analysis_sessions', {
  id: serial('id').primaryKey(),
  sessionId: uuid('session_id').defaultRandom().notNull().unique(),

  // Session metadata (NO PII)
  userAgent: varchar('user_agent', { length: 500 }),
  ipAddressHash: varchar('ip_address_hash', { length: 64 }), // Hashed for privacy
  referrer: varchar('referrer', { length: 500 }),

  // Calculator inputs (anonymized)
  states: jsonb('states').notNull(), // Array of state codes used
  householdSize: integer('household_size'),
  ageRanges: jsonb('age_ranges'), // Age buckets, not exact ages
  hasTobaccoUsers: boolean('has_tobacco_users'),
  hasEmployerInsurance: boolean('has_employer_insurance'),

  // Income bracket (no exact income stored)
  incomeBracket: varchar('income_bracket', { length: 50 }), // 'under_30k', '30k-50k', etc.

  // Health profile (aggregated)
  chronicConditionCount: integer('chronic_condition_count'),
  prescriptionCount: varchar('prescription_count', { length: 20 }), // 'none', '1-3', '4+'
  providerPreference: varchar('provider_preference', { length: 50 }),

  // Recommendation given
  recommendationType: varchar('recommendation_type', { length: 100 }), // 'medicare', 'aca_marketplace', etc.
  estimatedCostRange: varchar('estimated_cost_range', { length: 50 }),
  subsidyEligible: boolean('subsidy_eligible'),

  // User behavior
  calculatorCompletionRate: integer('calculator_completion_rate'), // 0-100%
  stepsCompleted: integer('steps_completed'),
  timeSpentOnCalculator: integer('time_spent_on_calculator'), // seconds
  resultsViewed: boolean('results_viewed').default(false),
  resultsPrinted: boolean('results_printed').default(false),
  resultsShared: boolean('results_shared').default(false),

  // Errors encountered
  errorsEncountered: jsonb('errors_encountered'),

  // Timestamps
  sessionStarted: timestamp('session_started').defaultNow().notNull(),
  sessionEnded: timestamp('session_ended'),

  // For analytics (no PII)
  deviceType: varchar('device_type', { length: 50 }), // 'desktop', 'mobile', 'tablet'
  browserType: varchar('browser_type', { length: 50 }),
});

/**
 * API Call Logs
 * Track external API calls (Healthcare.gov, Medicare.gov)
 */
export const apiCallLogs = pgTable('api_call_logs', {
  id: serial('id').primaryKey(),
  callId: uuid('call_id').defaultRandom().notNull().unique(),

  // API details
  apiName: varchar('api_name', { length: 100 }).notNull(), // 'healthcare_gov', 'medicare_gov'
  endpoint: varchar('endpoint', { length: 500 }).notNull(),
  method: varchar('method', { length: 10 }).notNull(), // 'GET', 'POST'

  // Request
  requestParams: jsonb('request_params'),
  requestHeaders: jsonb('request_headers'),

  // Response
  statusCode: integer('status_code').notNull(),
  responseTime: integer('response_time'), // milliseconds
  success: boolean('success').notNull(),

  // Error details (if failed)
  errorMessage: text('error_message'),
  errorCode: varchar('error_code', { length: 100 }),

  // Caching
  cacheHit: boolean('cache_hit').default(false),
  cacheTTL: integer('cache_ttl'), // seconds

  // Rate limiting
  rateLimitRemaining: integer('rate_limit_remaining'),
  rateLimitReset: timestamp('rate_limit_reset'),

  // Timestamps
  calledAt: timestamp('called_at').defaultNow().notNull(),

  // Session association (optional)
  sessionId: uuid('session_id'),

  // Cost tracking (some APIs charge per call)
  estimatedCost: varchar('estimated_cost', { length: 20 }), // e.g., '$0.001'
});

/**
 * Data Quality Alerts
 * Flag outdated or suspicious data
 */
export const dataQualityAlerts = pgTable('data_quality_alerts', {
  id: serial('id').primaryKey(),
  alertId: uuid('alert_id').defaultRandom().notNull().unique(),

  // Alert details
  severity: varchar('severity', { length: 20 }).notNull(), // 'info', 'warning', 'error', 'critical'
  alertType: varchar('alert_type', { length: 100 }).notNull(), // 'outdated_data', 'missing_data', 'anomaly'
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description').notNull(),

  // What data is affected
  tableName: varchar('table_name', { length: 100 }).notNull(),
  affectedRecords: jsonb('affected_records'), // Array of record IDs
  affectedStates: jsonb('affected_states'),

  // Detection
  detectedAt: timestamp('detected_at').defaultNow().notNull(),
  detectionMethod: varchar('detection_method', { length: 100 }), // 'automated', 'manual_review'

  // Resolution
  status: varchar('status', { length: 50 }).notNull(), // 'open', 'investigating', 'resolved', 'ignored'
  resolvedAt: timestamp('resolved_at'),
  resolvedBy: varchar('resolved_by', { length: 100 }),
  resolutionNotes: text('resolution_notes'),

  // Action items
  actionRequired: boolean('action_required').default(false),
  suggestedAction: text('suggested_action'),

  // Notification
  notificationSent: boolean('notification_sent').default(false),
  notifiedUsers: jsonb('notified_users'),

  metadata: jsonb('metadata'),
});

/**
 * System Health Metrics
 * Track application performance and health
 */
export const systemHealthMetrics = pgTable('system_health_metrics', {
  id: serial('id').primaryKey(),
  metricId: uuid('metric_id').defaultRandom().notNull().unique(),

  // Metric details
  metricName: varchar('metric_name', { length: 100 }).notNull(),
  metricValue: varchar('metric_value', { length: 100 }).notNull(),
  metricUnit: varchar('metric_unit', { length: 50 }), // 'ms', 'mb', 'count', '%'

  // Categorization
  category: varchar('category', { length: 50 }).notNull(), // 'performance', 'availability', 'errors', 'usage'

  // Thresholds
  threshold: varchar('threshold', { length: 100 }),
  exceededThreshold: boolean('exceeded_threshold').default(false),

  // Context
  environment: varchar('environment', { length: 50 }), // 'production', 'staging', 'development'
  serverRegion: varchar('server_region', { length: 50 }),

  // Timestamp
  recordedAt: timestamp('recorded_at').defaultNow().notNull(),

  metadata: jsonb('metadata'),
});

/**
 * Data Import History
 * Track bulk data imports from CMS, state exchanges, etc.
 */
export const dataImports = pgTable('data_imports', {
  id: serial('id').primaryKey(),
  importId: uuid('import_id').defaultRandom().notNull().unique(),

  // Import details
  importName: varchar('import_name', { length: 200 }).notNull(),
  dataSource: varchar('data_source', { length: 200 }).notNull(), // 'CMS_SLCSP_2025', etc.
  dataType: varchar('data_type', { length: 100 }).notNull(), // 'aca_plans', 'slcsp', etc.

  // File details
  fileName: varchar('file_name', { length: 500 }),
  fileSize: varchar('file_size', { length: 50 }), // e.g., '25.3 MB'
  fileHash: varchar('file_hash', { length: 64 }), // SHA-256 for verification

  // Import execution
  status: varchar('status', { length: 50 }).notNull(), // 'pending', 'processing', 'completed', 'failed'
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  processingTime: integer('processing_time'), // seconds

  // Results
  rowsProcessed: integer('rows_processed'),
  rowsImported: integer('rows_imported'),
  rowsSkipped: integer('rows_skipped'),
  rowsFailed: integer('rows_failed'),

  // Validation
  validationErrors: jsonb('validation_errors'),
  warnings: jsonb('warnings'),

  // Import parameters
  importParams: jsonb('import_params'), // Configuration used for import
  targetTables: jsonb('target_tables'), // Array of table names populated

  // Execution details
  importedBy: varchar('imported_by', { length: 100 }),
  importMethod: varchar('import_method', { length: 50 }), // 'manual', 'automated', 'api'

  // Rollback capability
  canRollback: boolean('can_rollback').default(true),
  rollbackScript: text('rollback_script'),
  rolledBack: boolean('rolled_back').default(false),
  rolledBackAt: timestamp('rolled_back_at'),

  logs: text('logs'), // Detailed import logs
  metadata: jsonb('metadata'),
});
