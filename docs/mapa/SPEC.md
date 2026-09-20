# SPEC — School Map Page

## Context
The attached self-contained HTML (`mapa_escolar.html`) is an interactive school map: floor plan, room and point-of-interest hotspots, editable class schedule grid, search, and routing ("Como chegar?"). All data currently lives in memory and is lost on reload.

## Task
Integrate this HTML as a page in this Next.js project, fully following the project's existing conventions (routing, components, styling, data access, ORM, validation, tests). Replace in-memory data with persistence in the project's database. Do not add dependencies or abstraction layers the project does not already use. Anything out of scope must be recorded as technical debt in a simple list.

## Behavior
The HTML is the functional reference. Keep parity with the following behavior.

- **Map:** pan/zoom and hotspots.
- **Room panel:** shift tabs, plus grade/class selection.
- **Cell editing:**
  - Subject is picked from a select, with inline creation.
  - Teacher is free text, with suggestions and case-insensitive reuse.
- **Search:** accent-insensitive. Selecting a result highlights the location on the map before the panel opens.
- **Routing:** Dijkstra. The route panel closes after the route is drawn.

Static assets and configuration:

- The floor plan image (base64) must become a static file.
- Location geometry (`rooms`, `pois`) and the navigation graph (`navNodes`, `navEdges`) remain static configuration, extracted from the HTML.

## Data model
- **Location:** `id`, `code` (unique; e.g. `"07"`, `"biblioteca"`), `kind` (`ROOM` | `POI`), `name`. Seed with the 16 rooms and 16 POIs from the HTML.
- **Teacher:** `id`, `name`, unique normalized name (trim + lowercase).
- **Subject:** `id`, `name`, unique normalized name. Seed with the 8 subjects from the HTML.
- **ClassGroup:** `id`, `grade` (e.g. `"9º"`), `section` (e.g. `"A"`). Unique (`grade`, `section`).
- **RoomShift:** `id`, `locationId` → Location (kind `ROOM` only), `shift` (`MATUTINO` | `VESPERTINO` | `NOTURNO`), `classGroupId` → ClassGroup (optional). Unique (`locationId`, `shift`).
- **Lesson** (grid cell): `id`, `roomShiftId` → RoomShift, `weekday` (`SEG` to `SEX`), `period` (1 to 6), `subjectId` → Subject, `teacherId` → Teacher. Unique (`roomShiftId`, `weekday`, `period`).

## Relationships
- **Location 1:N RoomShift:** each room has up to 3 shifts.
- **ClassGroup 1:N RoomShift:** a class group may be assigned to a room/shift.
- **RoomShift 1:N Lesson:** up to 30 lessons per shift (5 days × 6 periods).
- **Subject 1:N Lesson** and **Teacher 1:N Lesson.**

Lifecycle rules:

- A RoomShift is created on demand at the first write.
- Deleting a RoomShift deletes its Lessons.
- A Subject or Teacher that is in use cannot be deleted.

## Operations
- **Assign class group to room/shift:** find-or-create ClassGroup.
- **Save cell:** find-or-create Teacher by name and Subject, then upsert the Lesson, all in one transaction.
- **Clear cell.**
- **Create subject.**
- **Read page data:** a single read of all data the page needs.

Do not seed the HTML's example data (class 5º A, Prof. Ana, English lesson).

## Before coding
Present a file plan aligned with the project's conventions, and confirm two points with me: the page route, and who is allowed to edit (authentication/permissions).
