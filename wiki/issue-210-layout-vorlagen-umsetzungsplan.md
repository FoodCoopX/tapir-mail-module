# Umsetzungsplan – Issue #210: Zweiter Vorlagen-Typ „Layout"

Referenz: https://github.com/FoodCoopX/tapir-mail-module/issues/210

Autor: Umsetzungsplan (technisch)
Stand: 2026-10-30
Basis: `master` @ `48c450e`

---

## 1. Ziel

Vorlagen (`EmailTemplate`) bekommen einen Typ:

- **Start-Vorlage** (`start`): bisheriges Verhalten – befüllt den Editor mit Inhalt.
- **Layout-Vorlage** (`layout`): wiederverwendbarer MJML-Rahmen (Kopf-/Fußzeile, Design) mit
  Pflicht-Platzhalter `{{Body}}`. Beim Versand wird der Body der E-Mail in diesen Rahmen
  eingesetzt. Eine Layout-Vorlage kann als **globaler Standard** markiert werden.

E-Mails (genauer: `EmailConfigurationVersion`) wählen optional ein Layout; ohne explizite Auswahl
greift der globale Standard. **Vorschau** und **Testmail** zeigen den gerenderten Layout+Body.
**Bestehende E-Mails bleiben unverändert**, bis sie erneut gespeichert/veröffentlicht werden.

### Akzeptanzkriterien

| # | Kriterium | Umsetzung |
|---|-----------|-----------|
| A1 | Vorlagen haben einen Typ (Start vs. Layout) | `EmailTemplate.template_type` + UI-Auswahl |
| A2 | Layout-Vorlage muss `{{Body}}` enthalten; als Standard markierbar | Serializer-/Model-Validierung, `is_default_layout` + DB-Constraint |
| A3 | Beim Versand wird gewähltes/Standard-Layout um den Body gelegt | Service `apply_layout`, verdrahtet in Versand + Dispatch-Erzeugung |
| A4 | Vorschau und Testmail zeigen gerendertes Layout+Body | Preview-Endpoint + UI-Vorschau; Testmail nutzt denselben Merge-Pfad |
| A5 | Bestehende E-Mails unverändert bis erneutes Speichern | Neues Flag `layout_enabled` (Default `False`), wird nur bei neuem Speichern gesetzt |

---

## 2. Ist-Zustand (relevante Architektur)

**Backend**

- `tapir_mail/models.py`
  - `EmailTemplate`: `id`, `created_at`, `updated_at`, `name` (unique), `content` (MJML-Text).
  - `EmailConfigurationVersion`: u. a. `content` (vollständiges MJML-Dokument), `subject`, `status`,
    `triggers`, Segmente. Wird beim Bearbeiten einer veröffentlichten Konfiguration als **neue
    Draft-Version** angelegt (`views.py::EmailConfigurationVersionViewSet.create/update`).
- `tapir_mail/service/token.py`: `find_tokens`, `replace_tokens` (Token-Syntax `{{Typ.Key}}`,
  strict validation).
- `tapir_mail/service/mail_content_validator.py`: `validate_tokens` prüft Inhalt gegen Registry.
- `tapir_mail/service/email.py`: `prepare_email(mjml, ...)` → `mjml2html`.
- `tapir_mail/service/email_dispatch.py`:
  - `_create_email_dispatches`: `find_tokens(version.content, ...)` → Empfänger-/Dynamic-Tokens.
  - `SendEmailBatch._prepare_emails`: `replace_tokens(version.content, ...)` → `prepare_email(...)`.
- `tapir_mail/service/email_configuration_version_release_validator.py`: Freigabe-Checks.
- `tapir_mail/views.py`:
  - `EmailTemplateViewSet` / `PaginatedEmailTemplateViewSet` (ModelViewSet).
  - `EmailConfigurationVersionViewSet`: `create`, `update`, `get_bundled_info`, `send_test_email`.
  - `EmailConfigurationViewSet.duplicate` / `duplication_best_version` (kopiert Versionfelder).
  - `CreateMissingTriggerMailView` (legt Version direkt an).
- `tapir_mail/serializers.py`: `EmailTemplateSerializer` (`fields="__all__"`),
  `BundledEmailConfigurationSerializer`, `EmailConfigurationVersionSerializer` (`fields="__all__"`).
