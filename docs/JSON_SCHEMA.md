# JSON Import/Export — Schema-Referenz

Der JSON-Export des ServiceNow Role Planners ist ein vollständiger Snapshot des App-States. Diese Datei dokumentiert das Format, alle Felder, das Import-Verhalten und die Migration von v1 auf v2.

**Quelle im Code:** `src/utils/jsonBackup.ts` (Export/Import-Logik), `src/store/index.ts` (State-Aufbau), `src/types/index.ts` (TypeScript-Interfaces).

---

## Datei-Konvention

| Eigenschaft | Wert |
|---|---|
| Dateiname | `sn-role-planner-backup-YYYY-MM-DD.json` |
| MIME-Typ | `application/json` |
| Encoding | UTF-8 |
| Formatierung | 2-Space-Einrückung (pretty-print) |
| Schema-Version | `2.1.0` |

---

## Envelope — Top-Level-Felder

```json
{
  "personas":     [],
  "groups":       [],
  "roles":        [],
  "capabilities": [],
  "uiTypes":      [],
  "tables":       [],
  "modules":      [],
  "version":      "2.0.0",
  "exportedAt":   "2026-04-17T10:30:00.000Z"
}
```

| Feld | Typ | Pflicht beim Import | Beschreibung |
|---|---|---|---|
| `personas` | `Persona[]` | **Ja** | Alle Personas |
| `groups` | `Group[]` | Nein (Default: `[]`) | Alle Gruppen |
| `roles` | `Role[]` | **Ja** | Alle Rollen |
| `capabilities` | `Capability[]` | **Ja** | Alle Fähigkeiten |
| `uiTypes` | `UITypeEntry[]` | Nein (Default: `DEFAULT_UI_TYPES`) | UI-Zugriffstypen |
| `tables` | `TableEntry[]` | Nein (Default: `DEFAULT_TABLES`) | Tabellen-Konfiguration |
| `modules` | `string[]` | Nein (Default: `DEFAULT_MODULES`) | Modul-Namen |
| `version` | `string` | Nein | Schema-Version (`"2.0.0"`) — wird beim Import nicht geprüft |
| `exportedAt` | `string` | Nein | ISO-8601-Timestamp des Exports — wird beim Import ignoriert |

---

## Beziehungsdiagramm

```
Persona.groupIds[]       →  Group.id
Group.roleIds[]          →  Role.id
Role.containsRoleIds[]   →  Role.id                   ← transitiv, zyklenfrei
Role.capabilityIds[]     →  Capability.id
Role.uiAccess[]          →  UITypeEntry.key        ← Key, nicht ID!
Role.tableCrud{}         →  TableEntry.key         ← Map-Key = TableEntry.key
TableEntry.module        →  modules[]              ← String-Match
```

> **Wichtig:** `Role.uiAccess` und `Role.tableCrud` referenzieren über `key`, alle anderen Beziehungen über `id`. Beim manuellen Bearbeiten von Backups müssen diese Felder konsistent gehalten werden.

### Vererbungs-Semantik

`Role.containsRoleIds` definiert eine **"Contains Roles"**-Hierarchie (analog zu ServiceNow). Rechte propagieren transitiv aufwärts:

- Effektive Rechte einer Persona = Union aller via Gruppen zugewiesenen Rollen **und** ihrer transitiv enthaltenen Rollen (`expandRoles` in `src/utils/personaAggregation.ts`).
- **CRUD-Filter-Merge**: Wenn irgendeine Rolle in der Kette ein Recht **ohne Filter** gewährt, gewinnt das — Filter werden entfernt (Semantik: unbeschränkt > beschränkt).
- **Zyklen**: Die App verhindert Zyklen beim Zuweisung-Toggle. Beim Import werden keine Zyklen validiert; `expandRoles` enthält einen `visited`-Guard, der Endlosrekursion verhindert.

---

## Feld-Referenz

### Persona

