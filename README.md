# ServiceNow Role Planner

Eine webbasierte App zur Planung und Dokumentation von Rollenkonzepten in ServiceNow.  
Personas, Gruppen, Rollen, Fähigkeiten, UI-Zugriffsrechte und Tabellen-CRUD-Rechte werden strukturiert erfasst und als Excel exportiert.

---

## Stack

| Technologie | Version | Zweck |
|---|---|---|
| React | 19 | UI-Framework |
| TypeScript | 6 | Typsicherheit |
| Vite | 8 | Build-Tool / Dev-Server |
| Tailwind CSS | 3 | Styling |
| Zustand | 5 | State Management (mit `immer` + `persist`) |
| React Router | 7 | Client-seitiges Routing |
| ExcelJS | 4 | Excel-Export |
| @dnd-kit | 6/10 | Drag-and-Drop (Listen-Reordering) |
| Lucide React | – | Icons |
| nanoid | 5 | ID-Generierung |

State wird im Browser-LocalStorage unter dem Key `sn_role_planner_v2` persistiert (Schema-Version `2.1.0`).

---

## Starten

```bash
npm install
npm run dev
```

---

## Datenmodell

### Persona
Repräsentiert einen Benutzertyp im System (z.B. "IT Admin", "Endnutzer").

| Feld | Typ | Beschreibung |
|---|---|---|
| `id` | string | Eindeutige ID (nanoid) |
| `name` | string | Anzeigename der Persona |
| `description` | string | Kurzbeschreibung |
| `color` | string | Hex-Farbe für den Avatar |
| `emoji` | string? | Optionales Emoji (wird aktuell ignoriert, Avatar zeigt Initialen) |
| `exampleUser` | string? | Repräsentativer Beispiel-User (z.B. "Max Muster") |
| `scope` | `'intern'` \| `'extern'` | Unterscheidung interner/externer Nutzer |
| `groupIds` | string[] | Zugeordnete Gruppen-IDs |
| `createdAt` | string | ISO-Timestamp |
| `updatedAt` | string | ISO-Timestamp |

> Avatare werden als farbiger Kreis mit den Initialen des Namens dargestellt.

> **Aggregation**: Effektive Rollen einer Persona = Union der `roleIds` aller zugeordneten Gruppen — implementiert in `src/utils/personaAggregation.ts::getRoles(persona, groups, roles)`.

### Group
Zwischenschicht zwischen Personas und Rollen. Eine Persona ist Mitglied von Gruppen; Gruppen tragen die Rollenzuweisungen.

| Feld | Typ | Beschreibung |
|---|---|---|
| `id` | string | Eindeutige ID (nanoid) |
| `name` | string | Gruppenname |
| `description` | string | Kurzbeschreibung |
| `roleIds` | string[] | Zugeordnete Rollen-IDs |
| `createdAt` | string | ISO-Timestamp |
| `updatedAt` | string | ISO-Timestamp |

### Role
ServiceNow-Rolle, die Gruppen zugewiesen werden kann.

| Feld | Typ | Beschreibung |
|---|---|---|
| `id` | string | Eindeutige ID (nanoid) |
| `name` | string | Technischer Rollenname (z.B. `itil`) |
| `label` | string | Anzeigename |
| `description` | string | Beschreibung |
| `type` | `'base'` \| `'custom'` \| `'elevated'` | Rollentyp |
| `capabilityIds` | string[] | Zugeordnete Fähigkeiten |
| `uiAccess` | string[] | Keys der zugänglichen UI-Typen |
| `tableCrud` | `Record<string, CrudFlags>` | CRUD-Rechte pro Tabelle |
| `createdAt` | string | ISO-Timestamp |
| `updatedAt` | string | ISO-Timestamp |

### CrudFlags
```typescript
interface CrudFlags {
  create: boolean;  createFilter?: string;
  read:   boolean;  readFilter?:   string;
  update: boolean;  updateFilter?: string;
  delete: boolean;  deleteFilter?: string;
}
```
Der optionale Filter-String enthält eine ServiceNow-Bedingung (z.B. `contact EQ <me>`), die das Recht auf bestimmte Datensätze einschränkt.

### UITypeEntry
Frei definierbarer UI-Typ (z.B. "Agent Workspace", "Service Portal").

