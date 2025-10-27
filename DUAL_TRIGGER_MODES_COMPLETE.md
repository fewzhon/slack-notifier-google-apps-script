# Dual Trigger Modes - Complete Implementation ✅

## Summary

Successfully implemented dual trigger modes for the monitoring system:
- **Time-Driven Mode** (default): Admin sets time window, system calculates runs
- **Count-Driven Mode**: Admin sets number of runs, system calculates time window

## Changes Made

### 1. **Configuration Entity** (`src/core/entities/Configuration.js`)
- Added `triggerMode` field (default: 'time-driven')
- Added getter for `triggerMode`
- Updated `maxRunsPerDay` default to 8

### 2. **Repository** (`src/infrastructure/storage/ScriptPropertiesRepository.js`)
- Added `triggerMode` to key mapping for load/save operations

### 3. **Dashboard API** (`src/presentation/api/DashboardAPI.js`)
- Updated `triggers` category with:
  - `triggerMode` dropdown with options
  - Conditional visibility of fields based on mode
  - Info messages showing calculated values
  - Updated description

### 4. **UI** (`src/presentation/web/assets/js/modern-ui-js.html`)
- Added support for:
  - Select dropdowns with options
  - Info messages under fields
  - Hidden field support
  - Number input validation (min/max)

### 5. **Trigger Manager** (`src/infrastructure/triggers/TriggerManager.js`)
- Refactored `setupMonitorTrigger()` to route by mode
- Added `_setupCountDrivenTriggers()`:
  - Validates runs (2-8)
  - Calculates end hour: `startHour + (runs * 0.5 hours)`
  - Validates end hour doesn't exceed 24
  - Creates hourly triggers
- Added `_setupTimeDrivenTriggers()`:
  - Validates time window (stopHour > startHour)
  - Validates minimum 2-hour window
  - Calculates runs: `stopHour - startHour`
  - Validates maximum 8 runs
  - Creates hourly triggers

## How It Works

### Time-Driven Mode (Default)
1. Admin sets startHour (e.g., 19 = 7pm)
2. Admin sets stopHour (e.g., 23 = 11pm)
3. System calculates: 4 runs
4. Info message: "This will result in 4 runs per day"
5. Triggers created at 19:00, 20:00, 21:00, 22:00

### Count-Driven Mode
1. Admin sets maxRunsPerDay (e.g., 8)
2. Admin sets startHour (e.g., 19 = 7pm)
3. System calculates: endHour = 19 + (8 * 0.5) = 23:00
4. Info message: "Window will be 4 hours (from 19:00 to 23:00)"
5. Triggers created at 19:00, 20:00, 21:00, 22:00

## Validation Rules

### Time-Driven Mode
- Minimum window: 2 hours
- Maximum runs: 8 runs
- Stop hour must be > start hour
- Shows calculated runs

### Count-Driven Mode
- Minimum runs: 2
- Maximum runs: 8
- Calculated end hour must be ≤ 24
- Shows calculated time window

## UI Features

1. **Mode Selector**: Dropdown to switch between modes
2. **Conditional Fields**: Only relevant fields shown based on mode
3. **Info Messages**: Real-time calculation feedback
4. **Validation**: Client-side and server-side validation
5. **Save Behavior**: Removes old triggers and recreates on save

## Testing Checklist

- [ ] Test time-driven mode with valid window
- [ ] Test time-driven mode with window > 8 runs (should error)
- [ ] Test time-driven mode with window < 2 hours (should error)
- [ ] Test count-driven mode with valid runs
- [ ] Test count-driven mode with runs > 8 (should error)
- [ ] Test count-driven mode with runs < 2 (should error)
- [ ] Test count-driven mode that would exceed 24:00 (should error)
- [ ] Test switching modes
- [ ] Test saving configuration
- [ ] Verify triggers are created correctly
- [ ] Verify old triggers are removed before creating new ones