Quelle: `src/types/index.ts` → `interface Persona`

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `id` | `string` | Ja | Eindeutige ID (nanoid, 21 Zeichen) |
| `name` | `string` | Ja | Anzeigename |
| `description` | `string` | Ja | Kurzbeschreibung (kann leer sein) |
| `color` | `string` | Ja | Hex-Farbe inkl. `#` (z.B. `#3B82F6`) |
| `emoji` | `string` | Nein | Optionales Emoji — aktuell ungenutzt |
| `exampleUser` | `string` | Nein | Beispiel-Username (z.B. `"Max Muster"`) |
| `scope` | `'intern' \| 'extern'` | Ja | Nutzertyp; fehlt → Fallback `'intern'` |
| `groupIds` | `string[]` | Ja | IDs der zugeordneten Gruppen |
| `createdAt` | `string` | Ja | ISO-8601-Timestamp |
| `updatedAt` | `string` | Ja | ISO-8601-Timestamp |

---

### Group

Quelle: `src/types/index.ts` → `interface Group`

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `id` | `string` | Ja | Eindeutige ID (nanoid) |
| `name` | `string` | Ja | Gruppenname |
| `description` | `string` | Ja | Kurzbeschreibung (kann leer sein) |
| `roleIds` | `string[]` | Ja | IDs der zugeordneten Rollen |
| `createdAt` | `string` | Ja | ISO-8601-Timestamp |
| `updatedAt` | `string` | Ja | ISO-8601-Timestamp |

---

### Role

Quelle: `src/types/index.ts` → `interface Role`

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `id` | `string` | Ja | Eindeutige ID (nanoid) |
| `name` | `string` | Ja | Technischer Rollenname (z.B. `itil`) |
| `label` | `string` | Ja | Anzeigename |
| `description` | `string` | Ja | Beschreibung (kann leer sein) |
| `type` | `'base' \| 'custom' \| 'elevated'` | Ja | Rollentyp |
| `containsRoleIds` | `string[]` | Nein (Default: `[]`) | IDs der enthaltenen (vererbten) Rollen — transitiv ausgewertet; Zyklen werden beim Import nicht validiert, aber durch `visited`-Guard in der Aggregation abgefangen |
| `capabilityIds` | `string[]` | Ja | IDs der zugeordneten Fähigkeiten |
| `uiAccess` | `string[]` | Ja | Keys der zugänglichen UI-Typen (referenziert `UITypeEntry.key`) |
| `tableCrud` | `Record<string, CrudFlags>` | Ja | CRUD-Rechte; Map-Key = `TableEntry.key` |
| `createdAt` | `string` | Ja | ISO-8601-Timestamp |
| `updatedAt` | `string` | Ja | ISO-8601-Timestamp |

---

### CrudFlags

Quelle: `src/types/index.ts` → `interface CrudFlags`

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `create` | `boolean` | Ja | Create-Recht |
| `createFilter` | `string` | Nein | ServiceNow-Bedingungsausdruck, der das Create-Recht einschränkt |
| `read` | `boolean` | Ja | Read-Recht |
| `readFilter` | `string` | Nein | Filter für Read |
| `update` | `boolean` | Ja | Update-Recht |
| `updateFilter` | `string` | Nein | Filter für Update |
| `delete` | `boolean` | Ja | Delete-Recht |
| `deleteFilter` | `string` | Nein | Filter für Delete |

Filter-Strings enthalten ServiceNow-Encoded-Query-Ausdrücke, z.B. `assigned_toSTARTSWITH<me>` oder `contact EQ <me>`.

---

### Capability

Quelle: `src/types/index.ts` → `interface Capability`

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `id` | `string` | Ja | Eindeutige ID (nanoid) |
| `name` | `string` | Ja | Name der Fähigkeit (z.B. `"Incident erstellen"`) |
| `description` | `string` | Ja | Beschreibung (kann leer sein) |
| `category` | `string` | Ja | Kategorie (z.B. `"ITSM"`) |
| `createdAt` | `string` | Ja | ISO-8601-Timestamp |
| `updatedAt` | `string` | Ja | ISO-8601-Timestamp |

---

### UITypeEntry