| Feld | Beschreibung |
|---|---|
| `id` | Eindeutige ID |
| `key` | Technischer Schlüssel (wird aus Label automatisch generiert) |
| `label` | Anzeigename |
| `description` | Beschreibung |

### TableEntry
Frei definierbare ServiceNow-Tabelle.

| Feld | Beschreibung |
|---|---|
| `id` | Eindeutige ID |
| `key` | Tabellenname in ServiceNow (z.B. `incident`) |
| `label` | Anzeigename |
| `module` | Zugehöriges Modul (z.B. `ITSM`) |

### Capability
Fähigkeit, die einer Rolle zugeordnet werden kann (z.B. "Incident erstellen", "Report ansehen").

---

## Features

### Entitäten verwalten
- **Personas** (`/personas`): Anlegen, bearbeiten, löschen. Filter nach Intern/Extern. Avatar = farbiger Kreis mit Initialen.
- **Gruppen** (`/gruppen`): Gruppen anlegen und Rollen zuweisen. Reihenfolge per Drag-and-Drop.
- **Rollen** (`/rollen`): Technischen Namen, Label, Typ und Beschreibung pflegen.
- **Fähigkeiten** (`/faehigkeiten`): Kategorisierte Capabilities anlegen.

### Ansichten
- **Persona-Übersicht** (`/personas/uebersicht`): Mehrere Personas gleichzeitig als Spalten vergleichen — aggregierte UI-Rechte, Fähigkeiten und CRUD-Rechte pro Modul. Eigener Excel-Export.
- **Persona-Vergleich** (`/personas/vergleich`): Zwei Personas nebeneinander vergleichen. Zeigt Gruppen-Mitgliedschaften und aggregierte Rechte (UI, Fähigkeiten, CRUD). Farbcodierung: Grün = beide haben das Recht, Blau = nur diese Persona, Grau = nicht vorhanden.

### Matrizen
- **Persona × Gruppe** (`/matrix/persona-gruppe`): Welche Persona ist Mitglied welcher Gruppe? Per Klick togglen.
- **Gruppe × Rolle** (`/matrix/gruppe-rolle`): Welche Gruppe hat welche Rolle?
- **Rolle × Rolle** (`/matrix/rolle-rolle`): Welche Rolle enthält welche andere Rolle (Vererbung)? Geerbte Rechte propagieren transitiv aufwärts. Zyklen werden beim Zuweisen verhindert.
- **Rolle × Fähigkeit** (`/matrix/rolle-faehigkeit`): Welche Rolle beinhaltet welche Fähigkeit?
- **Rolle × UI** (`/matrix/rolle-ui`): Welche Rolle hat Zugang zu welchem UI-Typ?
- **Tabellen CRUD** (`/matrix/tabellen-crud`): CRUD-Rechte pro Rolle und Tabelle. Optionaler Filter-Ausdruck pro Recht (orangener Dot = Filter aktiv).

Spaltenüberschriften in allen Matrizen sind vertikal ausgerichtet (`writing-mode: vertical-rl`) für platzsparendes Layout bei vielen Spalten.

### Konfiguration
- **UI-Typen** (`/konfig/ui-typen`): Frei definierbare UI-Zugriffstypen verwalten.
- **Tabellen** (`/konfig/tabellen`): Frei definierbare Tabellen verwalten, gruppiert nach Modul.
- **Module** (`/konfig/module`): Modul-Namen verwalten (werden für Tabellen-Gruppierung verwendet).

Beim Löschen eines UI-Typs oder einer Tabelle werden alle Verweise in bestehenden Rollen automatisch entfernt.  
Bei einer Key-Umbenennung werden alle Rollen-Referenzen automatisch migriert.

### Einstellungen (`/einstellungen`)
- **JSON-Export**: Gesamter App-State als JSON-Backup (`sn-role-planner-backup-YYYY-MM-DD.json`)
- **JSON-Import**: State aus JSON-Datei laden
- **Granulare Reset-Aktionen**: UI-Typen, Tabellen oder Module auf Defaults zurücksetzen; Personas/Gruppen/Rollen/Fähigkeiten löschen; alles löschen

> Das JSON-Format ist vollständig dokumentiert in [`docs/JSON_SCHEMA.md`](docs/JSON_SCHEMA.md).

