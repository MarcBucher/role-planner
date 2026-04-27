# Multi-User-Kollaboration mit Supabase

## Context

Heute ist der **ServiceNow Role Planner** eine reine Browser-App (GitHub Pages, statisches Hosting) mit `localStorage`-Persistenz (`sn_role_planner_v2`). Es gibt keinen Backend, keinen User-Begriff, keine Synchronisation. Jede Person hat ihren eigenen, isolierten Stand auf ihrem Rechner.

Der Wunsch: **Mehrere Personen sollen gemeinsam an derselben Konfiguration arbeiten** — Personas, Gruppen, Rollen, Fähigkeiten, Tabellen-CRUD usw. zentral pflegen, ohne JSON-Backups hin- und herschicken zu müssen.

Gewählter Ansatz: **Supabase** (managed Postgres + Auth + Realtime). Funktioniert mit GitHub Pages (nur Browser-API-Calls), kostenlos im Free Tier, eingebauter Login + Echtzeit-Sync.

---

## Architektur-Überblick

```
Browser (React + Zustand)
   │
   ├─ Supabase Auth          → Login per E-Mail/Passwort, Magic Link
   ├─ Supabase REST/Postgres → CRUD auf alle Entitäten
   └─ Supabase Realtime      → WebSocket-Push bei Änderungen anderer User
                               → updated den Zustand-Store live
```

- **Login-Schritt** wird beim App-Start vorgeschaltet (Login-Seite ähnlich Dashboard).
- **Store** (`src/store/index.ts`) wird umgebaut: statt `persist`-Middleware (localStorage) schreiben die Actions direkt nach Supabase und hören per Realtime-Subscription auf Änderungen.
- **Workspace-Modell:** Ein `workspace`-Datensatz pro Konfiguration. User können einem Workspace per Einladungs-Code beitreten. Initial reicht **ein gemeinsamer Workspace** für dein Team — die Tabellenstruktur ist aber bereits multi-tenant-fähig.
- **Migration:** Beim ersten Login wird der lokale `localStorage`-Stand erkannt und der User wird gefragt, ob er ihn in den Workspace importieren will (einmaliger Vorgang).

---

## Datenmodell (Postgres)

Eine Tabelle pro Entität, jeweils mit `workspace_id` (FK), `created_at`, `updated_at`. **Wichtige Korrektur gegenüber dem aktuellen Code:** Heute referenzieren `role.uiAccess` (UITypes) und `role.tableCrud` (Tables) über den **Key (String)**, nicht über die ID. Bei gleichzeitigen Umbenennungen würden Referenzen brechen. Im neuen Schema werden diese Referenzen über **ID** gemacht (FK + Cascade).

```sql
-- Multi-tenant root
workspaces        (id, name, created_at)
workspace_members (workspace_id, user_id, role)  -- role: 'owner'|'editor'

-- Entitäten
personas      (id, workspace_id, name, color, scope, description, example_user, sort_order, created_at, updated_at)
persona_groups(persona_id, group_id)              -- M:N

groups        (id, workspace_id, name, description, sort_order, created_at, updated_at)
group_roles   (group_id, role_id)                 -- M:N

roles         (id, workspace_id, name, key, description, color, sort_order, created_at, updated_at)
role_inherits (role_id, parent_role_id)           -- Vererbung
role_capabilities (role_id, capability_id)        -- M:N

capabilities  (id, workspace_id, name, description, color, sort_order, created_at, updated_at)

tables        (id, workspace_id, name, key, description, sort_order, created_at, updated_at)
ui_types      (id, workspace_id, name, key, description, sort_order, created_at, updated_at)

-- Vorher key-basiert, jetzt id-basiert:
role_table_crud  (role_id, table_id, can_create, can_read, can_update, can_delete)
role_ui_access   (role_id, ui_type_id, level)     -- level: 'none'|'read'|'write'

-- Settings
workspace_settings (workspace_id, schema_version, ...)
```

**Row Level Security (RLS):** Pro Tabelle eine Policy "User darf nur Zeilen lesen/schreiben, wenn er Mitglied im `workspace_id` ist". Wird einmal als SQL hinterlegt.

---

## Datei-Änderungen

### Neue Dateien

| Datei | Zweck |
|---|---|
| `src/lib/supabase.ts` | Supabase-Client-Initialisierung (URL + Anon-Key aus `.env`) |
| `src/lib/sync.ts` | Sync-Layer: `loadWorkspace()`, `subscribeToWorkspace()`, mappt DB-Rows ↔ TS-Types |
| `src/pages/LoginPage.tsx` | Login-Maske (E-Mail/Passwort) |
| `src/pages/WorkspacePicker.tsx` | Wenn User in mehreren Workspaces ist: Auswahl |
| `src/components/auth/AuthGuard.tsx` | Wrapper, blockt Routen wenn nicht eingeloggt |
| `src/hooks/useAuth.ts` | Hook für aktuellen User + Logout |
| `supabase/migrations/0001_init.sql` | Schema + RLS-Policies (Single-Source-of-Truth, einmal in Supabase einspielen) |
| `.env.local` (gitignored) | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |
| `.env.example` | Beispieldatei mit leeren Werten — eingecheckt |

