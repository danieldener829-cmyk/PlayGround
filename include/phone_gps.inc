// phone_gps.inc - Celular (contatos+sms) + GPS com pontos
#if defined _phonegps_included
    #endinput
#endif
#define _phonegps_included

#include <a_samp>

// ---- GPS ----
enum E_GPS { gpsName[32], Float:gpsX, Float:gpsY, Float:gpsZ };
new const GPSPoints[][E_GPS] = {
    {"Prefeitura", 1481.0, -1771.0, 18.0},
    {"Hospital", 1173.0, -1323.0, 15.0},
    {"Policia (LSPD)", 1553.0, -1675.0, 16.0},
    {"Mecanicos", 1025.0, -1027.0, 32.0},
    {"Banco Central", 1427.0, -989.0, 26.0},
    {"Caminhoneiro", 655.0, -578.0, 16.0},
    {"Taxista", 1744.0, -1868.0, 13.0},
    {"Agricultor", -105.0, -1100.0, 2.0},
    {"Pescador", -1969.0, 143.0, 27.0},
    {"Minerador", 812.0, 868.0, 12.0}
};

stock ShowGPS(playerid) {
    new body[512] = "";
    new line[64];
    for (new i = 0; i < sizeof(GPSPoints); i++) {
        format(line, sizeof(line), "%d. %s\n", i+1, GPSPoints[i][gpsName]);
        strcat(body, line);
    }
    ShowPlayerDialog(playerid, DIALOG_GPS, DIALOG_STYLE_LIST, "GPS Aurora", body, "Ir", "Fechar");
    return 1;
}

stock GPS_Go(playerid, idx) {
    if (idx < 0 || idx >= sizeof(GPSPoints)) return 0;
    SetPlayerCheckpoint(playerid, GPSPoints[idx][gpsX], GPSPoints[idx][gpsY], GPSPoints[idx][gpsZ], 5.0);
    // Se estiver em job, GPS nao cancela job: apenas informa. Checkpoint de job tem prioridade;
    // aqui marcamos race checkpoint alternativo via map icon? Simplificacao: usa checkpoint normal
    // e avisa que job ativo sera pausado visualmente.
    new m[80];
    format(m, sizeof(m), "GPS: destino %s marcado.", GPSPoints[idx][gpsName]);
    Notify(playerid, m, COLOR_BLUE);
    PVarInt(playerid, "GPSActive", 1);
    return 1;
}

// ---- Telefone ----
stock Phone_EnsureNumber(playerid) {
    if (Player[playerid][pPhone] == 0) {
        Player[playerid][pPhone] = 100000 + random(899999);
        new q[96];
        format(q, sizeof(q), "UPDATE characters SET phone_number=%d WHERE id=%d", Player[playerid][pPhone], Player[playerid][pCharID]);
        mysql_tquery(g_SQL, q);
    }
    return Player[playerid][pPhone];
}

stock ShowPhone(playerid) {
    Phone_EnsureNumber(playerid);
    new body[256];
    format(body, sizeof(body), "Seu numero: %d\n1. Contatos\n2. Enviar SMS\n3. Ler SMS", Player[playerid][pPhone]);
    ShowPlayerDialog(playerid, DIALOG_PHONE, DIALOG_STYLE_LIST, "Celular", "Contatos\nEnviar SMS\nLer SMS", "Abrir", "Fechar");
    return 1;
}

forward OnSMSRead(playerid);
public OnSMSRead(playerid) {
    new body[1024] = "De\tMensagem\n";
    new line[200];
    for (new i = 0, r = cache_num_rows(); i < r && i < 10; i++) {
        new from, txt[160];
        cache_get_value_int(i, "from_char", from);
        cache_get_value(i, "text", txt);
        format(line, sizeof(line), "%d\t%.60s\n", from, txt);
        strcat(body, line);
    }
    if (cache_num_rows() == 0) strcat(body, "-\tNenhuma mensagem.\n");
    ShowPlayerDialog(playerid, DIALOG_PHONE_SMS, DIALOG_STYLE_TABLIST_HEADERS, "SMS", body, "Fechar", "");
    // marca lidas
    new q[96];
    format(q, sizeof(q), "UPDATE messages SET is_read=1 WHERE to_char=%d", Player[playerid][pCharID]);
    mysql_tquery(g_SQL, q);
    return 1;
}

stock Phone_ReadSMS(playerid) {
    new q[96];
    format(q, sizeof(q), "SELECT from_char,text FROM messages WHERE to_char=%d ORDER BY id DESC LIMIT 10", Player[playerid][pCharID]);
    mysql_tquery(g_SQL, q, "OnSMSRead", "d", playerid);
    return 1;
}

stock Phone_SendSMS(playerid, targetNumber, const text[]) {
    if (strlen(text) < 1 || strlen(text) > 128) return Notify(playerid, "Texto 1-128 chars.", COLOR_RED), 0;
    // resolve numero -> char_id
    new q[256], esc[160];
    mysql_escape_string(text, esc, g_SQL, sizeof(esc));
    PVarInt(playerid, "SMSTarget", targetNumber);
    new pstr[160];
    format(pstr, sizeof(pstr), "%s", esc);
    // guarda texto em pvar string via SetPVarString
    SetPVarString(playerid, "SMSText", esc);
    format(q, sizeof(q), "SELECT id FROM characters WHERE phone_number=%d LIMIT 1", targetNumber);
    mysql_tquery(g_SQL, q, "OnSMSSend", "d", playerid);
    return 1;
}

forward OnSMSSend(playerid);
public OnSMSSend(playerid) {
    if (cache_num_rows() == 0) return Notify(playerid, "Numero nao existe.", COLOR_RED), 0;
    new toid;
    cache_get_value_int(0, "id", toid);
    new txt[160];
    GetPVarString(playerid, "SMSText", txt, sizeof(txt));
    new q[320];
    format(q, sizeof(q), "INSERT INTO messages (from_char,to_char,text) VALUES (%d,%d,'%s')",
        Player[playerid][pCharID], toid, txt);
    mysql_tquery(g_SQL, q);
    Notify(playerid, "SMS enviado!", COLOR_GREEN);
    // avisa destinatario online
    for (new i = 0; i < MAX_PLAYERS; i++) {
        if (IsPlayerConnected(i) && Player[i][pCharID] == toid) {
            SendClientMessage(i, COLOR_PM_IN, "[SMS] Voce recebeu uma mensagem. /celular > Ler SMS");
            PlayerPlaySound(i, 1056, 0.0, 0.0, 0.0);
        }
    }
    return 1;
}
