// main.pwn - Aurora Roleplay | Gamemode principal
// Compilar: pawncc main.pwn -o main.amx (-;+ -(+)
// Dependencias: a_samp, a_mysql (R41-4), streamer, sscanf2, Whirlpool, pawn.cmd
#include <a_samp>
#include <a_mysql>
#include <streamer>
#include <sscanf2>
#include <Whirlpool>
#include <pawn.cmd>

// Ordem importa (quebra dependencia circular explicada em config.inc):
#include "../include/config.inc"
#include "../include/utils.inc"
#include "../include/database.inc"
#include "../include/logs.inc"
#include "../include/security.inc"
#include "../include/ui.inc"
#include "../include/notifications.inc"
#include "../include/inventory.inc"
#include "../include/vehicles.inc"
#include "../include/players.inc"
#include "../include/houses.inc"
#include "../include/jobs.inc"
#include "../include/organizations.inc"
#include "../include/phone_gps.inc"
#include "../include/admin.inc"
#include "../include/accounts.inc"
#include "../include/commands.inc"

main() {
    print("Aurora Roleplay " SERVER_VERSION " carregado.");
}

// ---------- Timers globais ----------
forward PaydayTick();
public PaydayTick() {
    for (new i = 0; i < MAX_PLAYERS; i++) {
        if (!IsPlayerConnected(i) || !IsPlayerLogged(i)) continue;
        GivePlayerBank(i, 200, "payday");
        SendClientMessage(i, COLOR_GREEN, "[PAYDAY] Salario R$200 depositado.");
        SaveCharacter(i);
        SavePlayerInventory(i);
    }
    return 1;
}

forward HungerTick();
public HungerTick() {
    for (new i = 0; i < MAX_PLAYERS; i++) {
        if (!IsPlayerConnected(i) || !IsPlayerLogged(i)) continue;
        Player[i][pHunger] = floatmax(0.0, Player[i][pHunger] - 1.0);
        Player[i][pThirst] = floatmax(0.0, Player[i][pThirst] - 1.5);
        if (Player[i][pHunger] <= 0.0 || Player[i][pThirst] <= 0.0) {
            new Float:h; GetPlayerHealth(i, h);
            SetPlayerHealth(i, floatmax(0.0, h - 2.0));
            if (floatround(h) % 20 == 0) SendClientMessage(i, COLOR_RED, "[STATUS] Voce precisa comer/beber! Compre na loja ou use /inventario.");
        }
        // jail countdown
        if (Player[i][pJailed] && Player[i][pJailTime] > 0) {
            Player[i][pJailTime] -= 60;
            if (Player[i][pJailTime] <= 0) {
                Player[i][pJailed] = 0; Player[i][pJailTime] = 0;
                AllowTeleportOnce(i);
                SetPlayerPos(i, 1529.6, -1671.0, 13.5);
                SetPlayerInterior(i, 0);
                SendClientMessage(i, COLOR_GREEN, "[JAIL] Pena cumprida.");
                SaveCharacter(i);
            }
        }
        UpdateHUD(i);
    }
    Veh_FuelTick();
    return 1;
}

forward AutosaveTick();
public AutosaveTick() {
    for (new i = 0; i < MAX_PLAYERS; i++) {
        if (IsPlayerConnected(i) && IsPlayerLogged(i)) {
            SaveCharacter(i);
            SavePlayerInventory(i);
        }
    }
    for (new v = 0; v < MAX_VEHICLES; v++) if (Veh[v][vDBID] != 0) SaveVehicle(v);
    print("[AUTOSAVE] Personagens/inventarios/veiculos salvos.");
    return 1;
}

forward SecTick();
public SecTick() {
    for (new i = 0; i < MAX_PLAYERS; i++) {
        if (IsPlayerConnected(i)) Sec_PosCheck(i);
    }
    return 1;
}

// ---------- Lifecycle ----------
public OnGameModeInit() {
    SetGameModeText("Aurora RP " SERVER_VERSION);
    SendRconCommand("hostname " SERVER_NAME);
    ShowPlayerMarkers(PLAYER_MARKERS_MODE_GLOBAL);
    ShowNameTags(1);
    SetNameTagDrawDistance(20.0);
    EnableStuntBonusForAll(0);
    SetWorldTime(12);

    DB_Connect();
    Inventory_InitDefs();
    Veh_Init();
    Houses_Init();
    Biz_Init();
    Orgs_Init();

    // Loads com delay p/ garantir conexao (OnDatabaseConnect faria melhor via callback;
    // aqui agenda 2s e cada loader checa DB_IsConnected)
    SetTimer("DelayedLoad", 2000, false);
    SetTimer("PaydayTick", PAYDAY_INTERVAL * 1000, true);
    SetTimer("HungerTick", 60000, true);
    SetTimer("AutosaveTick", 300000, true);
    SetTimer("SecTick", 2000, true);

    //mkdir scriptfiles/logs (pawn nao cria dir; documentado no INSTALL)
    print("[INIT] Aurora RP iniciado. Aguardando MySQL...");
    return 1;
}

