// houses.inc + businesses.inc (propriedades persistentes)
#if defined _houses_included
    #endinput
#endif
#define _houses_included

#include <a_samp>

enum E_HOUSE {
    hDBID,
    hOwner,
    hPrice,
    Float:hExtX, Float:hExtY, Float:hExtZ,
    Float:hIntX, Float:hIntY, Float:hIntZ,
    hInterior,
    hLocked,
    hPickup,
    hMapIcon
};
new House[MAX_HOUSES][E_HOUSE];

stock Houses_Init() {
    for (new i = 0; i < MAX_HOUSES; i++) { House[i][hDBID] = 0; House[i][hPickup] = -1; }
    return 1;
}

forward OnHousesLoaded();
public OnHousesLoaded() {
    for (new i = 0, r = cache_num_rows(); i < r && i < MAX_HOUSES; i++) {
        cache_get_value_int(i, "id", House[i][hDBID]);
        cache_get_value_int(i, "owner_char", House[i][hOwner]);
        cache_get_value_int(i, "price", House[i][hPrice]);
        cache_get_value_float(i, "ext_x", House[i][hExtX]);
        cache_get_value_float(i, "ext_y", House[i][hExtY]);
        cache_get_value_float(i, "ext_z", House[i][hExtZ]);
        cache_get_value_float(i, "int_x", House[i][hIntX]);
        cache_get_value_float(i, "int_y", House[i][hIntY]);
        cache_get_value_float(i, "int_z", House[i][hIntZ]);
        cache_get_value_int(i, "interior", House[i][hInterior]);
        cache_get_value_int(i, "locked", House[i][hLocked]);
        House[i][hPickup] = CreatePickup(House[i][hOwner] == 0 ? 1273 : 1272, 1, House[i][hExtX], House[i][hExtY], House[i][hExtZ], 0);
        new l[64];
        format(l, sizeof(l), "Casa %d\n%s\nR$%d", House[i][hDBID], House[i][hOwner] == 0 ? "A venda" : "Ocupada", House[i][hPrice]);
        Create3DTextLabel(l, House[i][hOwner]==0?COLOR_GREEN:COLOR_RED, House[i][hExtX], House[i][hExtY], House[i][hExtZ]+0.8, 15.0, 0, 0);
    }
    printf("[HOUSES] %d casas carregadas.", cache_num_rows());
    return 1;
}

stock LoadHouses() {
    if (!DB_IsConnected()) return 0;
    mysql_tquery(g_SQL, "SELECT * FROM houses LIMIT 500", "OnHousesLoaded", "");
    return 1;
}

stock House_Nearest(playerid, Float:range = 3.0) {
    new Float:px, Float:py, Float:pz;
    GetPlayerPos(playerid, px, py, pz);
    for (new i = 0; i < MAX_HOUSES; i++) {
        if (House[i][hDBID] == 0) continue;
        if (GetDistance3D(px, py, pz, House[i][hExtX], House[i][hExtY], House[i][hExtZ]) <= range) return i;
    }
    return -1;
}

stock House_Buy(playerid, idx) {
    if (House[idx][hOwner] != 0) return Notify(playerid, "Casa ja tem dono.", COLOR_RED), 0;
    if (Player[playerid][pMoney] + Player[playerid][pBank] < House[idx][hPrice]) return Notify(playerid, "Dinheiro insuficiente.", COLOR_RED), 0;
    // debita: prioriza banco
    new price = House[idx][hPrice];
    if (Player[playerid][pBank] >= price) GivePlayerBank(playerid, -price, "buy house");
    else {
        new fromBank = Player[playerid][pBank];
        if (fromBank > 0) GivePlayerBank(playerid, -fromBank, "buy house");
        GivePlayerCash(playerid, -(price - fromBank), "buy house");
    }
    House[idx][hOwner] = Player[playerid][pCharID];
    new q[128];
    format(q, sizeof(q), "UPDATE houses SET owner_char=%d WHERE id=%d", House[idx][hOwner], House[idx][hDBID]);
    mysql_tquery(g_SQL, q);
    Notify(playerid, "Casa comprada! Use /casa.", COLOR_GREEN);
    new m[128];
    format(m, sizeof(m), "house %d bought char=%d price=%d", House[idx][hDBID], House[idx][hOwner], price);
    LogEvent(LOG_PROPERTY, m);
    return 1;
}

stock House_Enter(playerid, idx) {
    if (House[idx][hLocked] && House[idx][hOwner] != Player[playerid][pCharID])
        return Notify(playerid, "Casa trancada.", COLOR_RED), 0;
    AllowTeleportOnce(playerid);
    SetPlayerPos(playerid, House[idx][hIntX], House[idx][hIntY], House[idx][hIntZ]);
    SetPlayerInterior(playerid, House[idx][hInterior]);
    PVarInt(playerid, "InsideHouse", House[idx][hDBID]);
    return 1;
}

// ---- Businesses (simplificado, mesmo padrao) ----
enum E_BIZ {
    bDBID, bOwner, bPrice, bVault,
    Float:bX, Float:bY, Float:bZ,
    bName[48]
};
new Biz[MAX_BUSINESSES][E_BIZ];

stock Biz_Init() { for (new i = 0; i < MAX_BUSINESSES; i++) Biz[i][bDBID] = 0; return 1; }

forward OnBizLoaded();
public OnBizLoaded() {
    for (new i = 0, r = cache_num_rows(); i < r && i < MAX_BUSINESSES; i++) {
        cache_get_value_int(i, "id", Biz[i][bDBID]);
        cache_get_value_int(i, "owner_char", Biz[i][bOwner]);
        cache_get_value_int(i, "price", Biz[i][bPrice]);
        cache_get_value_int(i, "vault", Biz[i][bVault]);
        cache_get_value_float(i, "ext_x", Biz[i][bX]);
        cache_get_value_float(i, "ext_y", Biz[i][bY]);
        cache_get_value_float(i, "ext_z", Biz[i][bZ]);
        cache_get_value(i, "name", Biz[i][bName]);
        CreatePickup(1274, 1, Biz[i][bX], Biz[i][bY], Biz[i][bZ], 0);
        new l[96];
        format(l, sizeof(l), "%s\n%s\nR$%d", Biz[i][bName], Biz[i][bOwner]==0?"A venda":"Ocupada", Biz[i][bPrice]);
        Create3DTextLabel(l, COLOR_YELLOW, Biz[i][bX], Biz[i][bY], Biz[i][bZ]+0.8, 15.0, 0, 0);
    }
    return 1;
}
stock LoadBusinesses() { if (DB_IsConnected()) mysql_tquery(g_SQL, "SELECT * FROM businesses LIMIT 300", "OnBizLoaded", ""); return 1; }