Quelle: `src/types/index.ts` → `interface UITypeEntry`

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `id` | `string` | Ja | Eindeutige ID (nanoid) |
| `key` | `string` | Ja | Technischer Schlüssel (z.B. `agent_workspace`) — wird von `Role.uiAccess[]` referenziert |
| `label` | `string` | Ja | Anzeigename |
| `description` | `string` | Ja | Beschreibung |

---

### TableEntry

Quelle: `src/types/index.ts` → `interface TableEntry`

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `id` | `string` | Ja | Eindeutige ID (nanoid) |
| `key` | `string` | Ja | ServiceNow-Tabellenname (z.B. `incident`) — wird von `Role.tableCrud` als Map-Key verwendet |
| `label` | `string` | Ja | Anzeigename |
| `module` | `string` | Ja | Modul-Name (muss in `modules[]` vorhanden sein, sonst Anzeige unter "Sonstige") |

---

## Vollständiges Beispiel

```json
{
  "personas": [
    {
      "id": "pBx7kA9mQzR2nLsW3",
      "name": "IT Supporter",
      "description": "Bearbeitet Incidents und Service Requests",
      "color": "#3B82F6",
      "exampleUser": "Max Muster",
      "scope": "intern",
      "groupIds": ["gYn4dE1vKoT8uFpH2"],
      "createdAt": "2026-04-01T08:00:00.000Z",
      "updatedAt": "2026-04-15T14:30:00.000Z"
    }
  ],
  "groups": [
    {
      "id": "gYn4dE1vKoT8uFpH2",
      "name": "ITSM Supporter",
      "description": "Standardberechtigungen für ITSM-Supporter",
      "roleIds": ["rZq6cI3wJmN5xBvD7"],
      "createdAt": "2026-04-01T08:00:00.000Z",
      "updatedAt": "2026-04-15T14:00:00.000Z"
    }
  ],
  "roles": [
    {
      "id": "rZq6cI3wJmN5xBvD7",
      "name": "itil",
      "label": "ITIL",
      "description": "Standard-ITIL-Rolle für Supporter",
      "type": "base",
      "containsRoleIds": [],
      "capabilityIds": ["cAk8eO2hLpU6yGmS1"],
      "uiAccess": ["agent_workspace"],
      "tableCrud": {
        "incident": {
          "create": true,
          "read": true,
          "readFilter": "assigned_toSTARTSWITH<me>",
          "update": true,
          "delete": false
        },
        "problem": {
          "create": false,
          "read": true,
          "update": false,
          "delete": false
        }
      },
      "createdAt": "2026-04-01T08:00:00.000Z",
      "updatedAt": "2026-04-10T09:15:00.000Z"
    }
  ],
  "capabilities": [
    {
      "id": "cAk8eO2hLpU6yGmS1",
      "name": "Incident erstellen",
      "description": "Kann neue Incidents anlegen und zuweisen",
      "category": "ITSM",
      "createdAt": "2026-04-01T08:00:00.000Z",
      "updatedAt": "2026-04-01T08:00:00.000Z"
    }
  ],
  "uiTypes": [
    {
      "id": "ui_aw",
      "key": "agent_workspace",
      "label": "Agent Workspace",
      "description": "Next Experience – einheitliche Agenten-Oberfläche"
    }
  ],
  "tables": [
    {
      "id": "tbl_inc",
      "key": "incident",
      "label": "Incident",
      "module": "ITSM"
    },
    {
      "id": "tbl_prb",
      "key": "problem",
      "label": "Problem",
      "module": "ITSM"
    }
  ],
  "modules": ["ITSM", "Service Catalog", "Knowledge", "CMDB", "Platform"],
  "version": "2.1.0",
  "exportedAt": "2026-04-17T10:30:00.000Z"
}
```

---

## Import-Verhalten

Implementiert in `src/utils/jsonBackup.ts` (`importJSON`) und `src/store/index.ts` (`importState`).

### Validierung

Beim Import werden nur drei Felder auf Vorhandensein geprüft:

```
personas  →  Pflicht
roles     →  Pflicht
capabilities  →  Pflicht
```

