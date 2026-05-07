# Restaurant Operating System - Migration Plan (v2.0)
**Status: SAFETY-FIRST AUDIT**  
**Date: 2026-05-07**  
**Goal: Restructure into unified system without data loss**

---

## 1. EXISTING PAGES & ROUTES INVENTORY

### Bottom Navigation Routes (5 Core)
| Route | Page Component | Purpose | Current Status |
|-------|---|---|---|
| `/` | TodaysCommandCenter | Shift dashboard & command hub | Active |
| `/today` | TodaysCommandCenter | Alias for home | Active |
| `/tasks` | StaffTasks | Task management view | Active |
| `/logs` | Logs | Activity/incident logging | Active |
| `/knowledge` | Knowledge | Know-how & resources | Active |
| `/more` | More | Settings & utilities | Active |

### Operations Routes (Task Workflows)
| Route | Page Component | Purpose | Data Model | Migration Impact |
|-------|---|---|---|---|
| `/prep-lists` | PrepLists | Prep item workflow | PrepItem | **PRESERVE** - Will integrate as Task category |
| `/prep-lists/new` | PrepLists | Create prep item | PrepItem | **PRESERVE** - Will route to Tasks form |
| `/prep-lists/:id/edit` | PrepLists | Edit prep item | PrepItem | **PRESERVE** - Will route to Tasks detail |
| `/side-work` | SideWork | Side work assignment workflow | SideWorkAssignment | **PRESERVE** - Will integrate as Task category |
| `/cleaning` | Cleaning | Cleaning checklist workflow | CleaningLog | **PRESERVE** - Will integrate as Log category |
| `/waste-86` | WasteLog | 86/waste logging | WasteEntry / LogWasteDetail | **PRESERVE** - Will integrate as Log category |

### Compliance & Logging Routes
| Route | Page Component | Purpose | Data Model | Migration Impact |
|-------|---|---|---|---|
| `/temp-logs` | Redirects to `/logs?view=temperature` | Temperature logging | TemperatureLog / LogTemperatureDetail | **PRESERVE** - Will integrate as Log category |
| `/temp-log-templates` | TemperatureLogTemplates | Template builder | TemperatureLogTemplate | **KEEP** - Core system |
| `/cleaning-templates` | CleaningTemplates | Template builder | CleaningTemplate | **KEEP** - Core system |
| `/waste-templates` | WasteTemplates | Template builder | WasteTemplate | **KEEP** - Core system |
| `/86-templates` | EightySixTemplates | Template builder | WasteTemplate | **KEEP** - Core system |
| `/issues` | Redirects to `/logs?view=issues` | Issue tracking | Issue | **PRESERVE** - Will integrate as Log category |

### Knowledge Base Routes
| Route | Page Component | Purpose | Data Model | Migration Impact |
|-------|---|---|---|---|
| `/recipes` | Recipes | Recipe & menu item library | Recipe | **PRESERVE** - Knowledge asset |
| `/build-cards` | BuildCards | Build card library | BuildCard | **PRESERVE** - Knowledge asset |
| `/recipes-and-build-cards` | RecipesAndBuildCards | Combined view | Recipe + BuildCard | **PRESERVE** - Knowledge asset |
| `/reservations` | ReservationsAndBEOs | Events & BEOs | Reservation / BEO | **PRESERVE** - Operations data |
| `/purchased-items` | PurchasedItems | Vendor goods | PurchasedItem | **PRESERVE** - Inventory asset |
| `/standards` | Standards | SOPs & standards | Knowledge | **PRESERVE** - Knowledge asset |
| `/msds` | MSDS | Chemical safety docs | Knowledge | **PRESERVE** - Knowledge asset |
| `/templates` | TemplateList | All templates | Various | **PRESERVE** - Core library |
| `/vendors` | Vendors | Vendor management | Vendor | **PRESERVE** - Operations data |