- `schema.yml`: generierter OpenAPI-Client für das React-Frontend (`scripts/generate_api_clients.sh`).

**Frontend** (`tapir_mail_ui/src`)

- `utils/mjml.ts`: `jsonToMjml`, `mjmlToJson`, `mjmlToHtml` (clientseitig via `mjml-browser`).
- `components/editor.tsx`: easy-email-Editor, `EMPTY_PAGE`, Merge-Tags.
- `pages/template-editor.tsx`: Vorlagen-Editor (Name + Inhalt).
- `components/dashboard/TemplatesCard.tsx`: Vorlagen-Liste (Name, Daten, Löschen).
- `pages/email-configuration/editor.tsx`: E-Mail-Konfiguration inkl. „Template auswählen"
  (Start-Vorlagen laden), Segment-, Trigger-Auswahl, Speichern/Veröffentlichen, easy-email-Editor.
- `components/dashboard/SendTestMailModal.tsx` + `EmailConfigurationVersionApi.sendTestEmail`.

**Versandkette**

`replace_tokens(version.content)` → `prepare_email(mjml)` → `mjml2html` → Tracking-Pixel →
Versand. Layout muss vor der Token-Ersetzung um den Body gelegt werden.

---

## 3. Fachliches Design

### 3.1 Merge-Semantik Layout + Body

- `version.content` und `layout.content` sind **vollständige MJML-Dokumente**
  (`<mjml><mj-head>…</mj-head><mj-body>…</mj-body></mjml>`).
- Der Platzhalter `{{Body}}` steht **innerhalb** des `<mj-body>` der Layout-Vorlage.
- Der Body wird als **innerer Inhalt** des `<mj-body>` der E-Mail eingesetzt:

```
effective_mjml = layout_mjml  mit  {{Body}}  ersetzt durch  innerer Inhalt von body_mjmls <mj-body>
```

Konkret:

```python
MJ_BODY_RE  = re.compile(r"<mj-body[^>]*>(.*)</mj-body>", re.DOTALL)
BODY_TOKEN_RE = re.compile(r"\{\{\s*Body\s*\}\}")

def extract_mj_body_inner(mjml: str) -> str:
    m = MJ_BODY_RE.search(mjml)
    return m.group(1) if m else mjml
```

**Konsequenzen / bewusste Festlegungen**

- Die `<mj-body>`-Attribute der E-Mail (z. B. `background-color`, `width`) werden **nicht**
  übernommen – der Rahmen kommt aus dem Layout.
- Das `<mj-head>` der E-Mail wird verworfen; Styles/Fonts gehören in die Layout-Vorlage.
  (Für Bestands-Mails ohne Layout ändert sich nichts, siehe 3.4.)
- Im Rahmen bleibt nur `{{Body}}` als Sonderplatzhalter. Alle anderen Tokens werden weiterhin
  über die Token-Registry aufgelöst.

### 3.2 Verarbeitungsreihenfolge (einheitlich überall)

1. Effektives MJML bestimmen: `layout ? apply_layout(body, layout) : body`.
2. `replace_tokens(effective_mjml, recipient_tokens, additional_tokens, strict=…)`.
3. `prepare_email(mjml)` → `mjml2html`.

Für die **Dispatch-Erzeugung** (`find_tokens`) wird ebenfalls das effektive MJML verwendet, damit
Tokens, die **nur im Layout** vorkommen (z. B. allgemeine Tokens/Abmeldelinks), gefunden und beim
Versand korrekt ersetzt werden.

### 3.3 Layout-Auflösung

```
def get_effective_layout(version) -> EmailTemplate | None:
    if not version.layout_enabled:            # Altbestand / nie neu gespeichert
        return None
    if version.layout_template_id:            # explizite Auswahl
        return version.layout_template
    return EmailTemplate.objects.filter(
        template_type=LAYOUT, is_default_layout=True
    ).first()                                  # globaler Standard (live)
```

- „jeweils aktueller Layout-Rahmen": Der globale Standard und die Layout-Inhalte werden **zur
  Versand-/Dispatch-Zeit** aufgelöst (Live-FK, kein Snapshot).