Fehlt eines davon, wird die Datei mit dem Fehler `"Ungültiges Dateiformat: personas, roles oder capabilities fehlen."` abgelehnt.

### Fehlende optionale Felder

| Fehlendes Feld | Fallback |
|---|---|
| `groups` | `[]` (leeres Array) |
| `uiTypes` | `DEFAULT_UI_TYPES` aus `src/utils/constants.ts` |
| `tables` | `DEFAULT_TABLES` aus `src/utils/constants.ts` |
| `modules` | `DEFAULT_MODULES` aus `src/utils/constants.ts` |

### Kein Versions-Check

Das Feld `version` wird beim Import nicht ausgewertet. Eine Datei mit `"version": "1.0.0"` wird ohne Fehler importiert — aber Personas mit `roleIds` statt `groupIds` werden nach dem Import keine Gruppen/Rollen zeigen, da das Feld stillschweigend ignoriert wird.

### Keine Referenzintegritäts-Prüfung

Unbekannte IDs in `groupIds`, `roleIds`, `capabilityIds` oder ungültige `key`-Referenzen in `uiAccess`/`tableCrud` lösen keinen Fehler aus. Die entsprechenden Einträge werden beim Aggregieren einfach nicht gefunden.

---

## Export-Verhalten

Implementiert in `src/store/index.ts` (`exportState`) und `src/utils/jsonBackup.ts` (`exportJSON`).

`exportState()` erzeugt bei jedem Aufruf ein frisches Objekt:

```typescript
{
  personas, groups, roles, capabilities, uiTypes, tables, modules,
  version: SCHEMA_VERSION,   // aktuell "2.0.0"
  exportedAt: new Date().toISOString(),
}
```

Alle Arrays werden 1:1 aus dem Zustand übernommen — keine Filterung, keine Transformation. Der Export ist immer ein vollständiger Snapshot.

---

## Migration: v1 → v2

### Was sich geändert hat

In Schema-Version **1.x** hatten Personas direkte Rollenzuweisungen:

```json
{ "personas": [{ "roleIds": ["role1", "role2"] }] }
```

In **v2** ist eine `Group`-Zwischenschicht eingeführt. Personas tragen `groupIds`, Gruppen tragen `roleIds`:

```json
{
  "personas": [{ "groupIds": ["group1"] }],
  "groups":   [{ "id": "group1", "roleIds": ["role1", "role2"] }]
}
```

### Option A — Manuelle Migration per jq

Für jede Persona eine Default-Gruppe anlegen und die `roleIds` dorthin verschieben:

```bash
# Skelett — muss für jede Persona angepasst werden
jq '
  .groups = [
    {
      "id": "migrate-<PERSONA_ID>",
      "name": "<PERSONA_NAME>-Default",
      "description": "Migriert aus v1",
      "roleIds": .personas[] | select(.id == "<PERSONA_ID>") | .roleIds,
      "createdAt": now | todate,
      "updatedAt": now | todate
    }
  ] |
  .personas[] |= (
    .groupIds = ["migrate-\(.id)"] |
    del(.roleIds)
  ) |
  .version = "2.0.0"
' backup-v1.json > backup-v2.json
```

> Dieses Skelett zeigt die Struktur — für mehrere Personas muss das jq-Skript entsprechend erweitert werden.

### Option B — Neuanlage

Backup v1 importieren (geht fehlerfrei, aber Personas zeigen keine Rechte), dann manuell Gruppen anlegen und Personas zuordnen. Oder: Einstellungen → "Alles löschen" → alles neu anlegen.

---

## Sicherheit & Datenschutz

JSON-Backups können sensible Informationen enthalten:

- `Persona.exampleUser` — Namen realer Mitarbeiter
- `CrudFlags.xxxFilter` — ServiceNow-Abfrageausdrücke, die Berechtigungslogik offenlegen

Vor dem Teilen von Backups (z.B. in Issues, Tickets oder E-Mails) prüfen, ob diese Felder geleert oder anonymisiert werden müssen.
