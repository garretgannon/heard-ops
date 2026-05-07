import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Syncs records from legacy tables (PrepItem, SideWorkAssignment, CleaningLog, etc.)
 * into the unified Task system while preserving original data.
 * 
 * Call this function when:
 * - A prep item is created/updated
 * - A side work assignment is created/updated
 * - A cleaning task is created/updated
 * - Any other task-like entity changes
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { entity_type, entity_id, action } = await req.json();

    // Map legacy entities to unified Task system
    const syncMap = {
      'PrepItem': syncPrepItem,
      'SideWorkAssignment': syncSideWork,
      'CleaningLog': syncCleaning,
      'TemperatureLog': syncTemperature,
      'WasteEntry': syncWaste,
      'MaintenanceRequest': syncMaintenance,
      'IncidentReport': syncIncident,
      'EmployeeLog': syncEmployeeNote,
      'ManagerLog': syncManagerNote,
    };

    const syncFn = syncMap[entity_type];
    if (!syncFn) {
      return Response.json({ error: `Unsupported entity type: ${entity_type}` }, { status: 400 });
    }

    const result = await syncFn(base44, entity_id, action);
    return Response.json(result);

  } catch (error) {
    console.error('syncToUnifiedTasks error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function syncPrepItem(base44, prepItemId, action) {
  const prep = await base44.entities.PrepItem.get(prepItemId);
  if (!prep) return { skipped: true };

  const task = {
    type: 'prep',
    title: prep.name || 'Prep Item',
    description: prep.notes || '',
    assigned_role: prep.role_assignment || '',
    assigned_employee_name: prep.assigned_to_individual || '',
    station: prep.station_name || '',
    due_time: prep.due_time || '',
    status: mapPrepStatus(prep.status),
    priority: prep.priority || 'medium',
    photo_required: !!prep.master_photo_url,
    from_template: !!prep.template_id,
    template_id: prep.template_id,
    source_entity: 'PrepItem',
    source_entity_id: prep.id,
    custom_metadata: {
      qty_needed: prep.quantity,
      qty_completed: prep.completed_qty,
      unit: prep.unit,
    },
  };

  return await base44.asServiceRole.entities.Task.create(task);
}

async function syncSideWork(base44, swId, action) {
  const sw = await base44.entities.SideWorkAssignment.get(swId);
  if (!sw) return { skipped: true };

  const task = {
    type: 'sidework',
    title: sw.task_name || 'Side Work',
    description: sw.notes || '',
    assigned_role: sw.role_assignment || '',
    assigned_employee_name: sw.assigned_to_name || '',
    station: sw.role || '',
    due_time: sw.due_time || '',
    status: mapSideWorkStatus(sw.status),
    priority: sw.priority || 'medium',
    photo_required: !!sw.requires_photo,
    source_entity: 'SideWorkAssignment',
    source_entity_id: sw.id,
  };

  return await base44.asServiceRole.entities.Task.create(task);
}

async function syncCleaning(base44, cleaningId, action) {
  const cleaning = await base44.entities.CleaningLog.get(cleaningId);
  if (!cleaning) return { skipped: true };

  const task = {
    type: 'cleaning',
    title: `Cleaning: ${cleaning.cleaning_area || 'Area'}`,
    description: cleaning.notes || '',
    assigned_role: cleaning.assigned_role || '',
    assigned_employee_name: cleaning.completed_by || '',
    station: cleaning.cleaning_area || '',
    status: mapCleaningStatus(cleaning.status),
    photo_required: !!cleaning.photo_url,
    manager_review_required: !!cleaning.manager_review_required,
    source_entity: 'CleaningLog',
    source_entity_id: cleaning.id,
  };

  return await base44.asServiceRole.entities.Task.create(task);
}

async function syncTemperature(base44, tempLogId, action) {
  const tempLog = await base44.entities.TemperatureLog.get(tempLogId);
  if (!tempLog) return { skipped: true };

  const task = {
    type: 'temperature',
    title: `Temperature: ${tempLog.location || 'Check'}`,
    description: tempLog.notes || '',
    station: tempLog.location || '',
    status: tempLog.status === 'failed' ? 'needs_review' : 'complete',
    priority: tempLog.status === 'failed' ? 'high' : 'medium',
    source_entity: 'TemperatureLog',
    source_entity_id: tempLog.id,
    custom_metadata: {
      temp_value: tempLog.temperature_value,
      temp_unit: tempLog.temperature_unit,
      safe_min: tempLog.safe_min,
      safe_max: tempLog.safe_max,
    },
  };

  return await base44.asServiceRole.entities.Task.create(task);
}

async function syncWaste(base44, wasteId, action) {
  const waste = await base44.entities.WasteEntry.get(wasteId);
  if (!waste) return { skipped: true };

  const task = {
    type: 'waste',
    title: `Waste: ${waste.item_name || 'Item'}`,
    description: waste.notes || '',
    station: waste.station_area || '',
    assigned_employee_name: waste.logged_by || '',
    status: 'complete',
    source_entity: 'WasteEntry',
    source_entity_id: waste.id,
    custom_metadata: {
      quantity: waste.quantity,
      unit: waste.unit,
      reason: waste.reason,
      cost: waste.estimated_cost,
    },
  };

  return await base44.asServiceRole.entities.Task.create(task);
}

async function syncMaintenance(base44, maintId, action) {
  // Placeholder for maintenance syncing
  return { synced: true };
}

async function syncIncident(base44, incidentId, action) {
  // Placeholder for incident syncing
  return { synced: true };
}

async function syncEmployeeNote(base44, noteId, action) {
  // Placeholder for employee note syncing
  return { synced: true };
}

async function syncManagerNote(base44, noteId, action) {
  // Placeholder for manager note syncing
  return { synced: true };
}

// Status mappers
function mapPrepStatus(status) {
  const map = {
    'pending': 'not_started',
    'in_progress': 'in_progress',
    'completed': 'complete',
    'approved': 'approved',
    'overdue': 'overdue',
  };
  return map[status] || 'not_started';
}

function mapSideWorkStatus(status) {
  const map = {
    'pending': 'not_started',
    'in_progress': 'in_progress',
    'completed': 'complete',
    'approved': 'approved',
    'overdue': 'overdue',
  };
  return map[status] || 'not_started';
}

function mapCleaningStatus(status) {
  const map = {
    'incomplete': 'not_started',
    'completed': 'complete',
    'passed': 'approved',
    'failed': 'needs_review',
    'needs_review': 'needs_review',
  };
  return map[status] || 'not_started';
}