- Wurde ein explizites Layout gelöscht (`on_delete=SET_NULL`), fällt die Version auf den globalen
  Standard zurück.

### 3.4 Bestehende E-Mails unverändert (A5)

- Neues Feld `EmailConfigurationVersion.layout_enabled` (Boolean, **Default `False`**).
  Die Migration setzt es für alle Bestandszeilen auf `False`.
- `layout_enabled=False` → **kein** Layout (exakt heutiges Verhalten).
- Jeder Schreibvorgang über die (neue) UI setzt `layout_enabled=True`; zusammen mit
  `layout_template_id` (nullable → globaler Standard) ergibt das drei Zustände:

  | layout_enabled | layout_template | Bedeutung |
  |---|---|---|
  | False | – | Altbestand, kein Layout (unverändert) |
  | True | gesetzt | explizit gewähltes Layout |
  | True | NULL | globaler Standard |

- Veröffentlichte Versionen mit bereits geplanten/versendeten Dispatches behalten
  `layout_enabled=False` und bleiben unverändert. Beim Bearbeiten wird eine **neue Draft-Version**
  angelegt und erhält `layout_enabled=True`.
- `CreateMissingTriggerMailView` und `duplication_best_version` erzeugen neue Versionen → dort
  `layout_enabled=True` setzen (siehe 6).

### 3.5 Vorschau (A4)

Der easy-email-Editor zeigt standardmäßig nur den Body. Für die geforderte Layout-Vorschau wird
eine **eigene Vorschau** ergänzt, die den Merge serverseitig (Single Source of Truth) rendert:

- Neuer Endpoint `POST /api/email_configuration_version/preview/`
  Request `{ "content": "<mjml>", "layoutTemplateId": "<id|null>" }`
  Response `{ "html": "<rendered html>" }`.
- Nutzt `render_email_mjml` + `mjml2html`. `content` darf ungespeicherter Draft-Content sein
  (die Vorschau muss vor dem Speichern funktionieren).
- UI: Button „Vorschau im Layout" im E-Mail-Editor öffnet ein Modal mit `<iframe srcdoc={html}>`.
- **Testmail** nutzt denselben Merge-Pfad serverseitig (keine UI-Änderung nötig, siehe 6.6).

> Alternative (nicht empfohlen): Merge im Browser via `utils/mjml.ts` duplizieren. Vermeidet
> einen Round-Trip, riskiert aber Drift zwischen Python- und TS-Implementierung.

---

## 4. Datenmodell im Detail

### 4.1 `EmailTemplate`

```python
class EmailTemplateType(models.TextChoices):
    START = "start", _("Start-Vorlage")
    LAYOUT = "layout", _("Layout-Vorlage")

class EmailTemplate(BaseModel):
    name = models.CharField(max_length=255, unique=True)
    content = models.TextField()
    template_type = models.CharField(
        max_length=16, choices=EmailTemplateType.choices, default=EmailTemplateType.START
    )
    is_default_layout = models.BooleanField(default=False)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["is_default_layout"],
                condition=Q(is_default_layout=True),
                name="unique_default_layout_template",
            )
        ]
```

- Der partielle Unique-Index enthält nur Zeilen mit `True` → höchstens ein Standard-Layout
  (PostgreSQL). Zusätzlich Absicherung im Serializer (siehe 6.2).
- `SearchVector`/Admin nicht betroffen (`admin.py` ist leer).

### 4.2 `EmailConfigurationVersion`

```python
layout_template = models.ForeignKey(
    EmailTemplate, on_delete=models.SET_NULL, null=True, blank=True, related_name="versions_using_layout"
)
layout_enabled = models.BooleanField(default=False)
```

### 4.3 `EmailConfigurationDispatch` / `EmailDispatch`

Keine Schemaänderung. Tokens werden weiterhin pro Dispatch gespeichert, nun aus dem effektiven MJML
ermittelt (siehe 6.4).

---

## 5. Migrationen (`tapir_mail/migrations/`)

- `0050_emailtemplate_layout_type.py`
  - `AddField EmailTemplate.template_type` (default `start`)
  - `AddField EmailTemplate.is_default_layout` (default `False`)
  - `AddConstraint unique_default_layout_template` (partieller Unique-Index)
