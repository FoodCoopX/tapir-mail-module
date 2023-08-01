# Deployment Rules
### (v0.2; Draft; Gerold; 2023-08-01)
1. Bugfixes werden (außer bei erhöhtem Risiko) direkt in Produktion deployed.
1. User Stories (Features) werden nicht mehr direkt in Produktion deployed (Ausnahmen nach Absprache möglich), sondern nur noch über eine geordnete Release-Planung geplant und ausgeliefert.
1. Der PO entscheidet zusammen mit den jeweiligen Standort-Admins, wann ein Release deployed wird.
1. Releases werden künftig mit einem numerischen Schema versioniert, z.B. 1.0, 1.1, 2.0 etc.
1. Ein Release fasst mehrere im Review abgenommene User Stories zusammen und erhält ein technisches Change Log, das die Änderungen beschreibt.
1. Es wird eine Übersicht gepflegt, auf welcher Instanz welches Release deployed wurde.
1. Zum Review nach Sprint-Abschluss stehen die fertigen User Stories auf einer Demo-Instanz zur Ansicht bereit, d.h. eine User Story wird erst dann auf "Done" geschoben, wenn sie auf der Demo-Instanz deployed ist.

### Weitere Absprachen
#### Fragen Mona: 
* Ich habe mich gefragt, wer bei 1. entschieden wird, wann ein erhöhtes Risiko vorliegt und wer dann was entscheidet/gegencheckt.
* Und wie bei 5. das Change Log entsteht (automatisch? wer schreibt es?).
* Und wer bei 6. die Übersicht pflegt. Also vielleicht es es noch sinnvoll, da Rollen/Zuständigkeiten zu verteilen.
#### Antworten Gerold:
- Zu 1: Das erhöhte Risiko wird über geteilte Verantwortlichkeit festgestellt (also alle im Team inkl. PO), in der Regel können es aber die Entwickler am besten einschätzen. Mittelfristig sollte es aber unser Standard werden, dass wir über genügend automatische Tests auch genügend Sicherheit vor dem Deployment bekommen. Dann brauchen wir keine separaten Risikoeinschätzungen mehr, weil jeder Change erstmal automatisch durchgetestet wird. (Kostet aber leider die nachträgliche Entwicklung der Tests)
 - Zu 5: Das Change-Log wäre in erster Näherung eine Liste der implementierten User Stories und Bug Fixes, wobei der Volltext der Tickets/Issues vermutlich nicht zielführend ist (und oft auch bei Bugs mit der tatsächlichen Änderung nichts zu tun hat), sondern ggf. in eine griffige knappe Beschreibung übersetzt werden müsste. Hierfür habe ich auch noch keine klare Lösung, wer das am besten machen kann.
 - Zu 6: Das werde ich wohl defacto als derjenige sein, der die Deployments ausführt, ggf. ergänzt durch weiteren Input von PO und Devs.
