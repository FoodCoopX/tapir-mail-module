# Technische Entscheidungen – Issue #210: Zweiter Vorlagen-Typ „Layout"

Referenz: https://github.com/FoodCoopX/tapir-mail-module/issues/210
Review: https://github.com/FoodCoopX/tapir-mail-module/pull/213

Stand: 2026-11-06
Branch: `feat/layout-templates`

Dieses Dokument hält die technischen Entscheidungen und ihre Begründungen fest.
Implementierungsdetails stehen im Code und in den Tests.

---

## 1. Zwei Vorlagentypen

`EmailTemplate` bekommt einen Typ:

- **Start-Vorlage**: befüllt den Editor mit Startinhalt.
- **Layout-Vorlage**: wiederverwendbarer MJML-Rahmen um den E-Mail-Body.

Ein Layout kann global als Standard markiert werden. Höchstens ein Layout darf
gleichzeitig Standard sein; das wird über einen partiellen Unique-Constraint und
transaktionales Zurücksetzen des vorherigen Standards abgesichert.

---

## 2. Body-Repräsentation: Marker-Section statt nacktem Token

**Entscheidung:** Layouts enthalten einen normalen Abschnitt mit
`css-class="tapir-layout-body"` und darin `{{Body}}`. Beim Versand wird die
gesamte Marker-Section durch den inneren Inhalt des E-Mail-`<mj-body>` ersetzt.

**Begründung:** easy-email verliert einen nackten `{{Body}}`-Textknoten auf
`<mj-body>`-Ebene beim Editor-Roundtrip. Die Marker-Section überlebt den
Roundtrip und ist ein klarer Anker für den Merge.

Nackte `{{Body}}`-Tokens ohne Marker-Section werden abgelehnt. Die
Marker-Section ist für Layout-Vorlagen Pflicht.

---

## 3. E-Mail-Inhalt als eigener Custom Block

**Entscheidung:** Der Body-Platzhalter wird als Custom Block
`TAPIR_MAIL_BODY` dargestellt.

**Begründung:**

- Der Block braucht eine eigene Identität, damit er nur im Layout-Editor
  angeboten, erkannt und validiert werden kann.
- Der Platzhalter darf nicht inline editierbar sein.
- Pro Layout darf es nur einen E-Mail-Inhalt-Block geben.

**Konsequenzen:**

- Der Block erscheint nicht beim Bearbeiten normaler E-Mails.
- Bei vorhandenem Block wird der Menüeintrag als „bereits vorhanden“
  deaktiviert; das Backend lehnt mehrere Marker-Sections zusätzlich ab.
- Der Block wird über `components.MjmlBlock` mit seinem Block-`idx` gerendert.
  Ohne diese Bindung fehlen easy-email die `node-idx-…`-Klassen für Fokus,
  Toolbar-Delete und Drag-Handle.
- Im Editor gibt es einen sichtbaren, nicht inline editierbaren Platzhalter;
  in Produktion wird `<mj-raw>{{Body}}</mj-raw>` erzeugt.

---

## 4. Layout-Auflösung und „Kein Layout“

**Entscheidung:** Pro E-Mail-Version gibt es drei Zustände:

| `layout_enabled` | `layout_template_id` | Ergebnis                                    |
| ---------------- | -------------------- | ------------------------------------------- |
| `False`          | –                    | kein Layout, auch kein Standard             |
| `True`           | gesetzt              | explizit gewähltes Layout                   |
| `True`           | `NULL`               | Standard-Layout; ohne Standard: kein Layout |

**Begründung:** Ohne den dritten Zustand wären „Standard-Layout“ und „kein
Layout“ nicht unterscheidbar. `layout_enabled=False` ist die klare Aussage
„nichts anwenden“.

**Weitere Festlegungen:**

- Beim Speichern mit `layout_enabled=False` wird ein gesetztes
  `layout_template_id` geleert.
- Ein Update ohne `layout_enabled` behält den gespeicherten Wert.
- Standard und Layout-Inhalte werden zur Versand-/Dispatch-Zeit live
  aufgelöst. Layout-Änderungen wirken damit auf Versionen, die den Standard
  nutzen.

---

## 5. Bestehende E-Mails und Default-Tapir

**Entscheidung:** Das Seed-Layout heißt **Default-Tapir** und wird **nicht**
automatisch als Standard markiert. Die Migration setzt alle bestehenden
E-Mail-Versionen auf „kein Layout“.

**Begründung:**

- Bestehende E-Mails sollen sich durch das Deployment nicht verändern.
- Ein globaler Standard ist eine bewusste Admin-Entscheidung.
- Bestehende E-Mails werden bei Bedarf einzeln manuell umgestellt.

**Neue E-Mails** erhalten das Standard-Layout nur, wenn eines aktiv markiert
ist oder explizit eines gewählt wurde. Sonst bleiben sie ohne Layout.

---

## 6. Validierung in der View

**Entscheidung:** Layout-Validierung und das Setzen des eindeutigen
Standard-Layouts liegen im `EmailTemplateViewSet`, nicht im Serializer.

**Begründung:** Das entspricht der Review-Vorgabe aus PR #213. Zusätzlich
braucht die Regel „nur ein Standard-Layout“ transaktionale Änderungen mehrerer
Zeilen, was in der View klarer ist.

Der Serializer behält nur die explizite `is_default_layout`-Deklaration und
`validators = []`, damit DRF keinen automatischen Unique-Validator für den
partiellen Constraint anhängt.

---

## 7. Vorschau und Versand

**Entscheidung:** Vorschau und Testmail nutzen denselben serverseitigen
Merge-Pfad wie der Versand. Die Vorschau berücksichtigt `layout_enabled`.

**Begründung:** Eine zweite Merge-Implementierung im Browser würde langfristig
von der Versandlogik abweichen. Beim Versand wird MJML pro Version nur einmal
gerendert; Tokens werden danach pro Empfänger ersetzt.

---

## 8. Quelltext-Bearbeitung

**Entscheidung:** Der Template-Editor erlaubt das Bearbeiten des vollständigen
MJML- und JSON-Quelltexts.

**Begründung:** Fortgeschrittene Nutzer müssen Layout-Strukturen und
Platzhalter präzise bearbeiten können; der visuelle Editor bleibt der
Standardweg.

**Leitplanken:** Beim Übernehmen wird der Quelltext als vollständige Vorlage
validiert. Layout-Vorlagen müssen weiterhin einen E-Mail-Inhalt-Block mit
`{{Body}}` enthalten; Marker-Sections werden beim Laden normalisiert.

---

## 9. Bewusste Grenzen und Risiken

- **Body-`<mj-head>` wird verworfen:** Fonts und Styles müssen im Layout
  definiert werden.
- **Live-Layouts:** Änderungen am Standard wirken auf alle Versionen, die ihn
  nutzen.
- **Kein Standard aktiv:** Neue E-Mails bleiben ohne Layout, bis ein Standard
  gesetzt oder explizit gewählt wird.
- **Nackte `{{Body}}`-Tokens:** Werden nicht mehr unterstützt; Layouts müssen
  die Marker-Section verwenden.
- **Quelltext-Editing:** Kann Struktur und Tokens verändern; die Speicherung
  validiert die Layout-Pflichten, ersetzt aber keinen visuellen Review.
