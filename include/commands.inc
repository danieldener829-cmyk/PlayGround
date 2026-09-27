// commands.inc - Comandos RP (pawn.cmd) + validacoes (login, permissao, cooldown, distancia)
// Requer: pawn.cmd, sscanf2
#if defined _commands_included
    #endinput
#endif
#define _commands_included

#include <a_samp>

// Helper: checa cooldown por comando via PVar
stock bool:CmdCooldown(playerid, const key[], ms) {
    new last = PVarInt(playerid, key);
    new now = GetTickCount();
    if (now - last < ms) return false;
    PVarInt(playerid, key, now);
    return true;
}

// ---- RP chat ----
CMD:me(playerid, params[]) {
    if (!RequireLogin(playerid) || IsPlayerMuted(playerid)) return 1;
    if (isnull(params)) return SendClientMessage(playerid, COLOR_GREY, "Use: /me [acao]");
    if (!CheckChatFlood(playerid)) return 1;
    new n[MAX_PLAYER_NAME], m[160];
    GetPlayerName(playerid, n, sizeof(n));
    format(m, sizeof(m), "* %s %s", n, params);
    SendClientMessageToAll(COLOR_ME, m);
    return 1;
}
CMD:do(playerid, params[]) {
    if (!RequireLogin(playerid) || IsPlayerMuted(playerid)) return 1;
    if (isnull(params)) return SendClientMessage(playerid, COLOR_GREY, "Use: /do [acao]");
    if (!CheckChatFlood(playerid)) return 1;
    new m[160];
    format(m, sizeof(m), "* %s (( %s ))", params, "acao");
    SendClientMessageToAll(COLOR_DO, m);
    return 1;
}
CMD:ooc(playerid, params[]) {
    if (!RequireLogin(playerid)) return 1;
    if (isnull(params)) return 1;
    if (!CheckChatFlood(playerid)) return 1;
    new n[MAX_PLAYER_NAME], m[160];
    GetPlayerName(playerid, n, sizeof(n));
    format(m, sizeof(m), "(( %s: %s ))", n, params);
    SendClientMessageToAll(COLOR_OOC, m);
    return 1;
}
CMD:pm(playerid, params[]) {
    if (!RequireLogin(playerid)) return 1;
    new target, msg[128];
    if (sscanf(params, "ds[128]", target, msg)) return SendClientMessage(playerid, COLOR_GREY, "Use: /pm [id] [msg]");
    if (!IsPlayerConnected(target) || !IsPlayerLogged(target)) return SendClientMessage(playerid, COLOR_RED, "Jogador offline.");
    new a[MAX_PLAYER_NAME], b[MAX_PLAYER_NAME], m[180];
    GetPlayerName(playerid, a, sizeof(a)); GetPlayerName(target, b, sizeof(b));
    format(m, sizeof(m), "PM de %s: %s", a, msg);
    SendClientMessage(target, COLOR_PM_IN, m);
    format(m, sizeof(m), "PM para %s: %s", b, msg);
    SendClientMessage(playerid, COLOR_PM_IN, m);
    return 1;
}

// ---- Info ----
CMD:rg(playerid) {
    if (!RequireLogin(playerid)) return 1;
    new m[256];
    format(m, sizeof(m), "RG: %s | Nivel %d | XP %d | Emprego %s | Org %d (rank %d)",
        "char", Player[playerid][pLevel], Player[playerid][pExp], JobNames[Player[playerid][pJob]], Player[playerid][pOrg], Player[playerid][pOrgRank]);
    SendClientMessage(playerid, COLOR_WHITE, m);
    return 1;
}
CMD:status(playerid) {
    if (!RequireLogin(playerid)) return 1;
    new m[320];
    new Float:h, Float:ar; GetPlayerHealth(playerid, h); GetPlayerArmour(playerid, ar);
    format(m, sizeof(m), "Vida %.0f | Colete %.0f | Fome %.0f | Sede %.0f | Mao R$%d | Banco R$%d | Tel %d",
        h, ar, Player[playerid][pHunger], Player[playerid][pThirst], Player[playerid][pMoney], Player[playerid][pBank], Player[playerid][pPhone]);
    SendClientMessage(playerid, COLOR_WHITE, m);
    return 1;
}
CMD:ajuda(playerid) { ShowHelp(playerid); return 1; }
CMD:inventario(playerid) { if (RequireLogin(playerid)) ShowInventory(playerid); return 1; }
CMD:celular(playerid) { if (RequireLogin(playerid)) ShowPhone(playerid); return 1; }
CMD:gps(playerid) { if (RequireLogin(playerid)) ShowGPS(playerid); return 1; }