forward DelayedLoad();
public DelayedLoad() {
    LoadHouses();
    LoadBusinesses();
    LoadOrgs();
    return 1;
}

public OnGameModeExit() {
    for (new i = 0; i < MAX_PLAYERS; i++) {
        if (IsPlayerConnected(i) && IsPlayerLogged(i)) SaveCharacter(i);
    }
    mysql_close(g_SQL);
    return 1;
}

public OnPlayerConnect(playerid) {
    Player_Init(playerid);
    ResetPlayerMoney(playerid);
    // tela inicial: fade + camera cinematica simples
    TogglePlayerSpectating(playerid, false);
    SetPlayerPos(playerid, 1529.6, -1671.0, 13.5);
    SetPlayerCameraPos(playerid, 1510.0, -1650.0, 25.0);
    SetPlayerCameraLookAt(playerid, 1529.6, -1671.0, 13.5);
    SendClientMessage(playerid, COLOR_YELLOW, "Bem-vindo a Aurora Roleplay! Carregando conta...");
    // delay p/ MySQL responder antes do check
    SetTimerEx("DeferLogin", 800, false, "d", playerid);
    return 1;
}

forward DeferLogin(playerid);
public DeferLogin(playerid) {
    if (!IsPlayerConnected(playerid)) return 0;
    if (!DB_IsConnected()) {
        SendClientMessage(playerid, COLOR_RED, "[DB] Banco offline. Reconecte em instantes.");
        return 0;
    }
    ShowLoginOrRegister(playerid);
    return 1;
}

public OnPlayerDisconnect(playerid, reason) {
    if (IsPlayerLogged(playerid)) {
        SaveCharacter(playerid);
        SavePlayerInventory(playerid);
        new m[128], n[MAX_PLAYER_NAME];
        GetPlayerName(playerid, n, sizeof(n));
        format(m, sizeof(m), "logout %s (char %d)", n, Player[playerid][pCharID]);
        LogEvent(LOG_LOGIN, m);
    }
    Job_Stop(playerid);
    DestroyHUD(playerid);
    Player_SetLogged(playerid, false);
    return 1;
}

public OnPlayerSpawn(playerid) {
    if (!IsPlayerLogged(playerid)) {
        // anti-spawn sem auth: congela ate login
        TogglePlayerControllable(playerid, false);
        return 1;
    }
    TogglePlayerControllable(playerid, true);
    SetPlayerSkin(playerid, Player[playerid][pSkin]);
    ResetPlayerMoney(playerid);
    GivePlayerMoney(playerid, Player[playerid][pMoney]);
    SetPlayerHealth(playerid, Player[playerid][pHealth] <= 0.0 ? 100.0 : Player[playerid][pHealth]);
    SetPlayerArmour(playerid, Player[playerid][pArmour]);
    Sec_SnapshotPos(playerid);
    UpdateHUD(playerid);
    return 1;
}

public OnPlayerDeath(playerid, killerid, reason) {
    Player[playerid][pHunger] = floatmax(0.0, Player[playerid][pHunger] - 10.0);
    SaveCharacter(playerid);
    return 1;
}

public OnPlayerText(playerid, text[]) {
    if (!IsPlayerLogged(playerid)) return 0; // bloqueia chat pre-login
    if (IsPlayerMuted(playerid)) {
        SendClientMessage(playerid, COLOR_RED, "[MUTE] Voce esta mutado.");
        return 0;
    }
    if (!CheckChatFlood(playerid)) return 0;
    new n[MAX_PLAYER_NAME], m[180];
    GetPlayerName(playerid, n, sizeof(n));
    format(m, sizeof(m), "%s diz: %s", n, text);
    // chat por proximidade 20m
    new Float:x1,Float:y1,Float:z1;
    GetPlayerPos(playerid, x1,y1,z1);
    for (new i = 0; i < MAX_PLAYERS; i++) {
        if (!IsPlayerConnected(i) || !IsPlayerLogged(i)) continue;
        new Float:x2,Float:y2,Float:z2;
        GetPlayerPos(i, x2,y2,z2);
        if (GetDistance3D(x1,y1,z1,x2,y2,z2) <= 20.0) SendClientMessage(i, COLOR_WHITE, m);
    }
    return 0; // suprime chat global padrao
}

public OnPlayerEnterCheckpoint(playerid) {
    if (JobActive[playerid] != 0) { Job_OnCheckpoint(playerid); return 1; }
    if (PVarInt(playerid, "GPSActive")) {
        PVarInt(playerid, "GPSActive", 0);
        DisablePlayerCheckpoint(playerid);
        Notify(playerid, "Destino GPS alcancado!", COLOR_GREEN);
        return 1;
    }
    return 1;
}

