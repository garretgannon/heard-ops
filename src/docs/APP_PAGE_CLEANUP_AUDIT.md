# heardOS Page Cleanup Audit

Date: 2026-05-13

## Scope

This audit maps page files, app routes, navigation entry points, and obvious legacy duplicates. It also records cleanup already applied so future page work has a clean starting point.

## Route Inventory Summary

- Real routed pages in `src/pages`: 60
- Redirect-only legacy routes in `src/App.jsx`: 55
- Page files in `src/pages` with no route: 2
- Top-level `src/*.jsx` files that duplicated `src/pages/*.jsx`: 57
- Top-level duplicate files that are byte-identical to `src/pages`: 2

## Highest Confidence Cleanup

### Remove old top-level page duplicates

Status: completed on 2026-05-13.

The router lazy-loads from `src/pages/*`, not top-level `src/*.jsx`. Nearly every page has an older top-level duplicate copy in `src/`.

Examples:

- `src/AppOverview.jsx` vs `src/pages/AppOverview.jsx`
- `src/StaffTasks.jsx` vs `src/pages/StaffTasks.jsx`
- `src/MyRestaurant.jsx` vs `src/pages/MyRestaurant.jsx`
- `src/ChemicalLibrary.jsx` vs `src/pages/ChemicalLibrary.jsx`
- `src/More.jsx` vs `src/pages/More.jsx`

Recommendation:

1. Keep `src/App.jsx`, `src/main.jsx`, `src/index.ts`, and non-page support files.
2. Remove or archive top-level page duplicates after a final import check.
3. Treat `src/pages/*` as the page source of truth.

Risk: low to medium. The Vite app routes through `src/pages`, but the duplicate files are not byte-identical, so deleting should happen in one reviewed cleanup PR.

Cleanup result: removed the 57 duplicate top-level page files after an exact import check. `src/App.jsx` and `src/main.jsx` are now the only top-level JSX files.

### Remove or archive `src/pages/ShiftHandoff.jsx`

Status: no active route.

The route `/shift-handoff` currently renders `ManagerShift`, not `ShiftHandoff`. The modern handoff save logic lives inside `src/pages/ManagerShift.jsx`, including `ShiftHandoff` entity creation and a matching `UnifiedLog`.

Recommendation: archive or remove `src/pages/ShiftHandoff.jsx` after confirming no desired UI exists only in that old page.

Risk: medium. It is product-adjacent, but currently unreachable.

### Remove or archive `src/pages/StationShift.jsx`

Status: no active route.

The active staff shift route is `/station-shift`, which renders `src/pages/StaffShift.jsx`. `StationShift.jsx` appears to be an older station-specific shift experience using `StationShiftSession`.

Recommendation: compare against `StaffShift.jsx`; migrate any unique desired behavior, then remove/archive `StationShift.jsx`.

Risk: medium. It may contain ideas worth preserving, but it is not reachable today.

## Likely Consolidation Targets

### Knowledge and recipe surfaces

Current active routes:

- `/recipes` -> `Recipes`
- `/build-cards` -> `BuildCards`
- `/recipes-and-build-cards` -> `RecipesAndBuildCards`
- `/standards` -> `Standards`
- `/knowledge` and `/search` -> `Knowledge`

Recommendation:

- Decide whether `/recipes-and-build-cards` is still needed as a separate page.
- Prefer one main knowledge hub plus deep links to Recipes, Build Cards, and Standards.
- Keep `/build-cards` and `/standards` only if they have clear navigation and distinct workflows.

Risk: product decision needed.

### Temperature surfaces

Current active routes:

- `/station-readiness` -> `StationReadiness`
- `/temperature-dashboard` -> `TemperatureDashboard`
- `/temperature-monitoring` -> `TemperatureMonitoring`
- `/temp-log-templates` -> `TemperatureLogTemplates`

Legacy uppercase routes redirect old temp pages to `/station-readiness`.

Recommendation:

- Decide whether Dashboard and Monitoring are admin-only deep tools or should fold into Station Readiness.
- If they remain, add clear navigation labels and ensure back paths are obvious.

Risk: product decision needed.

### Template surfaces

Current active routes include:

- `/templates` -> `TemplateManager`
- `/prep-templates` -> `PrepTemplatesManager`
- `/prep-plan-templates` -> `PrepPlanTemplatesManager`
- `/side-work-templates` -> `SideWorkTemplates`
- `/cleaning-templates` -> `CleaningTemplates`
- `/temp-log-templates` -> `TemperatureLogTemplates`
- `/waste-templates` -> `WasteTemplates`
- `/86-templates` -> `86Templates`

Recommendation:

- Keep dedicated editors when they have truly different workflows.
- Make `/templates` a hub, not a duplicate editor, if dedicated pages are preferred.
- Remove any template page that is only a wrapper around another route.

Risk: medium. Admin workflows may depend on these.

### SDS and chemical safety surfaces

Current active routes:

- `/chemical-library` -> `ChemicalLibrary`
- `/sds-library` -> `SDSLibrary`

Recommendation:

- Prefer `ChemicalLibrary` as the primary surface because it includes assignments to areas/stations.
- Keep `SDSLibrary` only if it manages separate SDS records not covered by ChemicalLibrary.
- Otherwise merge SDS viewing/upload into ChemicalLibrary and redirect `/sds-library`.

Risk: product/data model decision needed.

## Route Hygiene Findings

### Large legacy redirect block