// ---- Dinheiro ----
CMD:pay(playerid, params[]) {
    if (!RequireLogin(playerid)) return 1;
    new target, amount;
    if (sscanf(params, "dd", target, amount)) return SendClientMessage(playerid, COLOR_GREY, "Use: /pay [id] [valor]");
    if (amount <= 0 || amount > 100000) return SendClientMessage(playerid, COLOR_RED, "Valor 1-100000.");
    if (!IsPlayerConnected(target) || !IsPlayerLogged(target) || target == playerid) return 1;
    new Float:x1,Float:y1,Float:z1,Float:x2,Float:y2,Float:z2;
    GetPlayerPos(playerid, x1,y1,z1); GetPlayerPos(target, x2,y2,z2);
    if (GetDistance3D(x1,y1,z1,x2,y2,z2) > 5.0) return SendClientMessage(playerid, COLOR_RED, "Muito longe.");
    if (Player[playerid][pMoney] < amount) return SendClientMessage(playerid, COLOR_RED, "Sem dinheiro.");
    if (!CmdCooldown(playerid, "pay_cd", 2000)) return 1;
    GivePlayerCash(playerid, -amount, "pay out");
    GivePlayerCash(target, amount, "pay in");
    LogTransaction(Player[playerid][pCharID], Player[target][pCharID], "pay", amount, "pay cmd");
    return 1;
}
CMD:banco(playerid) {
    if (!RequireLogin(playerid)) return 1;
    ShowPlayerDialog(playerid, DIALOG_BANK, DIALOG_STYLE_LIST, "Banco Aurora",
        "Saldo\nDepositar\nSacar\nTransferir", "Abrir", "Fechar");
    return 1;
}
CMD:depositar(playerid, params[]) {
    if (!RequireLogin(playerid)) return 1;
    new v; if (sscanf(params, "d", v) || v <= 0) return SendClientMessage(playerid, COLOR_GREY, "Use: /depositar [valor]");
    if (Player[playerid][pMoney] < v) return SendClientMessage(playerid, COLOR_RED, "Sem dinheiro em maos.");
    GivePlayerCash(playerid, -v, "deposit");
    GivePlayerBank(playerid, v, "deposit");
    return 1;
}
CMD:sacar(playerid, params[]) {
    if (!RequireLogin(playerid)) return 1;
    new v; if (sscanf(params, "d", v) || v <= 0) return SendClientMessage(playerid, COLOR_GREY, "Use: /sacar [valor]");
    if (Player[playerid][pBank] < v) return SendClientMessage(playerid, COLOR_RED, "Saldo insuficiente.");
    GivePlayerBank(playerid, -v, "withdraw");
    GivePlayerCash(playerid, v, "withdraw");
    return 1;
}

