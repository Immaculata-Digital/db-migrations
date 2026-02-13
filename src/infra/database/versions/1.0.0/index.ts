import type { Migration } from '../../migrations/Migration'
import { addTenantsToAllSchemas20260213001 } from './TASK-0001__20260213001-add-tenants-to-all-schemas'
import { enableRlsAndTenantPolicies20260213002 } from './TASK-0002__20260213002-enable-rls-and-tenant-policies'

export const migrations: Migration[] = [
    addTenantsToAllSchemas20260213001,
    enableRlsAndTenantPolicies20260213002,
]
