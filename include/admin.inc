// admin.inc - Niveis, punicoes, comandos administrativos
#if defined _admin_included
    #endinput
#endif
#define _admin_included

#include <a_samp>

#define ADMIN_NONE 0
#define ADMIN_MOD 1
#define ADMIN_ADMIN 2
#define ADMIN_MASTER 3
#define ADMIN_DONO 4

stock AdminName(level) {
    new n[16];
    switch (level) {
        case 0: n = "Jogador";
        case 1: n = "Moderador";
        case 2: n = "Admin";
        case 3: n = "Master";
        default: n = "Dono";
    }
    return n;
}

stock bool:IsAdmin(playerid, level = 1) {
    return Player[playerid][pAdmin] >= level && IsPlayerLogged(playerid);
}

stock RequireAdmin(playerid, level) {
    if (!IsAdmin(playerid, level)) {
        SendClientMessage(playerid, COLOR_RED, "[ADMIN] Sem permissao.");
        return 0;
    }
    return 1;
}

stock Punish_Log(adminChar, targetName[], targetAcc, const type[], const reason[], duration) {
    new q[512], escN[32], escT[20], escR[160];
    mysql_escape_string(targetName, escN, g_SQL, sizeof(escN));
    mysql_escape_string(type, escT, g_SQL, sizeof(escT));
    mysql_escape_string(reason, escR, g_SQL, sizeof(escR));
    format(q, sizeof(q), "INSERT INTO punishments (admin_char,target_account,target_name,`type`,reason,duration_min) VALUES (%d,%d,'%s','%s','%s',%d)",
        adminChar, targetAcc, escN, escT, escR, duration);
    mysql_tquery(g_SQL, q);
    new m[256];
    format(m, sizeof(m), "[PUNISH] %s | %s -> %s (%s)", type, "admin", targetName, reason);
    LogEvent(LOG_ADMIN, m);
    return 1;
}

stock Admin_Kick(playerid, targetid, const reason[]) {
    if (!RequireAdmin(playerid, 1)) return 0;
    if (Player[playerid][pAdmin] <= Player[targetid][pAdmin] && playerid != targetid)
        return SendClientMessage(playerid, COLOR_RED, "[ADMIN] Hierarquia."), 0;
    new n[MAX_PLAYER_NAME], an[MAX_PLAYER_NAME];
    GetPlayerName(targetid, n, sizeof(n)); GetPlayerName(playerid, an, sizeof(an));
    new m[160];
    format(m, sizeof(m), "[ADMIN] %s kickou %s. Motivo: %s", an, n, reason);
    SendClientMessageToAll(COLOR_ADMIN, m);
    Punish_Log(Player[playerid][pCharID], n, Player[targetid][pAccountID], "kick", reason, 0);
    Kick(targetid);
    return 1;
}

stock Admin_Ban(playerid, targetid, const reason[]) {
    if (!RequireAdmin(playerid, 2)) return 0;
    new n[MAX_PLAYER_NAME], an[MAX_PLAYER_NAME];
    GetPlayerName(targetid, n, sizeof(n)); GetPlayerName(playerid, an, sizeof(an));
    new q[160], esc[160];
    mysql_escape_string(reason, esc, g_SQL, sizeof(esc));
    format(q, sizeof(q), "UPDATE accounts SET banned=1,ban_reason='%s' WHERE id=%d", esc, Player[targetid][pAccountID]);
    mysql_tquery(g_SQL, q);
    new m[180];
    format(m, sizeof(m), "[ADMIN] %s baniu %s. Motivo: %s", an, n, reason);
    SendClientMessageToAll(COLOR_ADMIN, m);
    Punish_Log(Player[playerid][pCharID], n, Player[targetid][pAccountID], "ban", reason, 0);
    Kick(targetid);
    return 1;
}

stock Admin_Mute(playerid, targetid, minutes, const reason[]) {
    if (!RequireAdmin(playerid, 1)) return 0;
    PVarInt(targetid, "MutedUntil", gettime() + minutes * 60);
    new n[MAX_PLAYER_NAME];
    GetPlayerName(targetid, n, sizeof(n));
    new m[160];
    format(m, sizeof(m), "[ADMIN] %s mutado %dmin. Motivo: %s", n, minutes, reason);
    SendClientMessageToAll(COLOR_ADMIN, m);
    Punish_Log(Player[playerid][pCharID], n, Player[targetid][pAccountID], "mute", reason, minutes);
    return 1;
}

stock Admin_Jail(playerid, targetid, minutes, const reason[]) {
    if (!RequireAdmin(playerid, 1)) return 0;
    Player[targetid][pJailed] = 1; Player[targetid][pJailTime] = minutes * 60;
    AllowTeleportOnce(targetid);
    SetPlayerPos(targetid, 198.0, 175.0, 1000.0);
    SetPlayerInterior(targetid, 3);
    new n[MAX_PLAYER_NAME]; GetPlayerName(targetid, n, sizeof(n));
    Punish_Log(Player[playerid][pCharID], n, Player[targetid][pAccountID], "jail", reason, minutes);
    SaveCharacter(targetid);
    return 1;
}

stock Admin_Spec(playerid, targetid) {
    if (!RequireAdmin(playerid, 1)) return 0;
    if (targetid == -1 || targetid == playerid) {
        TogglePlayerSpectating(playerid, false);
        PVarInt(playerid, "AdminDuty", 0);
    } else {
        TogglePlayerSpectating(playerid, true);
        PlayerSpectatePlayer(playerid, targetid);
        PVarInt(playerid, "AdminDuty", 1);
    }
    return 1;
}

stock Admin_Goto(playerid, targetid) {
    if (!RequireAdmin(playerid, 1)) return 0;
    new Float:x, Float:y, Float:z;
    GetPlayerPos(targetid, x, y, z);
    AllowTeleportOnce(playerid);
    SetPlayerPos(playerid, x+1.5, y, z);
    SetPlayerInterior(playerid, GetPlayerInterior(targetid));
    SetPlayerVirtualWorld(playerid, GetPlayerVirtualWorld(targetid));
    return 1;
}
