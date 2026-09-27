// players.inc - Dados do personagem + save/load (fonte da verdade em RAM, espelho MySQL)
// Depende: database, logs, utils
#if defined _players_included
    #endinput
#endif
#define _players_included

#include <a_samp>

// Player[][] ja definido em config.inc (evita dependencia circular com ui.inc).

stock Player_Init(playerid) {
    for (new i = 0; i < _:E_PLAYER; i++) Player[playerid][E_PLAYER:i] = 0;
    Player[playerid][pHealth] = 100.0;
    Player[playerid][pArmour] = 0.0;
    Player[playerid][pHunger] = 100.0;
    Player[playerid][pThirst] = 100.0;
    Player[playerid][pMoney] = START_MONEY;
    Player[playerid][pBank] = START_BANK;
    Player[playerid][pLevel] = 1;
    Player[playerid][pPosX] = 1529.6; Player[playerid][pPosY] = -1671.0; Player[playerid][pPosZ] = 13.5;
    PVarInt(playerid, "Logged", 0);
    PVarInt(playerid, "TeleportAllow", 1);
    Sec_InitPlayer(playerid);
    return 1;
}

stock Player_SetLogged(playerid, bool:v) {
    Player[playerid][pLogged] = v;
    PVarInt(playerid, "Logged", _:v);
}

// Aplica dinheiro em MAOS com validacao + log. Nunca sete direto via SetPlayerMoney fora daqui.
stock GivePlayerCash(playerid, amount, const reason[] = "misc") {
    new newval = Player[playerid][pMoney] + amount;
    if (newval < 0) newval = 0;
    if (newval > MAX_MONEY_HAND) {
        new msg[160], n[MAX_PLAYER_NAME];
        GetPlayerName(playerid, n, sizeof(n));
        format(msg, sizeof(msg), "[SEC] %s tentou exceder MAX_MONEY (%d + %d).", n, Player[playerid][pMoney], amount);
        LogEvent(LOG_EXPLOIT, msg);
        return 0;
    }
    Player[playerid][pMoney] = newval;
    GivePlayerMoney(playerid, amount); // ajusta display nativo
    ResetPlayerMoney(playerid);
    GivePlayerMoney(playerid, newval);
    if (amount != 0) {
        new lmsg[192], n2[MAX_PLAYER_NAME];
        GetPlayerName(playerid, n2, sizeof(n2));
        format(lmsg, sizeof(lmsg), "cash %s %+d (%s) saldo=%d", n2, amount, reason, newval);
        LogEvent(LOG_MONEY, lmsg);
        LogTransaction(Player[playerid][pCharID], 0, "cash", amount, reason);
    }
    // autosave leve: so agenda (timer global salva a cada 5min + on disconnect)
    return 1;
}

stock SetPlayerCash(playerid, amount, const reason[] = "set") {
    new diff = amount - Player[playerid][pMoney];
    return GivePlayerCash(playerid, diff, reason);
}

// Banco
stock GivePlayerBank(playerid, amount, const reason[] = "bank") {
    new newval = Player[playerid][pBank] + amount;
    if (newval < 0) return 0;
    Player[playerid][pBank] = newval;
    new lmsg[192], n[MAX_PLAYER_NAME];
    GetPlayerName(playerid, n, sizeof(n));
    format(lmsg, sizeof(lmsg), "bank %s %+d (%s) saldo=%d", n, amount, reason, newval);
    LogEvent(LOG_MONEY, lmsg);
    LogTransaction(Player[playerid][pCharID], 0, "bank", amount, reason);
    UpdateHUD(playerid);
    return 1;
}

// Salva personagem (chamado: disconnect, payday, compra/venda, timer 5min)
stock SaveCharacter(playerid) {
    if (!IsPlayerLogged(playerid) || Player[playerid][pCharID] == 0) return 0;
    if (!DB_IsConnected()) return 0;
    GetPlayerPos(playerid, Player[playerid][pPosX], Player[playerid][pPosY], Player[playerid][pPosZ]);
    GetPlayerFacingAngle(playerid, Player[playerid][pAngle]);
    GetPlayerHealth(playerid, Player[playerid][pHealth]);
    GetPlayerArmour(playerid, Player[playerid][pArmour]);
    Player[playerid][pInterior] = GetPlayerInterior(playerid);
    Player[playerid][pVW] = GetPlayerVirtualWorld(playerid);
    new query[1024];
    format(query, sizeof(query),
        "UPDATE characters SET skin=%d,sex=%d,age=%d,pos_x=%.2f,pos_y=%.2f,pos_z=%.2f,angle=%.2f,interior=%d,vw=%d,health=%.1f,armour=%.1f,hunger=%.1f,thirst=%.1f,money=%d,bank=%d,level=%d,exp=%d,job_id=%d,job_level=%d,job_exp=%d,org_id=%d,org_rank=%d,phone_number=%d,jailed=%d,jail_time=%d WHERE id=%d",
        Player[playerid][pSkin], Player[playerid][pSex], Player[playerid][pAge],
        Player[playerid][pPosX], Player[playerid][pPosY], Player[playerid][pPosZ], Player[playerid][pAngle],
        Player[playerid][pInterior], Player[playerid][pVW],
        Player[playerid][pHealth], Player[playerid][pArmour],
        Player[playerid][pHunger], Player[playerid][pThirst],
        Player[playerid][pMoney], Player[playerid][pBank],
        Player[playerid][pLevel], Player[playerid][pExp],
        Player[playerid][pJob], Player[playerid][pJobLevel], Player[playerid][pJobExp],
        Player[playerid][pOrg], Player[playerid][pOrgRank],
        Player[playerid][pPhone], Player[playerid][pJailed], Player[playerid][pJailTime],
        Player[playerid][pCharID]);
    mysql_tquery(g_SQL, query);
    return 1;
}

