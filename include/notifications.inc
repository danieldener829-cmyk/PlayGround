// notifications.inc - Alias/canonical de notificacoes (usa ui.inc por baixo)
// Mantido separado por arquitetura pedida; implementacao real esta em ui.inc.
#if defined _notifications_included
    #endinput
#endif
#define _notifications_included

#include <a_samp>

stock InfoBox(playerid, const text[]) { return Notify(playerid, text, COLOR_BLUE); }
stock ErrorBox(playerid, const text[]) { return Notify(playerid, text, COLOR_RED); }
stock SuccessBox(playerid, const text[]) { return Notify(playerid, text, COLOR_GREEN); }