public OnDialogResponse(playerid, dialogid, response, listitem, inputtext[]) {
    if (dialogid == DIALOG_LOGIN) {
        if (!response) return Kick(playerid), 1;
        TryLogin(playerid, inputtext);
        return 1;
    }
    if (dialogid == DIALOG_REGISTER) {
        if (!response) return Kick(playerid), 1;
        TryRegister(playerid, inputtext);
        return 1;
    }
    if (dialogid == DIALOG_BANK) {
        if (!response) return 1;
        if (listitem == 0) {
            new m[96]; format(m, sizeof(m), "Saldo: Mao R$%d | Banco R$%d", Player[playerid][pMoney], Player[playerid][pBank]);
            SendClientMessage(playerid, COLOR_BLUE, m);
        }
        else if (listitem == 1) ShowPlayerDialog(playerid, DIALOG_BANK_DEPOSIT, DIALOG_STYLE_INPUT, "Depositar", "Valor:", "OK", "Voltar");
        else if (listitem == 2) ShowPlayerDialog(playerid, DIALOG_BANK_WITHDRAW, DIALOG_STYLE_INPUT, "Sacar", "Valor:", "OK", "Voltar");
        else if (listitem == 3) ShowPlayerDialog(playerid, DIALOG_BANK_TRANSFER, DIALOG_STYLE_INPUT, "Transferir", "Formato: id valor", "OK", "Voltar");
        return 1;
    }
    if (dialogid == DIALOG_BANK_DEPOSIT && response) {
        new v; if (TryParseInt(inputtext, v) && v > 0 && Player[playerid][pMoney] >= v) {
            GivePlayerCash(playerid, -v, "deposit dlg"); GivePlayerBank(playerid, v, "deposit dlg");
        }
        return 1;
    }
    if (dialogid == DIALOG_BANK_WITHDRAW && response) {
        new v; if (TryParseInt(inputtext, v) && v > 0 && Player[playerid][pBank] >= v) {
            GivePlayerBank(playerid, -v, "withdraw dlg"); GivePlayerCash(playerid, v, "withdraw dlg");
        }
        return 1;
    }
    if (dialogid == DIALOG_BANK_TRANSFER && response) {
        new tid, v;
        if (sscanf(inputtext, "dd", tid, v)) return SendClientMessage(playerid, COLOR_GREY, "Use: id valor");
        if (!IsPlayerConnected(tid) || !IsPlayerLogged(tid)) return SendClientMessage(playerid, COLOR_RED, "Destino offline.");
        if (v <= 0 || Player[playerid][pBank] < v) return SendClientMessage(playerid, COLOR_RED, "Saldo insuficiente.");
        GivePlayerBank(playerid, -v, "transfer out"); GivePlayerBank(tid, v, "transfer in");
        LogTransaction(Player[playerid][pCharID], Player[tid][pCharID], "transfer", v, "bank dlg");
        return 1;
    }
    if (dialogid == DIALOG_INVENTORY && response) {
        // listitem 0..4 => item 1..5 ; ultimo = peso (ignora)
        if (0 <= listitem <= 4) Inv_Use(playerid, listitem + 1);
        return 1;
    }
    if (dialogid == DIALOG_PHONE && response) {
        if (listitem == 0) SendClientMessage(playerid, COLOR_GREY, "Contatos: use tabela phone_contacts (em breve UI).");
        else if (listitem == 1) ShowPlayerDialog(playerid, DIALOG_PHONE_SMS, DIALOG_STYLE_INPUT, "Enviar SMS", "Formato: numero texto", "Enviar", "Voltar");
        else if (listitem == 2) Phone_ReadSMS(playerid);
        return 1;
    }
    if (dialogid == DIALOG_PHONE_SMS && response) {
        new num; new txt[128];
        if (sscanf(inputtext, "ds[128]", num, txt)) return SendClientMessage(playerid, COLOR_GREY, "Use: numero texto");
        Phone_SendSMS(playerid, num, txt);
        return 1;
    }
    if (dialogid == DIALOG_GPS && response) {
        GPS_Go(playerid, listitem);
        return 1;
    }
    return 0;
}

// pawn.cmd: bloqueio pre-login e anti-flood global
public OnPlayerCommandReceived(playerid, cmd[], params[], flags) {
    #pragma unused flags
    if (!IsPlayerLogged(playerid)) {
        // permite apenas comandos de ajuda? Nao: bloqueia tudo pre-login
        SendClientMessage(playerid, COLOR_RED, "[ERRO] Faca login primeiro.");
        return 0;
    }
    if (!CheckCmdFlood(playerid)) return 0;
    return 1;
}
public OnPlayerCommandPerformed(playerid, cmd[], params[], result, flags) {
    #pragma unused params, flags
    if (result == -1) SendClientMessage(playerid, COLOR_GREY, "Comando desconhecido. /ajuda");
    return 1;
}