### Management & Admin Routes
| Route | Page Component | Purpose | Data Model | Migration Impact |
|-------|---|---|---|---|
| `/schedule` | ScheduleCenter | Staff scheduling | Shift / StaffShift | **PRESERVE** - Core operations |
| `/schedule-import` | ScheduleImport | Import workflows | ScheduleImportBatch | **PRESERVE** - Admin utility |
| `/inventory` | InventorySimplified | Inventory tracking | InventoryItem | **PRESERVE** - Operations data |
| `/team` | RestaurantTeam | Staff directory | Employee / User | **PRESERVE** - Core operations |
| `/reports` | Reports | Analytics & reports | Various (read-only) | **PRESERVE** - Analytics |
| `/shift-handoff` | ShiftHandoff | Shift notes & handoff | ShiftHandoff | **PRESERVE** - Operations |
| `/profile` | Profile | User profile | User | **PRESERVE** - Personal data |
| `/my-restaurant` | MyRestaurant | Restaurant settings | Settings | **PRESERVE** - Config |
| `/notifications` | NotificationSettings | Alert preferences | NotificationSettings | **PRESERVE** - User preferences |
| `/stations` | Stations | Station management | Station | **PRESERVE** - Config |
| `/job-codes` | JobCodes | Job code management | JobCode | **PRESERVE** - Config |
| `/admin/role-simulator` | AdminRoleSimulator | Dev/test tool | N/A | **DEV ONLY** |
| `/admin/command-center` | AdminCommandCenter | Admin dashboard | N/A | **DEV ONLY** |
| `/admin/onboarding-simulator` | OnboardingSimulator | Dev/test tool | N/A | **DEV ONLY** |

### Legacy Redirects (For Backwards Compatibility)
All legacy routes in lines 172-196 of App.jsx already redirect to new routes. **KEEP THESE**.

---

## 2. DATABASE ENTITIES & DATA MODELS

### Core Operational Tables (MUST PRESERVE)
| Entity | Records Type | Usage | Preservation Status |
|--------|---|---|---|
| **Shift** | Active shifts & history | Shift lifecycle management | ✅ CRITICAL |
| **Employee** | Staff records | HR & payroll | ✅ CRITICAL |
| **User** | App users | Authentication & roles | ✅ CRITICAL |
| **ShiftSession** | Clock in/out records | Time tracking | ✅ CRITICAL |
| **Schedule / StaffShift** | Weekly schedules | Staff scheduling | ✅ CRITICAL |

### Task/Assignment Tables (PRESERVE - Will Integrate)
| Entity | Records Type | Current Location | Migration Pattern |
|--------|---|---|---|
| **PrepItem** | Prep tasks | `/prep-lists` | Become Task entities with `type: "prep"` |
| **SideWorkAssignment** | Side work tasks | `/side-work` | Become Task entities with `type: "sidework"` |
| **DailyCleaningTask** | Cleaning tasks | `/cleaning` | Become Task entities with `type: "cleaning"` |
| **DailyTemperatureLogTask** | Temp log tasks | Auto-generated | Become Task entities with `type: "temperature"` |

