// security.inc - Anti-abuso: flood, spam, auth-gate, teleporte, dinheiro
#if defined _security_included
    #endinput
#endif
#define _security_included

#include <a_samp>

#define FLOOD_CHAT_MS       800
#define FLOOD_CMD_MS        600
#define FLOOD_DIALOG_MS     1000
#define MAX_TELEPORT_DIST   400.0 // dist/seg suspeita sem veiculo

new g_LastChatTick[MAX_PLAYERS];
new g_LastCmdTick[MAX_PLAYERS];
new g_CmdCount[MAX_PLAYERS];
new g_CmdWindowTick[MAX_PLAYERS];
new Float:g_LastPos[MAX_PLAYERS][3];
new g_LastPosTick[MAX_PLAYERS];
new g_SpamWarns[MAX_PLAYERS];

stock Sec_InitPlayer(playerid) {
    g_LastChatTick[playerid] = 0;
    g_LastCmdTick[playerid] = 0;
    g_CmdCount[playerid] = 0;
    g_CmdWindowTick[playerid] = 0;
    g_SpamWarns[playerid] = 0;
    g_LastPosTick[playerid] = 0;
    g_LastPos[playerid][0] = 0.0;
    return 1;
}

// Gate: bloqueia sistemas antes do login. Retorna true se autenticado.
stock bool:IsPlayerLogged(playerid) {
    return PVarInt(playerid, "Logged") == 1;
}

stock RequireLogin(playerid) {
    if (!IsPlayerLogged(playerid)) {
        SendClientMessage(playerid, COLOR_RED, "[ERRO] Voce precisa estar logado.");
        return 0;
    }
    return 1;
}

stock bool:CheckChatFlood(playerid) {
    new now = GetTickCount();
    if (now - g_LastChatTick[playerid] < FLOOD_CHAT_MS) {
        g_SpamWarns[playerid]++;
        if (g_SpamWarns[playerid] >= 3) {
            new msg[128], n[MAX_PLAYER_NAME];
            GetPlayerName(playerid, n, sizeof(n));
            format(msg, sizeof(msg), "[SEC] %s mutado 60s por flood.", n);
            SendClientMessageToAll(COLOR_RED, msg);
            PVarInt(playerid, "MutedUntil", gettime() + 60);
            LogEvent(LOG_EXPLOIT, msg);
            g_SpamWarns[playerid] = 0;
        } else SendClientMessage(playerid, COLOR_RED, "[SEC] Aguarde antes de falar novamente.");
        return false;
    }
    g_LastChatTick[playerid] = now;
    return true;
}

stock bool:CheckCmdFlood(playerid) {
    new now = GetTickCount();
    if (now - g_LastCmdTick[playerid] < FLOOD_CMD_MS) return false;
    g_LastCmdTick[playerid] = now;
    // rate: max 8 cmds / 5s
    if (now - g_CmdWindowTick[playerid] > 5000) { g_CmdWindowTick[playerid] = now; g_CmdCount[playerid] = 0; }
    g_CmdCount[playerid]++;
    if (g_CmdCount[playerid] > 8) {
        SendClientMessage(playerid, COLOR_RED, "[SEC] Flood de comandos detectado. Aguarde.");
        return false;
    }
    return true;
}

stock bool:IsPlayerMuted(playerid) {
    return gettime() < PVarInt(playerid, "MutedUntil");
}

// Anti-teleport simples: chamado a cada 2s por timer global
stock Sec_PosCheck(playerid) {
    if (!IsPlayerConnected(playerid) || !IsPlayerLogged(playerid)) return 0;
    if (GetPlayerState(playerid) == PLAYER_STATE_SPECTATING) return 0;
    if (PVarInt(playerid, "AdminDuty") == 1) return 0; // admin em spec/tp liberado
    if (PVarInt(playerid, "TeleportAllow") == 1) { PVarInt(playerid, "TeleportAllow", 0); Sec_SnapshotPos(playerid); return 0; }
    new Float:x, Float:y, Float:z;
    GetPlayerPos(playerid, x, y, z);
    new now = GetTickCount();
    if (g_LastPosTick[playerid] != 0) {
        new Float:d = GetDistance3D(x, y, z, g_LastPos[playerid][0], g_LastPos[playerid][1], g_LastPos[playerid][2]);
        new elapsed = now - g_LastPosTick[playerid]; // ms
        if (elapsed > 0 && d > MAX_TELEPORT_DIST && IsPlayerInAnyVehicle(playerid) == 0 && GetPlayerInterior(playerid) == PVarInt(playerid, "LastInt")) {
            new msg[160], n[MAX_PLAYER_NAME];
            GetPlayerName(playerid, n, sizeof(n));
            format(msg, sizeof(msg), "[SEC] Teleporte suspeito: %s moveu %.1fm em %dms.", n, d, elapsed);
            LogEvent(LOG_EXPLOIT, msg);
            // corrige: devolve a posicao anterior
            SetPlayerPos(playerid, g_LastPos[playerid][0], g_LastPos[playerid][1], g_LastPos[playerid][2]);
            return 1;
        }
    }
    Sec_SnapshotPos(playerid);
    return 0;
}

stock Sec_SnapshotPos(playerid) {
    GetPlayerPos(playerid, g_LastPos[playerid][0], g_LastPos[playerid][1], g_LastPos[playerid][2]);
    g_LastPosTick[playerid] = GetTickCount();
    PVarInt(playerid, "LastInt", GetPlayerInterior(playerid));
}

stock AllowTeleportOnce(playerid) { PVarInt(playerid, "TeleportAllow", 1); }
