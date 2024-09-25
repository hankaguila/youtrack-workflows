# Changelog

## v1.1.1 - 2024-09-25

### Changed

- **due-in**: Reset _Due In_ to empty value when the issue is resolved

## v1.1.0 - 2024-09-23

### Added

- **block-unresolved-deps**: Blocks issue resolution if any dependency is
  unresolved. Unlike the default **Dependencies** workflow, this workflow
  doesn't break if the resolved state is not named _Fixed_.

## v1.0.1 - 2024-09-23

### Fixed

- Relaxed guard from _due in_ workflow to ensure `Due In` updates on issue 
  changes and scheduled cron jobs

## v1.0.0 - 2024-09-22

### Added

- **Bind parent to subtasks**: Bind parent state to the least progressed subtask
- **Due In**: Update Due In based on Due Date