- `0051_emailconfigurationversion_layout.py`
  - `AddField EmailConfigurationVersion.layout_template` (FK, null, `SET_NULL`)
  - `AddField EmailConfigurationVersion.layout_enabled` (default `False`)
- Optionaler `RunPython`-Schritt: keine Datenmigration nötig (alle Bestands-Vorlagen werden durch
  `default=start` zu Start-Vorlagen; alle Bestands-Versionen bleiben `layout_enabled=False`).
- Migration mit `python manage.py makemigrations tapir_mail` erzeugen und auf PostgreSQL testen
  (`docker compose run --rm web poetry run python manage.py migrate`).

---

## 6. Backend-Änderungen

### 6.1 Neuer Service `tapir_mail/service/layout.py`

```python
MJ_BODY_RE = re.compile(r"<mj-body[^>]*>(.*)</mj-body>", re.DOTALL)
BODY_TOKEN_RE = re.compile(r"\{\{\s*Body\s*\}\}")

def extract_mj_body_inner(mjml: str) -> str: ...
def layout_contains_body_token(content: str) -> bool: ...
def apply_layout(body_mjml: str, layout_mjml: str) -> str:
    if not layout_contains_body_token(layout_mjml):
        raise TapirMailException("Layout-Vorlage enthält keinen {{Body}}-Platzhalter")
    return BODY_TOKEN_RE.sub(lambda _: extract_mj_body_inner(body_mjml), layout_mjml)
def get_effective_layout(version) -> EmailTemplate | None: ...   # siehe 3.3
def render_email_mjml(version) -> str: ...                       # layout ? apply_layout : content
```

### 6.2 `tapir_mail/serializers.py`

- **`EmailTemplateSerializer`**: Validierung ergänzen
  - `template_type == layout` ⇒ `content` muss `{{Body}}` enthalten (sonst `ValidationError`).
  - `is_default_layout == True` nur bei `template_type == layout`.
  - Beim Speichern mit `is_default_layout=True`: innerhalb einer Transaktion andere Layouts auf
    `False` setzen (robuste Alternative/Ergänzung zum DB-Constraint).
  - Token-Validierung der Layout-Vorlage: `{{Body}}` vor `MailContentValidator.validate_tokens`
    entfernen (z. B. `content.replace("{{Body}}", "")`), damit `Body` nicht als unbekannter Token
    gemeldet wird.
- **`BundledEmailConfigurationSerializer`**: Felder `layout_template_id`
  (`CharField`, `allow_null`, `required=False`) und `layout_enabled`
  (`BooleanField`, `required=False`) ergänzen.
- `EmailConfigurationVersionSerializer` (`fields="__all__"`) exponiert die neuen Felder automatisch.

### 6.3 `tapir_mail/views.py` – `EmailConfigurationVersionViewSet`

- `create` / `update`: `layout_template_id` und `layout_enabled` aus validierten Daten setzen.
  - Beim `update` einer Bestandsversion, die über die UI gespeichert wird: `layout_enabled=True`.
  - `layout_template_id` validieren (existiert & ist Layout-Vorlage), sonst 400.
- `get_bundled_info`: `layoutTemplateId` und `layoutEnabled` mitliefern.
- Neuer `@action(detail=False, methods=["POST"])` **`preview`**: rendert `content` + Layout zu HTML
  (siehe 3.5).
- `send_test_email`: statt `replace_tokens(version.content, ...)` →
  `replace_tokens(render_email_mjml(version), ...)`; danach `prepare_email`.
- `CreateMissingTriggerMailView`: neue Version mit `layout_enabled=True` anlegen
  (globaler Standard greift).

### 6.4 `tapir_mail/service/email_dispatch.py`

- `_create_email_dispatches`: `find_tokens(render_email_mjml(version), ...)` für Recipient- und
  Dynamic-Tokens (statt nur `version.content`).
- `SendEmailBatch._prepare_emails`:
  `mjml = replace_tokens(render_email_mjml(version), email_dispatch.recipient_tokens, email_dispatch.additional_tokens)`.
- `_get_bcc_provider` / `_post_send` unverändert.