### Excel-Export

#### `excelExport.ts` — Rollenkonzept
Erzeugt eine `.xlsx`-Datei mit bis zu 3 Sheets:

**Sheet "Rollenkonzept"** (Hauptblatt):
- Zeilen = Personas
- Spaltengruppen: Persona-Info | UI-Zugriff | Fähigkeiten | CRUD pro Tabelle
- Rechte werden als Union über alle zugewiesenen Rollen (via Gruppen) aggregiert
- `✓` = Recht vorhanden, `✓*` = Recht vorhanden mit Filter-Einschränkung
- Fixierte erste Zeile + erste Spalte (Freeze Panes)

**Sheet "Rollen"**: Referenzliste aller Rollen mit Fähigkeiten und UI-Zugriffen.

**Sheet "CRUD-Filter"** (optional): Nur vorhanden wenn Filter-Ausdrücke definiert sind.

#### `excelUebersichtExport.ts` — Persona-Übersicht
Für die Multi-Persona-Übersicht:
- Spalten = ausgewählte Personas (je 4 Spalten: C/R/U/D)
- Zeilen = UI-Rechte, Fähigkeiten, dann CRUD-Rechte gruppiert nach Modul
- Modul-Sektionen mit farbigen CRUD-Sub-Headern (grün/blau/amber/rot)
- Fixierte erste Spalte + erste Zeile

---

## Projektstruktur

```
src/
├── components/
│   ├── capabilities/    # CapabilityList, CapabilityForm
│   ├── common/          # Badge, Modal, ConfirmDialog, EmptyState, UsageBlockDialog
│   ├── config/          # UITypeList, UITypeForm, TableList, TableForm, ModuleList
│   ├── groups/          # GroupList, GroupForm
│   ├── layout/          # Sidebar, TopBar, PageContainer
│   ├── matrices/        # PersonaGroupMatrix, GroupRoleMatrix, RoleCapabilityMatrix,
│   │                    # RoleUIMatrix, TableCrudMatrix, CrudFilterPopover
│   ├── personas/        # PersonaList, PersonaForm, PersonaUebersicht
│   └── roles/           # RoleList, RoleForm
├── pages/               # Eine Page-Komponente pro Route
├── store/               # Zustand-Store mit allen Actions
├── types/               # index.ts – alle Interfaces und Types
└── utils/
    ├── constants.ts          # SCHEMA_VERSION, STORAGE_KEY, DEFAULT_*, PERSONA_COLORS
    ├── excelExport.ts        # Rollenkonzept-Excel (2–3 Sheets)
    ├── excelUebersichtExport.ts  # Persona-Übersicht-Excel
    ├── jsonBackup.ts         # exportJSON(), importJSON()
    └── personaAggregation.ts # getRoles(), aggregateUI(), aggregateCaps(), aggregateCrud()
```

---

## Backward Compatibility

- Gespeicherte Personas ohne `scope` → Fallback `'intern'` im UI
- Gespeicherte Personas mit `emoji`-Feld → wird ignoriert, Avatar zeigt Initialen
- State ohne `uiTypes`/`tables`/`modules` beim Import → Fehlende Arrays werden mit `DEFAULT_UI_TYPES`, `DEFAULT_TABLES`, `DEFAULT_MODULES` gefüllt
- `CrudFlags` ohne Filter-Felder → `undefined` = kein Filter gesetzt (Boolean bleibt valide)
- **Schema-Version 1.x → 2.0.0**: Alte JSON-Backups mit `personas[].roleIds` sind nicht direkt kompatibel, da Personas in v2 `groupIds` statt `roleIds` tragen. Migrationsanleitung: siehe [`docs/JSON_SCHEMA.md#migration-v1--v2`](docs/JSON_SCHEMA.md#migration-v1--v2).
- **Schema-Version 2.0.0 → 2.1.0**: Additive Änderung. `Role.containsRoleIds[]` ergänzt. Alte Backups ohne dieses Feld werden beim Import automatisch mit `[]` aufgefüllt — voll kompatibel.

---

## Weiterführende Dokumentation

- [`docs/JSON_SCHEMA.md`](docs/JSON_SCHEMA.md) — Vollständige JSON-Format-Referenz (Import/Export-Schema, alle Felder, Beispiel, Migration)