### Log/Activity Tables (PRESERVE - Will Integrate)
| Entity | Records Type | Current Location | Migration Pattern |
|--------|---|---|---|
| **Log** | Generic activity log | `/logs` (main table) | Core - will expand scope |
| **LogTemperatureDetail** | Temp readings | `/logs?view=temperature` | Log category: `logType: "temperature"` |
| **LogBathroomDetail** | Bathroom checks | `/logs?view=bathroom` | Log category: `logType: "bathroom"` |
| **LogMaintenanceDetail** | Maintenance requests | `/logs?view=maintenance` | Log category: `logType: "maintenance"` |
| **LogIncidentDetail** | Incident reports | `/logs?view=incident` | Log category: `logType: "incident"` |
| **LogEmployeeDetail** | Employee notes | `/logs?view=employee` | Log category: `logType: "employee"` |
| **LogWasteDetail** | Waste entries | `/logs?view=waste` | Log category: `logType: "waste"` |
| **LogEightySixDetail** | 86 items | `/logs?view=eighty_six` | Log category: `logType: "eighty_six"` |
| **LogManagerDetail** | Manager notes | `/logs?view=manager` | Log category: `logType: "manager"` |
| **Issue** | Open issues | `/logs?view=issues` | Log category + status tracking |
| **WasteEntry** | Waste tracking | `/waste-86` (duplicate?) | **AUDIT**: Merge with LogWasteDetail |
| **IncidentReport** | Incident reports | Duplicate entity? | **AUDIT**: Merge with LogIncidentDetail |
| **EmployeeLog** | Employee notes | Duplicate entity? | **AUDIT**: Merge with LogEmployeeDetail |
| **CleaningLog** | Cleaning records | Separate table? | **AUDIT**: Merge with DailyCleaningTask |
| **TemperatureLog** | Temp logs | Separate table? | **AUDIT**: Merge with LogTemperatureDetail |

### Knowledge Base Tables (PRESERVE)
| Entity | Usage | Preservation Status |
|--------|---|---|
| **Recipe** | Menu items & recipes | ✅ PRESERVE |
| **BuildCard** | Build/prep instructions | ✅ PRESERVE |
| **Knowledge** | Standards & SOPs | ✅ PRESERVE |

### Inventory & Vendor Tables (PRESERVE)
| Entity | Usage | Preservation Status |
|--------|---|---|
| **InventoryItem** | Stock tracking | ✅ PRESERVE |
| **PurchasedItem** | Vendor goods database | ✅ PRESERVE |
| **Vendor** | Supplier info | ✅ PRESERVE |

### Template Tables (PRESERVE)
| Entity | Template Type | Preservation Status |
|--------|---|---|
| **PrepTemplate / PrepTemplateItem** | Prep templates | ✅ PRESERVE |
| **SideWorkTemplate / SideWorkTemplateItem** | Side work templates | ✅ PRESERVE |
| **CleaningTemplate / CleaningTemplateItem** | Cleaning templates | ✅ PRESERVE |
| **TemperatureLogTemplate / TemperatureLogTemplateItem** | Temp log templates | ✅ PRESERVE |

### Settings & Config Tables (PRESERVE)
| Entity | Usage | Preservation Status |
|--------|---|---|
| **Settings** | App configuration | ✅ PRESERVE |
| **Department** | Departments | ✅ PRESERVE |
| **Area** | Work areas | ✅ PRESERVE |
| **Station** | Workstations | ✅ PRESERVE |
| **JobCode** | Job classifications | ✅ PRESERVE |
| **Role** | User roles | ✅ PRESERVE |

### Events & Reservations (PRESERVE)
| Entity | Usage | Preservation Status |
|--------|---|---|
| **Reservation** | Guest reservations | ✅ PRESERVE |
| **BEO** | Banquet events | ✅ PRESERVE |
| **CalendarEvent** | Calendar entries | ✅ PRESERVE |

---

## 3. BUTTON & ACTION MAPPING

### Quick Actions in `/tasks` (StaffTasks)
**Location**: Components accessed via quick action buttons
```
Quick Actions trigger modals for:
- New Prep Item (→ PrepItem.create)
- New Side Work (→ SideWorkAssignment.create)
- New Log Entry (→ Log.create with logType)
- Clock In/Out (→ ShiftSession)
- Add Note (→ Log with type="manager")
```

### Quick Actions in `/` (TodaysCommandCenter)
```
RoleAwareQuickActions component shows role-specific buttons:
- Kitchen Lead: Prep Command Center, Shift Intel Log
- Managers: All operational quick actions
- Staff: Basic task creation
```