### 6.5 `tapir_mail/service/email_configuration_version_release_validator.py`

- Optional: keine Änderung nötig (Layout ist pro Version optional). Falls gewünscht, kann ein
  Layout-Vorhandensein erzwungen werden – **nicht** Teil der Issue-Anforderung.

### 6.6 `tapir_mail/views.py` – `EmailConfigurationViewSet.duplicate`

- `duplication_best_version.fields_to_copy` um `layout_template_id` (bzw. `layout_template`) und
  `layout_enabled` erweitern, damit Duplikate das Layout übernehmen.

### 6.7 `tapir_mail/models.py`

- Modelle/Felder wie in Abschnitt 4; `from django.db.models import Q` ist bereits importiert.

---

## 7. API / Client

- Nach Backend-Änderung: OpenAPI-Schema neu generieren und Client bauen:
  ```shell
  docker compose run --rm react bash ./scripts/generate_api_clients.sh
  ```
  (`schema.yml` wird dabei mit aktualisiert; `tapir_mail_ui/src/api_client` ist gitignored und wird
  in CI erzeugt.)
- `EmailTemplate`-Client erhält `templateType`, `isDefaultLayout`; `BundledEmailConfigurationRequest`
  erhält `layoutTemplateId`, `layoutEnabled`; neuer Preview-Endpoint.

---

## 8. Frontend-Änderungen (`tapir_mail_ui/src`)

### 8.1 Vorlagen-Verwaltung

- `components/dashboard/TemplatesCard.tsx`
  - Spalte „Typ" (Start-/Layout-Vorlage), ggf. Badge „Standard".
  - Anlegen: Typ-Auswahl vor dem Wechsel in den Editor (oder Auswahl im Editor).
- `pages/template-editor.tsx`
  - Typ (`start`/`layout`) laden/speichern (`templateType`).
  - Checkbox „Als Standard-Layout verwenden" (nur bei `layout`).
  - Merge-Tag `Body` im Editor anbieten, damit Nutzer `{{Body}}` platzieren können.
  - Speichern erst erlauben, wenn bei `layout` `{{Body}}` im Inhalt enthalten ist; sonst Hinweis.
- `components/editor.tsx`
  - Optional: `mergeTags` um `{"Body": "{{Body}}"}` ergänzen; ggf. Hinweisblock im Layout-Modus.

### 8.2 E-Mail-Konfiguration

- `pages/email-configuration/editor.tsx`
  - Layout-Templates von Start-Templates trennen (`template.templateType`).
  - Neues Auswahlfeld „Layout" mit Optionen:
    „Standard-Layout" (globaler Default, `layoutTemplateId = null`) und alle Layout-Vorlagen.
  - `layoutTemplateId` + `layoutEnabled` in `saveVersion` mitschicken (immer `layoutEnabled=true`
    beim Speichern über die UI).
  - Beim Laden (`getBundledInfo`) `layoutTemplateId`/`layoutEnabled` übernehmen.
  - Button „Vorschau im Layout" → Modal mit `<iframe>` (Inhalt vom Preview-Endpoint;
    aktuelle Editor-Werte via `jsonToMjml(content)` + `layoutTemplateId`).
  - Bestehende „Template auswählen"-Dropdown auf Start-Vorlagen beschränken.
- `components/dashboard/SendTestMailModal.tsx`: keine fachliche Änderung (Server merged). Optional:
  Vorschau-Link ergänzen.

### 8.3 Neue/angepasste Komponenten

- `components/PreviewModal.tsx` (neu, optional wiederverwendbar): iframe-Anzeige des HTML.
- `utils/mjml.ts`: unverändert (Merge serverseitig).

---

## 9. Tests

### 9.1 Backend

Neu (`tapir_mail/tests/unit/test_Layout.py`):
- `apply_layout` ersetzt `{{Body}}` durch den inneren `<mj-body>`-Inhalt; Attribute/Head des Bodys
  werden verworfen.
- Kein Layout / `layout_enabled=False` ⇒ `render_email_mjml` liefert unveränderten Content.
- Layout ohne `{{Body}}` ⇒ Exception.
- Toleranz für Whitespace `{{ Body }}`.

