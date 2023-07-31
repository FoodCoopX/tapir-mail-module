# Deployment Rules
### (v0.1; Draft; Gerold; 2023-07-31)
1. Bugfixes werden (außer bei erhöhtem Risiko) direkt in Produktion deployed.
1. User Stories (Features) werden nicht mehr direkt in Produktion deployed (Ausnahmen nach Absprache möglich), sondern nur noch über eine geordnete Release-Planung geplant und ausgeliefert.
1. Der PO entscheidet zusammen mit den jeweiligen Standort-Admins, wann ein Release deployed wird.
1. Releases werden künftig mit einem numerischen Schema versioniert, z.B. 1.0, 1.1, 2.0 etc.
1. Ein Release fasst mehrere im Review abgenommene User Stories zusammen und erhält ein technisches Change Log, das die Änderungen beschreibt.
1. Es wird eine Übersicht gepflegt, auf welcher Instanz welches Release deployed wurde.
1. Zum Review nach Sprint-Abschluss stehen die fertigen User Stories auf einer Demo-Instanz zur Ansicht bereit, d.h. eine User Story wird erst dann auf "Done" geschoben, wenn sie auf der Demo-Instanz deployed ist.