// ---- Emprego / veiculo / casa ----
CMD:emprego(playerid) {
    if (!RequireLogin(playerid)) return 1;
    new m[320] = "ID  Emprego (use /trabalhar [id])\n";
    new l[48];
    for (new i = 1; i <= 9; i++) { format(l, sizeof(l), "%d. %s - R$%d\n", i, JobNames[i], JobPay[i]); strcat(m, l); }
    ShowPlayerDialog(playerid, DIALOG_HELP, DIALOG_STYLE_MSGBOX, "Empregos", m, "Fechar", "");
    return 1;
}
CMD:trabalhar(playerid, params[]) {
    if (!RequireLogin(playerid)) return 1;
    new id; if (sscanf(params, "d", id)) return SendClientMessage(playerid, COLOR_GREY, "Use: /trabalhar [1-9]");
    Job_Start(playerid, id);
    return 1;
}
CMD:parar(playerid) { Job_Stop(playerid); return 1; }
CMD:veiculo(playerid, params[]) {
    if (!RequireLogin(playerid)) return 1;
    if (isnull(params)) return SendClientMessage(playerid, COLOR_GREY, "Use: /veiculo [trancar]");
    if (!strcmp(params, "trancar", true)) Veh_ToggleLock(playerid);
    return 1;
}
CMD:casa(playerid, params[]) {
    if (!RequireLogin(playerid)) return 1;
    new idx = House_Nearest(playerid);
    if (idx == -1) return SendClientMessage(playerid, COLOR_RED, "Nenhuma casa proxima.");
    if (isnull(params)) {
        new m[128];
        format(m, sizeof(m), "Casa %d | Preco R$%d | %s", House[idx][hDBID], House[idx][hPrice], House[idx][hOwner]==0?"A VENDA":"Ocupada");
        SendClientMessage(playerid, COLOR_YELLOW, m);
        SendClientMessage(playerid, COLOR_GREY, "Use: /casa [comprar|entrar]");
        return 1;
    }
    if (!strcmp(params, "comprar", true)) House_Buy(playerid, idx);
    else if (!strcmp(params, "entrar", true)) House_Enter(playerid, idx);
    return 1;
}

// ---- Org ----
CMD:convidar(playerid, params[]) {
    if (!RequireLogin(playerid)) return 1;
    new t; if (sscanf(params, "d", t)) return SendClientMessage(playerid, COLOR_GREY, "Use: /convidar [id]");
    Org_Invite(playerid, t); return 1;
}
CMD:aceitarorg(playerid) { Org_Accept(playerid); return 1; }
CMD:recusarorg(playerid) { PVarInt(playerid, "OrgInvite", 0); return 1; }
CMD:demitir(playerid, params[]) {
    if (!RequireLogin(playerid)) return 1;
    new t; if (sscanf(params, "d", t)) return 1;
    Org_Kick(playerid, t); return 1;
}
CMD:promover(playerid, params[]) {
    if (!RequireLogin(playerid)) return 1;
    new t; if (sscanf(params, "d", t)) return 1;
    Org_Promote(playerid, t, true); return 1;
}
CMD:rebaixar(playerid, params[]) {
    if (!RequireLogin(playerid)) return 1;
    new t; if (sscanf(params, "d", t)) return 1;
    Org_Promote(playerid, t, false); return 1;
}
CMD:cofre(playerid, params[]) {
    if (!RequireLogin(playerid)) return 1;
    new v; if (sscanf(params, "d", v)) return SendClientMessage(playerid, COLOR_GREY, "Use: /cofre [valor+ deposita | valor- saca]");
    Org_Vault(playerid, v); return 1;
}