Neu/erweitert (`tapir_mail/tests/integration/...`):
- `EmailTemplateViewSet`: Layout ohne `{{Body}}` ⇒ 400; Standard nur bei Layout-Typ; nur ein
  Standard-Layout gleichzeitig (Constraint/Serializer).
- `SendEmailBatch` / `test_SendEmailBatch.py`:
  - Version mit `layout_enabled=True`, explizites Layout ⇒ gesendete HTML enthält Rahmen + Body.
  - Version mit `layout_enabled=True`, kein Layout ⇒ globaler Standard greift.
  - Version mit `layout_enabled=False` (Altbestand) ⇒ HTML unverändert (kein Layout).
  - Tokens ausschließlich im Layout werden korrekt ersetzt.
- `test_EmailConfigurationVersionViewSet_send_test_email.py`: Testmail enthält Layout+Body.
- `test_EmailConfigurationVersionViewSet_create/update.py`: Felder werden gespeichert/geladen.
- Preview-Endpoint: liefert HTML mit Rahmen; ohne Layout-ID → Standard.
- `CreateMissingTriggerMailView`: neue Version hat `layout_enabled=True`.
- Duplikat übernimmt Layout.

**Test-Utilities/Factories** (`tapir_mail/tests/factories.py`):
- `EmailTemplateFactory`: `template_type`-Default `start`; Param/SubFactory für `layout`.
- `EmailConfigurationVersionFactory`: Params `layout_enabled`, `layout_template`.
- Neue Fixture-MJML für ein Layout mit `{{Body}}` (z. B.
  `tapir_mail/tests/dummy_layout_template_content.mjml`).

### 9.2 Frontend

- `TemplatesCard`: Typ-Spalte / Filter.
- `email-configuration/editor`: Layout-Auswahl, Vorschau-Aufruf (Mock) — soweit mit RTL sinnvoll.
- Vorhandene Tests (`utils/formatDate.test.ts`, `media_library`, `dateTimePicker`) dürfen nicht
  brechen.

---

## 10. Schritt-für-Schritt-Umsetzung (Slices)

Jeder Slice ist eigenständig lauffähig/testbar.

1. **Slice 1 – Datenmodell & Service (Backend-Kern)**
   - Modelle/Felder + Migrationen (`0050`, `0051`).
   - `service/layout.py` (`extract_mj_body_inner`, `apply_layout`, `get_effective_layout`,
     `render_email_mjml`).
   - Unit-Tests `test_Layout.py`.
2. **Slice 2 – Versand-Integration**
   - `email_dispatch.py` (Token-Suche + `_prepare_emails`), `send_test_email`.
   - Integrationstests Versand/Testmail/Altbestand.
3. **Slice 3 – Vorlagen-API & -Validierung**
   - `EmailTemplateSerializer`-Validierung, Default-Logik, DB-Constraint-Test.
   - `duplication_best_version`, `CreateMissingTriggerMailView`.
4. **Slice 4 – Version-API & Preview-Endpoint**
   - `create`/`update`/`get_bundled_info`, Preview-Endpoint.
   - Schema/Client regenerieren.
   - API-Integrationstests.
5. **Slice 5 – Frontend Vorlagen**
   - `TemplatesCard`, `template-editor` (Typ, Standard, `{{Body}}`-Prüfung).
6. **Slice 6 – Frontend E-Mail-Konfiguration & Vorschau**
   - Layout-Auswahl, Speichern/Laden, Preview-Modal.
   - Frontend-Tests.
7. **Slice 7 – Doku & Feinschliff**
   - README/Wiki-Ergänzung (Layout-Nutzung, `{{Body}}`), Prettier/Black, manuelle Abnahme.

---

## 11. Akzeptanzkriterien-Mapping

| Kriterium | Betroffene Artefakte | Nachweis |
|---|---|---|
| A1 Typ | 4.1, 6.2, 8.1 | Serializer-Test + UI-Typ-Spalte |
| A2 `{{Body}}` Pflicht + Standard | 4.1, 6.2, 8.1 | 400 bei fehlendem Token, Constraint-Test |
| A3 Layout beim Versand | 6.1, 6.4 | `test_SendEmailBatch` (Rahmen+Body im `mail.outbox`) |
| A4 Vorschau + Testmail | 3.5, 6.3, 8.2 | Preview-/Testmail-Integrationstests |
| A5 Altbestand unverändert | 3.4, 5 | Test mit `layout_enabled=False` ⇒ HTML wie zuvor |