### Forms & Modal Dialogs
| Action | Current Form/Modal | Data Target | Preservation Status |
|--------|---|---|---|
| Create Prep | PrepListImportFlow / PrepItemForm | PrepItem | Route through Tasks |
| Create Side Work | SideWorkCard form | SideWorkAssignment | Route through Tasks |
| Create Cleaning Task | CleaningLogForm | CleaningLog | Route through Tasks |
| Log Temperature | TemperatureLogForm | TemperatureLog | Route through Tasks/Logs |
| Log Waste | WasteLogForm | WasteEntry | Route through Tasks/Logs |
| Log Incident | IncidentReportForm | IncidentReport | Route through Tasks/Logs |
| Add Employee Note | EmployeeLogForm | EmployeeLog | Route through Logs |
| Clock In/Out | ShiftSession form | ShiftSession | ✅ PRESERVE |
| Start/End Shift | ShiftMode components | Shift | ✅ PRESERVE |

---

## 4. DUPLICATE & BROKEN ROUTES

### Identified Duplicates (AUDIT NEEDED)
1. **Waste Tracking**:
   - `WasteEntry` entity (standalone table)
   - `LogWasteDetail` (nested in Log)
   - Both track same data → **CONSOLIDATE onto Log system**

2. **Employee Notes**:
   - `EmployeeLog` (standalone table)
   - `LogEmployeeDetail` (nested in Log)
   - Both track same data → **CONSOLIDATE onto Log system**

3. **Incident Reports**:
   - `IncidentReport` (standalone table)
   - `LogIncidentDetail` (nested in Log)
   - Both track same data → **CONSOLIDATE onto Log system**

4. **Cleaning**:
   - `CleaningLog` (standalone table)
   - `DailyCleaningTask` (template-based)
   - Both track same data → **CONSOLIDATE onto Task system**

5. **Temperature Logs**:
   - `TemperatureLog` (standalone table)
   - `LogTemperatureDetail` (nested in Log)
   - `DailyTemperatureLogTask` (template-based)
   - All track same data → **CONSOLIDATE onto Log system**

### Broken/Disconnected Routes
- **No known broken routes** - all legacy redirects in place

---

## 5. MIGRATION STRATEGY (NON-DESTRUCTIVE)

### Phase 1: Audit & Mapping (CURRENT - THIS DOCUMENT)
✅ Inventory all pages, routes, entities, and data models  
✅ Identify duplicates and consolidation targets  
✅ Document all button flows and form mappings  
✅ **NO CODE CHANGES**

### Phase 2: Unified Task System (✅ CREATED)
**Goal**: Create a single `Task` entity that will serve all task types  
**Completed**:
- ✅ Created `Task` entity schema with 25+ fields: `type`, `assignee`, `dueDate`, `status`, `priority`, `metadata`, etc.
- ✅ Created `syncToUnifiedTasks.js` function to read from legacy tables and write to `Task`
- ✅ Created `UnifiedTaskForm.jsx` component for creating all task types
- ✅ All task types support: title, description, assignment, scheduling, priority, photo requirement, manager review, status tracking
- ✅ Task types: prep, sidework, temperature, cleaning, waste, maintenance, incident, employee_note, manager_note, shift_handoff, beo_event
- ✅ **NO DATA DELETED** - Original tables untouched; `source_entity` field tracks origin

**Data Structure**:
```
PrepItem → Task { type: "prep", source_entity: "PrepItem", source_entity_id: "...", custom_metadata: {qty_needed, qty_completed, unit} }
SideWorkAssignment → Task { type: "sidework", source_entity: "SideWorkAssignment", source_entity_id: "...", ... }
CleaningLog → Task { type: "cleaning", source_entity: "CleaningLog", source_entity_id: "...", ... }
TemperatureLog → Task { type: "temperature", source_entity: "TemperatureLog", source_entity_id: "...", custom_metadata: {temp_value, safe_min, safe_max} }
WasteEntry → Task { type: "waste", source_entity: "WasteEntry", source_entity_id: "...", custom_metadata: {quantity, unit, reason, cost} }
```

