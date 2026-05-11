# Product Hardening Audit

## Current Route Source

`src/App.jsx` imports routed screens from `src/pages/*`. Many top-level `src/*.jsx` files mirror the same page names. These top-level files should not be edited as the source of truth unless a route or import explicitly points to them.

## Exact Duplicate Page Shadows

These files currently have identical copies in `src/` and `src/pages/` and are cleanup candidates after confirming Base44 generation does not require the top-level copy:

- `86Templates.jsx`
- `AdminRoleSimulator.jsx`
- `AppOverview.jsx`
- `ApprovalInbox.jsx`
- `AutomationRules.jsx`
- `Cleaning.jsx`
- `CleaningTemplates.jsx`
- `IssueTracker.jsx`
- `JobCodes.jsx`
- `LocationSetup.jsx`
- `LogsCenter.jsx`
- `MSDS.jsx`
- `More.jsx`
- `MyRestaurant.jsx`
- `MyShifts.jsx`
- `NotificationSettings.jsx`
- `Onboarding.jsx`
- `OperationalMap.jsx`
- `PeopleHierarchy.jsx`
- `PrepPlanReview.jsx`
- `PrepPlanTemplatesManager.jsx`
- `PrepPlanning.jsx`
- `PrepTemplatesManager.jsx`
- `RecipesAndBuildCards.jsx`
- `Reports.jsx`
- `ReservationsAndBEOs.jsx`
- `SDSLibrary.jsx`
- `Settings.jsx`
- `Shift.jsx`
- `StaffTasks.jsx`
- `Standards.jsx`
- `Stations.jsx`
- `TemperatureDashboard.jsx`
- `TemperatureLogTemplates.jsx`
- `Training.jsx`
- `Vendors.jsx`
- `WasteTemplates.jsx`

## Divergent Page Shadows

These names exist in both places but differ. They need manual reconciliation before deletion:

- `AdminCommandCenter.jsx`
- `BuildCards.jsx`
- `ChemicalLibrary.jsx`
- `InventorySimplified.jsx`
- `Knowledge.jsx`
- `Landing.jsx`
- `OnboardingSimulator.jsx`
- `PrepInventoryCounter.jsx`
- `PrepLists.jsx`
- `PrepTemplateBuilder.jsx`
- `Profile.jsx`
- `Pulse.jsx`
- `PurchasedItems.jsx`
- `Recipes.jsx`
- `ReviewInbox.jsx`
- `ScheduleCenter.jsx`
- `ScheduleImport.jsx`
- `SetupJourney.jsx`
- `ShiftHandoff.jsx`
- `SideWork.jsx`
- `SideWorkTemplates.jsx`
- `StationReadiness.jsx`
- `TeamCenter.jsx`
- `TempLogs.jsx`
- `TemperatureMonitoring.jsx`
- `TemplateList.jsx`
- `TemplateManager.jsx`
- `TodaysCommandCenter.jsx`
- `WasteLog.jsx`

## Data-Linking Direction

Creation flows should prefer linked IDs plus denormalized names over free text:

- Tasks: link to `Location`, `Area`, `Station`, `Equipment`, `Employee`, and prep library records.
- Manager logs: link employee privately with `manager_only: true`; do not trigger employee notification behavior.
- BEOs: link menu/build cards and prep library items, then generate `BEOMenuItem`, `BEOPrepItem`, and setup timeline records.

## Cleanup Rule

Do not delete route shadows until import checks confirm no active imports reference them and Base44 export behavior is understood. Prefer replacing deleted page shadows with explicit redirects or barrel exports only if an external generator expects those file names.