---

## 12. Risiken & Edge Cases

- **Head/Fonts gehen verloren**: Der Body-`<mj-head>` wird verworfen. Fonts/Styles müssen in der
  Layout-Vorlage definiert werden. Beim Umstellen von Bestands-Mails (erstes Speichern) prüfen, ob
  im Body verwendete Custom-Fonts im Layout vorhanden sind. → Doku/Hinweis in der UI.
- **Layout nach Dispatch-Erzeugung geändert**: Tokens werden bei Dispatch-Erzeugung aus dem
  effektiven MJML ermittelt und am Dispatch gespeichert. Wird das Layout danach geändert und
  referenziert neue Tokens, kann `replace_tokens` (strict) fehlschlagen → Mail landet in `error`.
  Bewusste Einschränkung; optional als Folge-Issue.
- **`{{Body}}` mehrfach im Layout**: `re.sub` ersetzt alle Vorkommen; im Editor/Validator nicht
  verbieten (harmlos). Entscheidung: zulassen.
- **Layout-Vorlage gelöscht**: FK `SET_NULL` → Rückfall auf globalen Standard; ohne Standard ⇒ kein
  Layout.
- **Kein Standard-Layout vorhanden**: Neue E-Mails mit `layout_enabled=True` und ohne explizites
  Layout werden ohne Rahmen versendet (wie heute). UI sollte darauf hinweisen.
- **Standard-Wechsel**: Wirkt sich live auf alle Versionen aus, die den Standard nutzen
  (gewünscht: „jeweils aktueller Rahmen"). Explizit gewählte Layouts bleiben unberührt.
- **`{{Body}}` vs. Token-Validator**: Vor `validate_tokens`/`find_tokens`/`replace_tokens` immer
  erst mergen; `Body` nie als Token behandeln.
- **Migration auf PostgreSQL**: partielle Unique-Constraints werden unterstützt (ArrayField bereits
  im Einsatz). SQLite-Tests ggf. einschränken.

---

## 13. Offene Entscheidungen

1. **Speicherort der Layout-Wahl**: pro `EmailConfigurationVersion` (empfohlen, siehe 3.4/4.2) vs.
   pro `EmailConfiguration`. Pro Version ist konsistent mit „Umstellung beim nächsten Speichern".
2. **`CreateMissingTriggerMailView`**: `layout_enabled=True` (empfohlen) vs. `False`
   (unverändertes Verhalten für automatisch erzeugte Trigger-Mails).
3. **Preview-Technik**: Backend-Endpoint (empfohlen, Single Source of Truth) vs. Client-Merge.
4. **Ausschlussregel für `{{Body}}` in E-Mail-Inhalten** (Body-Templates sollten kein `{{Body}}`
   enthalten): erzwingen oder ignorieren. Empfehlung: ignorieren/entfernen.
5. **Standard-Layout im Auslieferungszustand**: keine Vorlage mitliefern (Admin legt an) vs.
   eine Default-Layout-Vorlage per Datenmigration. Empfehlung: keine mitliefern.

---

## 14. Verifikation (Kommandos)

```shell
# Backend-Tests
docker compose run --rm web poetry run pytest

# Formatierung
docker compose run --rm web poetry run black --check .
docker compose run --rm react npx prettier . --check

# API-Client nach Schemaänderung
docker compose run --rm react bash ./scripts/generate_api_clients.sh

# Frontend-Tests
docker compose run -w /app/tapir_mail_ui/ -e CI=1 react npm install-test
```

Manuelle Abnahme:
1. Layout-Vorlage mit `{{Body}}` anlegen, als Standard markieren.
2. Neue E-Mail mit Textbody speichern → Vorschau zeigt Rahmen+Body.
3. Testmail senden → empfangene Mail zeigt Rahmen+Body.
4. Bestehende (alte) E-Mail ohne erneutes Speichern versenden → unverändert.
5. Gleiche E-Mail neu speichern/veröffentlichen → Layout wird angewandt.