### Geänderte Dateien

| Datei | Änderung |
|---|---|
| `src/store/index.ts` | `persist`-Middleware **entfernen**. Jede Action ruft Supabase auf (`upsert`/`delete`) und aktualisiert anschließend den lokalen State. Ein neuer `hydrate()`-Aufruf lädt den Workspace beim Login. Realtime-Subscriptions aktualisieren den State bei Fremdänderungen. |
| `src/types/index.ts` | `Role.uiAccess` und `Role.tableCrud` von **Key-basiert auf ID-basiert** umstellen (Breaking, aber lokal migrierbar). `Workspace`-Typ + `WorkspaceMember`-Typ ergänzen. `AppState` um `currentWorkspaceId`, `currentUser`, `syncStatus` erweitern. |
| `src/utils/constants.ts` | `STORAGE_KEY` bleibt nur noch für die einmalige Migration relevant. |
| `src/App.tsx` | Routen mit `<AuthGuard>` umhüllen. `/login`-Route hinzu. |
| `src/main.tsx` | Supabase-Client beim Bootstrap initialisieren. |
| `src/pages/EinstellungenPage.tsx` | Reset-Button → löscht **nur Workspace-Daten** (mit Bestätigung). Backup/Import → arbeitet weiter mit JSON, schreibt aber in Supabase statt localStorage. **Workspace-Mitglieder verwalten** als neuer Bereich (einladen per E-Mail, entfernen). |
| `src/components/roles/RoleForm.tsx` + alle Stellen, die `role.tableCrud[tableKey]` / `role.uiAccess[uiTypeKey]` lesen | Auf ID-basierte Lookups umstellen. Betrifft auch: `src/components/matrices/RoleTableCrudMatrix.tsx`, `RoleUiAccessMatrix.tsx`, Excel-Export-Logik. |
| `src/utils/jsonBackup.ts` | Beim Import: Keys → IDs auflösen. Beim Export: ID-basiert (Format-Version `3.0.0`). |
| `package.json` | `@supabase/supabase-js` als Dependency. |

### Migrations-Helper (einmalig)

`src/utils/migrateLocalToSupabase.ts` — liest `localStorage['sn_role_planner_v2']`, baut die ID-basierten Referenzen aus den Keys auf und ruft pro Entität Bulk-Inserts gegen Supabase auf. Wird beim ersten Login gezeigt: "Lokalen Stand in Workspace 'X' importieren?" → einmaliger Knopf, danach wird `localStorage` archiviert (umbenannt, nicht gelöscht — als Sicherheitsnetz).

---

## Realtime-Sync-Strategie

- **Pro Workspace** eine einzige Realtime-Channel-Subscription beim Login.
- Channel hört auf `*`-Events (INSERT/UPDATE/DELETE) auf allen Workspace-Tabellen, gefiltert per `workspace_id`.
- Eingehende Events → Store-Action `applyRemoteChange(table, op, row)` aktualisiert nur den betroffenen Eintrag (kein Full-Reload).
- **Optimistic UI:** Lokale Änderungen werden sofort im State sichtbar; bei Fehler vom Server wird zurückgerollt + Toast gezeigt.
- Bei Verbindungsabbruch: Indikator in der TopBar ("Offline — Änderungen werden gespeichert wenn wieder verbunden") + Reconnect-Logik.

---

## Sicherheit

- **Anon-Key ist öffentlich** (das ist Designintent von Supabase) — Sicherheit kommt aus den **RLS-Policies**, nicht aus Geheimhaltung.
- RLS-Policy für jede Tabelle: `auth.uid() IN (SELECT user_id FROM workspace_members WHERE workspace_id = NEW.workspace_id)`.
- Service-Role-Key wird **nirgends** im Frontend benutzt.

---

## Umsetzungsschritte (Reihenfolge)

