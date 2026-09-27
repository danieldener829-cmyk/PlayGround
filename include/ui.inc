// ui.inc - HUD moderno (PlayerTextDraws), notificacoes, dialogs de ajuda
#if defined _ui_included
    #endinput
#endif
#define _ui_included

#include <a_samp>

new PlayerText:g_HudMoney[MAX_PLAYERS] = {PlayerText:-1, ...};
new PlayerText:g_HudBank[MAX_PLAYERS] = {PlayerText:-1, ...};
new PlayerText:g_HudStats[MAX_PLAYERS] = {PlayerText:-1, ...};
new PlayerText:g_HudNotify[MAX_PLAYERS] = {PlayerText:-1, ...};
new g_NotifyTimer[MAX_PLAYERS];

stock CreateHUD(playerid) {
    DestroyHUD(playerid);
    g_HudMoney[playerid] = CreatePlayerTextDraw(playerid, 540.0, 20.0, "R$ 0");
    PlayerTextDrawLetterSize(playerid, g_HudMoney[playerid], 0.30, 1.4);
    PlayerTextDrawColor(playerid, g_HudMoney[playerid], COLOR_GREEN);
    PlayerTextDrawSetOutline(playerid, g_HudMoney[playerid], 1);
    PlayerTextDrawFont(playerid, g_HudMoney[playerid], 2);
    PlayerTextDrawShow(playerid, g_HudMoney[playerid]);

    g_HudBank[playerid] = CreatePlayerTextDraw(playerid, 540.0, 36.0, "Banco R$ 0");
    PlayerTextDrawLetterSize(playerid, g_HudBank[playerid], 0.22, 1.0);
    PlayerTextDrawColor(playerid, g_HudBank[playerid], COLOR_BLUE);
    PlayerTextDrawSetOutline(playerid, g_HudBank[playerid], 1);
    PlayerTextDrawFont(playerid, g_HudBank[playerid], 2);
    PlayerTextDrawShow(playerid, g_HudBank[playerid]);

    g_HudStats[playerid] = CreatePlayerTextDraw(playerid, 540.0, 52.0, "Nv 1 | Fome 100 | Sede 100");
    PlayerTextDrawLetterSize(playerid, g_HudStats[playerid], 0.20, 0.9);
    PlayerTextDrawColor(playerid, g_HudStats[playerid], COLOR_WHITE);
    PlayerTextDrawSetOutline(playerid, g_HudStats[playerid], 1);
    PlayerTextDrawFont(playerid, g_HudStats[playerid], 1);
    PlayerTextDrawShow(playerid, g_HudStats[playerid]);

    g_HudNotify[playerid] = CreatePlayerTextDraw(playerid, 320.0, 300.0, "_");
    PlayerTextDrawAlignment(playerid, g_HudNotify[playerid], 2);
    PlayerTextDrawLetterSize(playerid, g_HudNotify[playerid], 0.28, 1.2);
    PlayerTextDrawColor(playerid, g_HudNotify[playerid], COLOR_YELLOW);
    PlayerTextDrawSetOutline(playerid, g_HudNotify[playerid], 1);
    PlayerTextDrawFont(playerid, g_HudNotify[playerid], 2);
    return 1;
}

stock DestroyHUD(playerid) {
    if (_:g_HudMoney[playerid] != -1) { PlayerTextDrawDestroy(playerid, g_HudMoney[playerid]); g_HudMoney[playerid] = PlayerText:-1; }
    if (_:g_HudBank[playerid] != -1) { PlayerTextDrawDestroy(playerid, g_HudBank[playerid]); g_HudBank[playerid] = PlayerText:-1; }
    if (_:g_HudStats[playerid] != -1) { PlayerTextDrawDestroy(playerid, g_HudStats[playerid]); g_HudStats[playerid] = PlayerText:-1; }
    if (_:g_HudNotify[playerid] != -1) { PlayerTextDrawDestroy(playerid, g_HudNotify[playerid]); g_HudNotify[playerid] = PlayerText:-1; }
    return 1;
}

stock UpdateHUD(playerid) {
    if (!IsPlayerConnected(playerid) || !IsPlayerLogged(playerid)) return 0;
    new s[64];
    format(s, sizeof(s), "R$ %d", Player[playerid][pMoney]);
    PlayerTextDrawSetString(playerid, g_HudMoney[playerid], s);
    format(s, sizeof(s), "Banco R$ %d", Player[playerid][pBank]);
    PlayerTextDrawSetString(playerid, g_HudBank[playerid], s);
    format(s, sizeof(s), "Nv %d | Fome %d | Sede %d | %02d:%02d",
        Player[playerid][pLevel], floatround(Player[playerid][pHunger]), floatround(Player[playerid][pThirst]),
        12, 0);
    PlayerTextDrawSetString(playerid, g_HudStats[playerid], s);
    SetPlayerScore(playerid, Player[playerid][pLevel]);
    return 1;
}

// Notificacao estilo moderno (PlayerTextDraw central + som)
forward HideNotify(playerid);
public HideNotify(playerid) {
    PlayerTextDrawHide(playerid, g_HudNotify[playerid]);
    return 1;
}

stock Notify(playerid, const text[], color = COLOR_YELLOW) {
    PlayerTextDrawSetString(playerid, g_HudNotify[playerid], text);
    PlayerTextDrawColor(playerid, g_HudNotify[playerid], color);
    PlayerTextDrawShow(playerid, g_HudNotify[playerid]);
    PlayerPlaySound(playerid, 1056, 0.0, 0.0, 0.0);
    KillTimer(g_NotifyTimer[playerid]);
    g_NotifyTimer[playerid] = SetTimerEx("HideNotify", 3500, false, "d", playerid);
    return 1;
}

stock ShowHelp(playerid) {
    new body[1024];
    format(body, sizeof(body),
        "/me /do /ooc /pm /rg /status /inventario /celular /gps\n/emprego /veiculo /casa /banco /ajuda /pay /depositar /sacar\nEmpregos: /trabalhar /parar /entrega\nOrgs: /convidar /demitir /promover /cofre\nAdmin: /kick /ban /mute /jail /spec /goto /gethere");
    ShowPlayerDialog(playerid, DIALOG_HELP, DIALOG_STYLE_MSGBOX, "Ajuda Aurora RP", body, "Fechar", "");
    return 1;
}