// ---- Admin ----
CMD:kick(playerid, params[]) {
    new t, reason[64];
    if (sscanf(params, "ds[64]", t, reason)) return SendClientMessage(playerid, COLOR_GREY, "Use: /kick [id] [motivo]");
    Admin_Kick(playerid, t, reason); return 1;
}
CMD:ban(playerid, params[]) {
    new t, reason[64];
    if (sscanf(params, "ds[64]", t, reason)) return SendClientMessage(playerid, COLOR_GREY, "Use: /ban [id] [motivo]");
    Admin_Ban(playerid, t, reason); return 1;
}
CMD:mute(playerid, params[]) {
    new t, mins; new reason[64];
    if (sscanf(params, "dds[64]", t, mins, reason)) return SendClientMessage(playerid, COLOR_GREY, "Use: /mute [id] [min] [motivo]");
    Admin_Mute(playerid, t, mins, reason); return 1;
}
CMD:jail(playerid, params[]) {
    new t, mins; new reason[64];
    if (sscanf(params, "dds[64]", t, mins, reason)) return SendClientMessage(playerid, COLOR_GREY, "Use: /jail [id] [min] [motivo]");
    Admin_Jail(playerid, t, mins, reason); return 1;
}
CMD:spec(playerid, params[]) {
    new t = -1; sscanf(params, "d", t);
    Admin_Spec(playerid, t); return 1;
}
CMD:goto(playerid, params[]) {
    new t; if (sscanf(params, "d", t)) return 1;
    Admin_Goto(playerid, t); return 1;
}
CMD:gethere(playerid, params[]) {
    if (!RequireAdmin(playerid, 1)) return 1;
    new t; if (sscanf(params, "d", t) || !IsPlayerConnected(t)) return 1;
    new Float:x,Float:y,Float:z; GetPlayerPos(playerid, x,y,z);
    AllowTeleportOnce(t);
    SetPlayerPos(t, x+1.0, y, z);
    return 1;
}
CMD:setskin(playerid, params[]) {
    if (!RequireAdmin(playerid, 2)) return 1;
    new t, s; if (sscanf(params, "dd", t, s)) return SendClientMessage(playerid, COLOR_GREY, "Use: /setskin [id] [skin]");
    SetPlayerSkin(t, s); Player[t][pSkin] = s; SaveCharacter(t); return 1;
}
CMD:setmoney(playerid, params[]) {
    if (!RequireAdmin(playerid, 3)) return 1;
    new t, v; if (sscanf(params, "dd", t, v)) return 1;
    SetPlayerCash(t, v, "admin set"); return 1;
}
CMD:setlevel(playerid, params[]) {
    if (!RequireAdmin(playerid, 3)) return 1;
    new t, v; if (sscanf(params, "dd", t, v)) return 1;
    Player[t][pLevel] = v; UpdateHUD(t); SaveCharacter(t); return 1;
}
CMD:giveitem(playerid, params[]) {
    if (!RequireAdmin(playerid, 2)) return 1;
    new t, item, qtd; if (sscanf(params, "ddd", t, item, qtd)) return SendClientMessage(playerid, COLOR_GREY, "Use: /giveitem [id] [item] [qtd]");
    Inv_Give(t, item, qtd, "admin"); return 1;
}
CMD:givecar(playerid, params[]) {
    if (!RequireAdmin(playerid, 2)) return 1;
    new t, model; if (sscanf(params, "dd", t, model)) return SendClientMessage(playerid, COLOR_GREY, "Use: /givecar [id] [model]");
    if (Veh_CountPlayer(t) >= MAX_PLAYER_VEHICLES) return SendClientMessage(playerid, COLOR_RED, "Limite de veiculos.");
    AdminCreateVehicle(t, model); return 1;
}
CMD:createhouse(playerid, params[]) {
    if (!RequireAdmin(playerid, 3)) return 1;
    new price, interior = 0;
    if (sscanf(params, "dD(0)", price, interior)) return SendClientMessage(playerid, COLOR_GREY, "Use: /createhouse [preco]");
    new slot = -1;
    for (new i = 0; i < MAX_HOUSES; i++) if (House[i][hDBID] == 0) { slot = i; break; }
    if (slot == -1) return 1;
    new Float:x,Float:y,Float:z; GetPlayerPos(playerid, x,y,z);
    House[slot][hPrice] = price; House[slot][hExtX]=x; House[slot][hExtY]=y; House[slot][hExtZ]=z;
    House[slot][hIntX]=261.0; House[slot][hIntY]=1284.0; House[slot][hIntZ]=1080.0; House[slot][hInterior]=4;
    House[slot][hLocked]=0;
    new q[256];
    format(q, sizeof(q), "INSERT INTO houses (price,ext_x,ext_y,ext_z,int_x,int_y,int_z,interior) VALUES (%d,%.2f,%.2f,%.2f,261,1284,1080,4)", price, x,y,z);
    mysql_tquery(g_SQL, q, "OnHouseCreated", "d", slot);
    return 1;
}
forward OnHouseCreated(slot);
public OnHouseCreated(slot) { House[slot][hDBID] = cache_insert_id(); return 1; }
