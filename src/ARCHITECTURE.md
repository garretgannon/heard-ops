# HeardOS Unified Operational Architecture

## Core Principle
Single source of truth for each data type. Role-based filtering, not separate pages.

---

## 1. Users & Permissions
**Entity:** `User` (built-in)
- `id`, `email`, `full_name` (read-only)
- `role`: Configurable enum (admin, manager, kitchen_lead, server, cook, busser, etc.)

**Station Assignments** (via custom_metadata or separate StationAssignment entity):
- User → Station (many-to-many soft links)
- Used for filtering task visibility & log access

---

## 2. Template Engine (Unified)
**Entity:** `Template`

Unified structure for ALL recurring work:
- `template_type`: prep | sidework | cleaning | temperature | opening_checklist | closing_checklist | shift_handoff | maintenance | waste_86 | audit | custom
- `assigned_role`: Kitchen Lead, Server, Manager, etc.
- `assigned_station`: Kitchen, Front of House, Bar, etc.
- `recurrence_type`: daily | weekly | every_shift | on_demand
- `due_time`: HH:MM (when task is due)
- `priority`: low | medium | high | critical
- `photo_required`: boolean
- `manager_review_required`: boolean
- `visibility`: team_only | manager_only | assigned_only | private
- `checklist_items`: [{item, required}] for closing/opening/handoff
- `custom_fields`: type-specific data (temp ranges, waste categories, etc.)

**Backend Functions:**
- `generateTasksFromTemplates`: Runs daily/shift, creates Task instances for next period
- Templates power: prep, side work, cleaning, temps, checklists, handoffs, audits

---

## 3. Task Instances (Unified)
**Entity:** `Task`

Single structure for ALL operational work:
- `type`: prep | sidework | cleaning | temperature | opening_checklist | closing_checklist | shift_handoff | maintenance | incident | waste | custom
- `title`, `description`, `priority`, `status`
- `assigned_role`, `assigned_employee_id`, `assigned_employee_name`
- `station`: filters by employee station
- `due_date`, `due_time`, `shift_id`
- `photo_required`, `photo_urls`
- `manager_review_required`, `review_status` (pending | approved | rejected | needs_revision)
- `from_template`, `template_id` (backward compatibility & tracing)
- `linked_log_id`: if task completion creates a log entry
- `custom_metadata`: type-specific data
- `visibility`: filters who sees it

**Statuses:** not_started | in_progress | complete | needs_review | overdue | unable_to_complete | approved

**Display Rules:**
- Staff see assigned tasks only
- Managers see all + review queue
- Filtering by role, station, date, type

---

## 4. Unified Log Engine
**Entity:** `UnifiedLog`

Single structure for ALL compliance, issues, and records:
- `type`: temperature | maintenance | incident | waste | employee_note | manager_note | bathroom | eighty_six | custom
- `title`, `description`, `priority`, `status`
- `location`, `employee_id`, `employee_name`
- `photo_urls`, `attachment_urls`
- `requires_review`, `review_status`, `reviewed_by`, `reviewed_timestamp`
- `follow_up_required`, `follow_up_assigned_to`, `follow_up_due_date`
- `linked_task_id`: created from task or links to escalation
- `source_entity`, `source_entity_id`: migration tracking
- `custom_metadata`: type-specific data (temp readings, incident category, waste reason, etc.)
- `visibility`: team_log | manager_only | assigned_roles_only | private

**Statuses:** open | in_progress | resolved | closed | flagged | needs_review | pending

**Display Rules:**
- Staff see team logs, manager logs (if assigned follow-up), their own notes
- Managers see all + alerts for critical/overdue
- Filtering by type, status, date, location

---

## 5. Knowledge System (Consolidated)
**Entities:**
- `Recipe`: Dishes, costing, ingredients
- `BuildCard`: Modifiers, service instructions
- `Vendor`: Supplies, contacts
- `Standard`: SOPs, policies, procedures
- `Knowledge`: Onboarding, training materials