`src/App.jsx` contains 55 redirect-only routes. These are useful for backwards compatibility, but they make route ownership hard to see.

Recommendation:

- Move legacy redirects into a data-driven `legacyRedirects` map.
- Render redirects from that map.
- Keep the canonical route list short and readable.

Risk: low if covered by route smoke tests.

### `routeConfig.js` duplicates route truth

`src/lib/routeConfig.js` has nav sections, `allRoutes`, and `legacyRedirects`, but `src/App.jsx` manually declares routes separately.

Recommendation:

- Short term: keep route rendering in `App.jsx`, but make `routeConfig.js` only navigation metadata.
- Medium term: generate route metadata and redirects from one source.

Risk: medium. Centralizing route rendering should be done carefully.

## Active Page Route Map

Pages with active routes:

- `86Templates.jsx`: `/86-templates`, `/86-templates/:id/edit`, `/86-templates/new`
- `AdminCommandCenter.jsx`: `/admin/command-center`
- `AdminRoleSimulator.jsx`: `/admin/role-simulator`
- `AppOverview.jsx`: `/app/overview`, `/dashboard`
- `ApprovalInbox.jsx`: `/approvals`
- `AutomationRules.jsx`: `/automation-rules`
- `BuildCards.jsx`: `/build-cards`
- `ChemicalLibrary.jsx`: `/chemical-library`
- `Cleaning.jsx`: `/cleaning`
- `CleaningTemplates.jsx`: `/cleaning-templates`, `/cleaning-templates/:id/edit`
- `CommsCenter.jsx`: `/comms`
- `InventorySimplified.jsx`: `/inventory`
- `JobCodes.jsx`: `/job-codes`
- `Knowledge.jsx`: `/knowledge`, `/search`
- `Landing.jsx`: `/`
- `LocationSetup.jsx`: `/location-setup`
- `LogsCenter.jsx`: `/logs`
- `ManagerShift.jsx`: `/shift`, `/shift-handoff`
- `More.jsx`: `/more`
- `MyRestaurant.jsx`: `/my-restaurant`
- `MyShifts.jsx`: `/my-shifts`
- `NotificationSettings.jsx`: `/notifications`
- `Onboarding.jsx`: `/onboarding`
- `OnboardingSimulator.jsx`: `/admin/onboarding-simulator`
- `OperationalMap.jsx`: `/operational-map`
- `PeopleHierarchy.jsx`: `/people`
- `PrepInventoryCounter.jsx`: `/prep-count`, `/prep-count/:id`
- `PrepPlanReview.jsx`: `/prep-plan/:id`
- `PrepPlanTemplatesManager.jsx`: `/prep-plan-templates`
- `PrepPlanning.jsx`: `/prep-planning`
- `PrepTemplateBuilder.jsx`: `/prep-plan-templates/new`, `/prep-plan-templates/:id`
- `PrepTemplatesManager.jsx`: `/prep-templates`, `/prep-templates/:id/edit`
- `Profile.jsx`: `/profile`
- `Pulse.jsx`: `/pulse`
- `PurchasedItems.jsx`: `/purchased-items`
- `RecipeBulkImport.jsx`: `/recipe-bulk-import`
- `Recipes.jsx`: `/recipes`
- `RecipesAndBuildCards.jsx`: `/recipes-and-build-cards`
- `Reports.jsx`: `/reports`
- `ReservationsAndBEOs.jsx`: `/reservations`
- `RestaurantLayout.jsx`: `/restaurant-layout`
- `ReviewInbox.jsx`: `/review-queue`
- `SDSLibrary.jsx`: `/sds-library`
- `ScheduleCenter.jsx`: `/schedule`
- `ScheduleImport.jsx`: `/schedule-import`
- `SetupJourney.jsx`: `/setup-journey`
- `Shift.jsx`: `/shift/:id`
- `SideWorkTemplates.jsx`: `/side-work-templates`, `/side-work-templates/:id/edit`
- `StaffShift.jsx`: `/station-shift`
- `StaffTasks.jsx`: `/tasks`
- `Standards.jsx`: `/standards`
- `StationPage.jsx`: `/station/:id`
- `StationReadiness.jsx`: `/station-readiness`
- `Stations.jsx`: `/stations`
- `TeamCenter.jsx`: `/team`
- `TemperatureDashboard.jsx`: `/temperature-dashboard`
- `TemperatureLogTemplates.jsx`: `/temp-log-templates`, `/temp-log-templates/:id/edit`
- `TemperatureMonitoring.jsx`: `/temperature-monitoring`
- `TemplateManager.jsx`: `/templates`, `/templates/new`, `/templates/:id`
- `Training.jsx`: `/training`
- `Vendors.jsx`: `/vendors`
- `WasteTemplates.jsx`: `/waste-templates`, `/waste-templates/:id/edit`, `/waste-templates/new`

Pages without active routes:

- `ShiftHandoff.jsx`
- `StationShift.jsx`

## Suggested Cleanup Order

1. Create a safety branch and run route smoke tests.
2. Delete/archive top-level `src/*.jsx` duplicate page files that are not imported.
3. Remove `src/pages/ShiftHandoff.jsx` after confirming `ManagerShift` fully replaces it.
4. Remove or migrate `src/pages/StationShift.jsx`.
5. Consolidate legacy redirects into a map.
6. Decide product ownership for Knowledge, Temperature, Template, and SDS/Chemical surfaces.
7. Add a small route inventory test that fails when a page exists with no route or when a route imports a missing page.
