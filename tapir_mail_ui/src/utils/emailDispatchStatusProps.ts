export const EMAIL_DISPATCH_STATUS_PROPS = {
  opened: {
    color: "success",
    text: "Geöffnet",
    extraText:
      "Es kann sicher davon ausgegangen werden, dass die Mail angekommen ist.",
  },
  error: {
    color: "danger",
    text: "Fehler beim Versand",
    extraText: "Der Versand ist fehlgeschlagen",
  },
  bounced: {
    color: "danger",
    text: "Bounce",
    extraText:
      "Der Mail-Server des Empfängers hat die Mail verweigert. In der Regel ist die Mailbox voll.",
  },
  unknown: {
    color: "warning",
    text: "Nicht geöffnet",
    extraText:
      "Die Email hat unseren Mail-Server verlassen. Wir haben keine Infos, ob sie angekommen oder geöffnet worden ist. Es gab aber zumindest keinen Fehler beim Versand.",
  },
  sending: {
    color: "info",
    text: "Wird versendet",
    extraText:
      "Die Mail ist vorbereitet worden aber noch nicht versendet. Der Versand müsste in den kommenden 1-2 Minuten erfolgen.",
  },
  delivered: {
    color: "primary",
    text: "Zugestellt",
    extraText:
      "Es kann sicher davon ausgegangen werden, dass die Mail angekommen ist. Die Mail ist vermutlich noch nicht geöffnet worden.",
  },
};