### Phase 3: Unified Log System (✅ CREATED)
**Goal**: Create a single `UnifiedLog` entity for all logging activity  
**Completed**:
- ✅ Created `UnifiedLog` entity schema with 20+ fields: `type`, `location`, `employee_id`, `status`, `visibility`, `photo_urls`, `follow_up_required`, etc.
- ✅ Created `UnifiedLogForm.jsx` component for recording all log types
- ✅ Log types: temperature, bathroom, maintenance, incident, employee_note, manager_note, waste, eighty_86, chemical, custom
- ✅ All logs support: title, description, location/equipment, employee tracking, visibility control, photos, attachments, follow-up assignment
- ✅ Manager review workflow: requires_review, reviewed_by, reviewed_timestamp, review_status
- ✅ **NO DATA DELETED** - Original tables untouched; `source_entity` field tracks origin

**Data Structure**:
```
Log (existing) → UnifiedLog { type: "manager_note", source_entity: "Log", source_entity_id: "...", ... }
TemperatureLog → UnifiedLog { type: "temperature", source_entity: "TemperatureLog", source_entity_id: "...", ... }
IncidentReport → UnifiedLog { type: "incident", source_entity: "IncidentReport", source_entity_id: "...", ... }
EmployeeLog → UnifiedLog { type: "employee_note", source_entity: "EmployeeLog", source_entity_id: "...", ... }
WasteEntry → UnifiedLog { type: "waste", source_entity: "WasteEntry", source_entity_id: "...", ... }
```

### Phase 4: UI/UX Consolidation (After Phases 2-3)
**Changes**:
- [ ] Unify task creation flows (all route through single Task form)
- [ ] Unify log creation flows (all route through single Log form)
- [ ] Update quick action buttons to use new unified modals
- [ ] Update bottom navigation flow charts
- [ ] **NO DATA CHANGES** - Only navigation & UI

### Phase 5: Decommission Originals (Optional - After 3+ months)
**Decision Point**: Only after confirming all data is accessible through unified system
- [ ] Option A: Keep originals indefinitely for auditing
- [ ] Option B: Archive originals after 6-month read-only period
- [ ] Option C: Hard delete (NOT RECOMMENDED - too risky)

---

## 6. VALIDATION CHECKLIST (PRE-MIGRATION)

Before making ANY changes, confirm:

- [ ] All PrepItem records are queryable and unchanged
- [ ] All SideWorkAssignment records are queryable and unchanged
- [ ] All Log records (all types) are queryable and unchanged
- [ ] All Recipe, BuildCard, Knowledge records are unchanged
- [ ] All Employee, User, Shift records are unchanged
- [ ] All Schedule, StaffShift records are unchanged
- [ ] All Inventory, PurchasedItem, Vendor records are unchanged
- [ ] All Settings, Station, JobCode, Department records are unchanged
- [ ] All legacy redirects still work (test from `/Recipes`, `/SideWork`, etc.)
- [ ] Bottom navigation displays correctly on mobile and desktop
- [ ] All role-based quick actions display correctly
- [ ] All forms submit without errors

---

## 7. ROLLBACK PROCEDURE

If any phase introduces data loss or breaks critical flows:

1. **Immediate**: Stop all further migrations
2. **Restore**: Revert code changes to last stable commit
3. **Audit**: Review migration logs to identify what broke
4. **Replan**: Adjust Phase X before re-attempting
5. **Test**: Run validation checklist again

---

## 8. NEXT STEPS

1. **User confirms** this plan is safe and complete
2. **Begin Phase 2**: Create unified Task system
3. **After Phase 2**: Begin Phase 3 Log consolidation
4. **Iterate**: Test each phase before proceeding to next

---

**Created by**: Base44 AI  
**Last Updated**: 2026-05-07  
**Review Status**: AWAITING USER APPROVAL