1. **Supabase-Projekt anlegen** (du, ~5 Min, Web-Konsole). URL + Anon-Key in `.env.local`.
2. **Schema anlegen** (`supabase/migrations/0001_init.sql` lokal schreiben, in Supabase SQL-Editor einspielen).
3. **`role.uiAccess` und `role.tableCrud` lokal auf ID-basiert refactoren** (noch ohne Supabase, rein im Code + lokaler Migration für `localStorage`-User). Ein Schritt für sich, mit Tests.
4. **Supabase-Client + Auth-Guard** einbauen, Login-Seite. App nach Login zeigt leeren Workspace.
5. **Sync-Layer** — `hydrate()` lädt aus Supabase, alle Store-Actions schreiben dorthin.
6. **Realtime-Subscriptions** ergänzen.
7. **Migrations-Dialog**: lokale Daten in Supabase importieren.
8. **Workspace-Mitglieder verwalten** in Einstellungen (Einladen per E-Mail, Rolle vergeben).
9. **Deployen** auf GitHub Pages — `.env.local` wird beim Build (`vite build`) eingebettet, GitHub-Actions-Secret nötig.

---

## Verifikation

**Lokal:**
- [ ] `npm run dev` startet ohne Fehler, Login-Seite erscheint
- [ ] Registrierung neuer User funktioniert (E-Mail-Bestätigung in Supabase Auth-Logs sichtbar)
- [ ] Nach Login: Workspace wird geladen, alle Entitäten sichtbar
- [ ] CRUD auf Personas/Gruppen/Rollen/Fähigkeiten/Tabellen/UI-Typen schreibt nach Supabase (in Supabase Table-Editor verifizierbar)
- [ ] Matrizen funktionieren wie vorher (Persona×Gruppe, Gruppe×Rolle, Rolle×Rolle, Rolle×Fähigkeit, Rolle×UI, Tabellen-CRUD)
- [ ] Excel-Export liefert identisches Ergebnis wie vor dem Umbau
- [ ] JSON-Backup-Import lädt Daten in Supabase

**Multi-User-Test (zwei Browser-Profile):**
- [ ] User A legt Persona an → erscheint bei User B in <2 s ohne Reload
- [ ] User A löscht Rolle → bei User B verschwindet sie sofort, abhängige Referenzen bleiben konsistent
- [ ] Beide ändern gleichzeitig dieselbe Persona → letzte Änderung gewinnt, kein Crash, Toast zeigt Hinweis
- [ ] User B wird aus Workspace entfernt → bekommt 403 beim nächsten Schreibvorgang, wird zur Login-Seite umgeleitet

**Migrations-Test:**
- [ ] Bestehender User mit `localStorage`-Daten loggt sich erstmals ein → Migrations-Dialog erscheint
- [ ] Nach Import: alle Daten in Supabase sichtbar, IDs konsistent (kein Key-Mismatch bei `role.uiAccess`/`role.tableCrud`)

**Sicherheit:**
- [ ] User aus Workspace A kann Workspace B nicht lesen (manuell via SQL prüfen + im Frontend)
- [ ] Anon-Key allein erlaubt **kein** Schreiben ohne Login (RLS blockt)

---

## Kritische Dateien (Quick-Ref)

| Datei | Aktuelle Zeilen | Neuer Zustand |
|---|---|---|
| `src/store/index.ts` | 88-389 | Persist-Middleware raus, Sync-Layer rein, Realtime-Handler |
| `src/types/index.ts` | 79-89 (`AppState`) | `Workspace`, `User`, ID-basierte Referenzen |
| `src/utils/constants.ts` | 31-32 | `STORAGE_KEY` nur noch für Migration |
| `src/main.tsx` | 6-10 | Supabase-Client-Init |
| `src/App.tsx` | 21-50 | `<AuthGuard>` + `/login` Route |
| `src/pages/EinstellungenPage.tsx` | 1-138 | Mitglieder-Verwaltung ergänzen, Reset auf Workspace-Scope |
| `src/utils/jsonBackup.ts` | 1-33 | Format-Version `3.0.0` mit ID-Referenzen |

---

## Aufwandsschätzung

- **Schritt 1-3** (Supabase-Setup + ID-Refactor): ~1 Tag
- **Schritt 4-7** (Auth + Sync + Migration): ~2 Tage
- **Schritt 8-9** (Mitglieder-UI + Deploy): ~0.5 Tage
- **Tests + Polish:** ~0.5 Tage

**Gesamt: ~4 Arbeitstage** für eine saubere Umsetzung.

---

## Was bewusst **nicht** Teil dieses Plans ist

- Versionsverlauf / "wer hat was geändert" (Audit-Log) — wäre ein eigenes Feature, leicht nachrüstbar mit zusätzlicher `audit_log`-Tabelle.
- Konflikt-Resolution feiner als "letzter gewinnt" — bei dieser App-Größe ausreichend, später bei Bedarf mit `version`-Spalte + optimistic locking.
- Offline-Editing mit späterem Sync — Komplexität nicht gerechtfertigt, da Tool typischerweise im Büro-Browser genutzt wird.
- Eigene Hosting-Variante (Self-hosted Supabase) — Free Tier reicht aus, kann später migriert werden.