Each uses consistent metadata:
- `title`, `description`, `category`
- `visibility`: team_only | manager_only | public | private
- `created_by`, `updated_date`
- `photo_urls`, `attachment_urls`
- `searchable`: tags, keywords

---

## 6. Navigation Structure

### Primary Nav (Bottom Bar / Sidebar)
```
- Today       → Role-filtered operational dashboard
- Tasks       → Assigned tasks + review queue (filtered by role)
- Logs        → Compliance/issues/notes (filtered by visibility & role)
- Knowledge   → Recipes, SOPs, vendors, training
- More        → Settings, admin, reports, archived items
```

### Secondary Nav (All within filtered views)
- **Today**: Drill-down into overdue, due-today, pending approval, open incidents, labor alerts
- **Tasks**: Filter by type (prep, sidework, cleaning, temps, etc.), status, role, due date
- **Logs**: Filter by type, status, location, date, assignee
- **Knowledge**: Search/filter by category, role visibility
- **More**: Admin sections (templates, equipment, roles, settings)

---

## 7. Today Page (Operational Command Center)
**Role-based operational dashboard pulling from shared systems:**

**Staff View (Cook, Server, Busser, etc.):**
- My Tasks (assigned + due today/overdue)
- Current shift status
- Alerts (temp failures, maintenance blocking stations)
- Knowledge quick-access (today's recipes, handoff notes)

**Manager View:**
- Tasks Overview (completion %, overdue count, flagged for review)
- Team Status (stations, in-progress work, waiting approvals)
- Critical Alerts (temperature failures, incidents, equipment down, labor issues)
- Pending Actions (reviews, follow-ups, escalations)

**Kitchen Lead View:**
- My Station Tasks
- Prep Status (completion %, overdue prep items)
- Handoff Items (from previous shift)
- Quality Alerts (temp failures in my area)

---

## 8. Role-Based Experience (NOT Separate Pages)
Same data, filtered by role + permissions:

| Role | Today Focus | Task Visibility | Log Visibility |
|------|-------------|-----------------|-----------------|
| **Cook** | Assigned prep, sidework, current shift | My assigned tasks, my station | My notes, shift incidents |
| **Server** | Assigned sidework, training | My assigned tasks | Service notes |
| **Kitchen Lead** | Station status, team tasks, temps | My station + staff I supervise | Station logs, incidents |
| **Manager** | Everything, alerts, compliance | All tasks, review queue | All logs, issues, approvals |
| **Busser** | Cleaning tasks, current shift | My assigned tasks | Cleaning logs, maintenance |

---

## 9. Data Relationships
```
Template → Task (1:many, daily generation)
Task → Log (1:1, optional; task completion creates log)
Task → User (via assigned_employee_id)
User → Role (1:1)
User → Station (many:many, soft link via custom metadata or StationAssignment)
Log → User (via employee_id)
Recipe → Vendor (soft link via name)
Handoff → Task (previous shift handoff notes become new day task context)
```

---

## 10. Deprecation & Migration Plan

**Pages to Consolidate (redirect to filtered views):**
- PrepLists → Tasks?type=prep
- SideWork → Tasks?type=sidework
- Cleaning → Tasks?type=cleaning
- TempLogs → Logs?type=temperature
- MaintenanceRequests → Logs?type=maintenance
- IncidentReports → Logs?type=incident
- WasteLog → Logs?type=waste
- EmployeeLog → Logs?type=employee_note
- ManagerLog → Logs?type=manager_note

**Legacy Entities (Keep for backward compatibility, migrate data):**
- PrepItem, SideWorkAssignment, CleaningLog, TemperatureLog, IncidentReport, EmployeeLog, MaintenanceRequest, WasteEntry
- All map to Task & UnifiedLog via source_entity + source_entity_id

---

## 11. Implementation Roadmap

1. **Phase 1 (Immediate):** Unified navigation, role-based filtering
2. **Phase 2:** Today page command center (pull real data)
3. **Phase 3:** Task & Log views with advanced filtering
4. **Phase 4:** Deprecate legacy pages (redirect + migration helpers)
5. **Phase 5:** Role-based access control & visibility enforcement