forward OnCharacterLoaded(playerid);
public OnCharacterLoaded(playerid) {
    if (!IsPlayerConnected(playerid)) return 0;
    if (cache_num_rows() == 0) {
        // sem personagem: cria um com o nick atual
        new n[MAX_PLAYER_NAME];
        GetPlayerName(playerid, n, sizeof(n));
        new q[256], esc[32];
        mysql_escape_string(n, esc, g_SQL, sizeof(esc));
        format(q, sizeof(q), "INSERT INTO characters (account_id,name,skin,money,bank) VALUES (%d,'%s',0,%d,%d)",
            Player[playerid][pAccountID], esc, START_MONEY, START_BANK);
        mysql_tquery(g_SQL, q, "OnCharacterCreated", "d", playerid);
        return 1;
    }
    cache_get_value_int(0, "id", Player[playerid][pCharID]);
    cache_get_value_int(0, "sex", Player[playerid][pSex]);
    cache_get_value_int(0, "age", Player[playerid][pAge]);
    cache_get_value_int(0, "skin", Player[playerid][pSkin]);
    cache_get_value_float(0, "pos_x", Player[playerid][pPosX]);
    cache_get_value_float(0, "pos_y", Player[playerid][pPosY]);
    cache_get_value_float(0, "pos_z", Player[playerid][pPosZ]);
    cache_get_value_float(0, "angle", Player[playerid][pAngle]);
    cache_get_value_int(0, "interior", Player[playerid][pInterior]);
    cache_get_value_int(0, "vw", Player[playerid][pVW]);
    cache_get_value_float(0, "health", Player[playerid][pHealth]);
    cache_get_value_float(0, "armour", Player[playerid][pArmour]);
    cache_get_value_float(0, "hunger", Player[playerid][pHunger]);
    cache_get_value_float(0, "thirst", Player[playerid][pThirst]);
    cache_get_value_int(0, "money", Player[playerid][pMoney]);
    cache_get_value_int(0, "bank", Player[playerid][pBank]);
    cache_get_value_int(0, "level", Player[playerid][pLevel]);
    cache_get_value_int(0, "exp", Player[playerid][pExp]);
    cache_get_value_int(0, "job_id", Player[playerid][pJob]);
    cache_get_value_int(0, "job_level", Player[playerid][pJobLevel]);
    cache_get_value_int(0, "job_exp", Player[playerid][pJobExp]);
    cache_get_value_int(0, "org_id", Player[playerid][pOrg]);
    cache_get_value_int(0, "org_rank", Player[playerid][pOrgRank]);
    cache_get_value_int(0, "phone_number", Player[playerid][pPhone]);
    cache_get_value_int(0, "jailed", Player[playerid][pJailed]);
    cache_get_value_int(0, "jail_time", Player[playerid][pJailTime]);
    SpawnPlayerLogged(playerid);
    return 1;
}

forward OnCharacterCreated(playerid);
public OnCharacterCreated(playerid) {
    Player[playerid][pCharID] = cache_insert_id();
    new q[128];
    format(q, sizeof(q), "SELECT * FROM characters WHERE id=%d", Player[playerid][pCharID]);
    mysql_tquery(g_SQL, q, "OnCharacterLoaded", "d", playerid);
    return 1;
}

stock LoadCharacter(playerid) {
    new q[128];
    format(q, sizeof(q), "SELECT * FROM characters WHERE account_id=%d LIMIT 1", Player[playerid][pAccountID]);
    mysql_tquery(g_SQL, q, "OnCharacterLoaded", "d", playerid);
    return 1;
}

stock SpawnPlayerLogged(playerid) {
    Player_SetLogged(playerid, true);
    PVarInt(playerid, "TeleportAllow", 1);
    SetSpawnInfo(playerid, 0, Player[playerid][pSkin], Player[playerid][pPosX], Player[playerid][pPosY], Player[playerid][pPosZ], Player[playerid][pAngle], 0,0,0,0,0,0);
    SetPlayerInterior(playerid, Player[playerid][pInterior]);
    SetPlayerVirtualWorld(playerid, Player[playerid][pVW]);
    SpawnPlayer(playerid);
    // aplica apos spawn (OnPlayerSpawn faz o resto)
    new msg[128];
    format(msg, sizeof(msg), "[LOGIN] Bem-vindo! Nivel %d | R$%d mao | R$%d banco", Player[playerid][pLevel], Player[playerid][pMoney], Player[playerid][pBank]);
    SendClientMessage(playerid, COLOR_GREEN, msg);
    CreateHUD(playerid);
    UpdateHUD(playerid);
    LoadPlayerInventory(playerid);
    LoadPlayerVehicles(playerid);
    new lmsg[128], n[MAX_PLAYER_NAME];
    GetPlayerName(playerid, n, sizeof(n));
    format(lmsg, sizeof(lmsg), "login %s (acc %d char %d)", n, Player[playerid][pAccountID], Player[playerid][pCharID]);
    LogEvent(LOG_LOGIN, lmsg);
    return 1;
}

// XP / nivel
stock GivePlayerXP(playerid, amount) {
    Player[playerid][pExp] += amount;
    new need = Player[playerid][pLevel] * 100;
    while (Player[playerid][pExp] >= need) {
        Player[playerid][pExp] -= need;
        Player[playerid][pLevel]++;
        need = Player[playerid][pLevel] * 100;
        SendClientMessage(playerid, COLOR_YELLOW, "[NIVEL] Voce subiu de nivel! Use /status para ver.");
        PlayerPlaySound(playerid, 1057, 0.0, 0.0, 0.0);
    }
    UpdateHUD(playerid);
    return 1;
}
