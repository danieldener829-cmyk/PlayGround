// organizations.inc - Orgs: cargos, convite, demissao, promocao, cofre
#if defined _orgs_included
    #endinput
#endif
#define _orgs_included

#include <a_samp>

enum E_ORG {
    oDBID,
    oName[48],
    oType,
    oLeader,
    oVault,
    Float:oX, Float:oY, Float:oZ
};
new Org[MAX_ORGS][E_ORG];

new const OrgRankNames[][16] = {"Membro","Soldado","Cabo","Sargento","Tenente","Sub-Lider","Lider"};

stock Orgs_Init() { for (new i = 0; i < MAX_ORGS; i++) Org[i][oDBID] = 0; return 1; }

forward OnOrgsLoaded();
public OnOrgsLoaded() {
    for (new i = 0, r = cache_num_rows(); i < r && i < MAX_ORGS; i++) {
        cache_get_value_int(i, "id", Org[i][oDBID]);
        cache_get_value(i, "name", Org[i][oName]);
        cache_get_value_int(i, "org_type", Org[i][oType]);
        cache_get_value_int(i, "leader_char", Org[i][oLeader]);
        cache_get_value_int(i, "vault", Org[i][oVault]);
        cache_get_value_float(i, "base_x", Org[i][oX]);
        cache_get_value_float(i, "base_y", Org[i][oY]);
        cache_get_value_float(i, "base_z", Org[i][oZ]);
        Create3DTextLabel(Org[i][oName], COLOR_BLUE, Org[i][oX], Org[i][oY], Org[i][oZ]+1.0, 20.0, 0, 0);
        CreatePickup(1242, 1, Org[i][oX], Org[i][oY], Org[i][oZ], 0);
    }
    printf("[ORGS] %d orgs carregadas.", cache_num_rows());
    return 1;
}
stock LoadOrgs() { if (DB_IsConnected()) mysql_tquery(g_SQL, "SELECT * FROM organizations LIMIT 64", "OnOrgsLoaded", ""); return 1; }

stock Org_IndexByID(id) {
    for (new i = 0; i < MAX_ORGS; i++) if (Org[i][oDBID] == id) return i;
    return -1;
}
stock bool:Org_IsLeader(playerid) { return Player[playerid][pOrgRank] >= 6; }
stock bool:Org_IsSubLeader(playerid) { return Player[playerid][pOrgRank] >= 5; }

stock Org_Invite(playerid, targetid) {
    if (Player[playerid][pOrg] == 0) return Notify(playerid, "Voce nao esta numa org.", COLOR_RED), 0;
    if (!Org_IsSubLeader(playerid)) return Notify(playerid, "Apenas Sub-Lider+ convida.", COLOR_RED), 0;
    if (!IsPlayerConnected(targetid) || !IsPlayerLogged(targetid)) return 0;
    if (Player[targetid][pOrg] != 0) return Notify(playerid, "Jogador ja tem org.", COLOR_RED), 0;
    PVarInt(targetid, "OrgInvite", Player[playerid][pOrg]);
    new m[96], on[48];
    new oi = Org_IndexByID(Player[playerid][pOrg]);
    format(on, sizeof(on), "%s", oi == -1 ? "Org" : Org[oi][oName]);
    format(m, sizeof(m), "Convite: %s. Digite /aceitarorg ou /recusarorg.", on);
    SendClientMessage(targetid, COLOR_YELLOW, m);
    Notify(playerid, "Convite enviado.");
    return 1;
}

stock Org_Accept(playerid) {
    new oid = PVarInt(playerid, "OrgInvite");
    if (oid == 0) return 0;
    Player[playerid][pOrg] = oid;
    Player[playerid][pOrgRank] = 0;
    new q[160];
    format(q, sizeof(q), "INSERT INTO organization_members (org_id,char_id,rank_id) VALUES (%d,%d,0) ON DUPLICATE KEY UPDATE rank_id=0", oid, Player[playerid][pCharID]);
    mysql_tquery(g_SQL, q);
    format(q, sizeof(q), "UPDATE characters SET org_id=%d,org_rank=0 WHERE id=%d", oid, Player[playerid][pCharID]);
    mysql_tquery(g_SQL, q);
    PVarInt(playerid, "OrgInvite", 0);
    Notify(playerid, "Voce entrou na organizacao!", COLOR_GREEN);
    return 1;
}

stock Org_Kick(playerid, targetid) {
    if (!Org_IsSubLeader(playerid)) return 0;
    if (Player[targetid][pOrg] != Player[playerid][pOrg]) return 0;
    if (Player[targetid][pOrgRank] >= Player[playerid][pOrgRank]) return Notify(playerid, "Hierarquia insuficiente.", COLOR_RED), 0;
    Player[targetid][pOrg] = 0; Player[targetid][pOrgRank] = 0;
    new q[160];
    format(q, sizeof(q), "DELETE FROM organization_members WHERE org_id=%d AND char_id=%d", Player[playerid][pOrg], Player[targetid][pCharID]);
    mysql_tquery(g_SQL, q);
    format(q, sizeof(q), "UPDATE characters SET org_id=0,org_rank=0 WHERE id=%d", Player[targetid][pCharID]);
    mysql_tquery(g_SQL, q);
    Notify(targetid, "Voce foi demitido da org.", COLOR_RED);
    return 1;
}

stock Org_Promote(playerid, targetid, up = true) {
    if (!Org_IsLeader(playerid)) return Notify(playerid, "Apenas Lider.", COLOR_RED), 0;
    if (Player[targetid][pOrg] != Player[playerid][pOrg]) return 0;
    new r = Player[targetid][pOrgRank] + (up ? 1 : -1);
    if (r < 0 || r > 6) return 0;
    Player[targetid][pOrgRank] = r;
    new q[160];
    format(q, sizeof(q), "UPDATE organization_members SET rank_id=%d WHERE org_id=%d AND char_id=%d", r, Player[playerid][pOrg], Player[targetid][pCharID]);
    mysql_tquery(g_SQL, q);
    format(q, sizeof(q), "UPDATE characters SET org_rank=%d WHERE id=%d", r, Player[targetid][pCharID]);
    mysql_tquery(g_SQL, q);
    new m[64];
    format(m, sizeof(m), "Seu cargo agora e %s.", OrgRankNames[r]);
    Notify(targetid, m, COLOR_YELLOW);
    return 1;
}

stock Org_Vault(playerid, amount) { // amount>0 deposita, <0 saca (lider/sub)
    new oi = Org_IndexByID(Player[playerid][pOrg]);
    if (oi == -1) return 0;
    if (amount > 0) {
        if (Player[playerid][pMoney] < amount) return Notify(playerid, "Sem dinheiro em maos.", COLOR_RED), 0;
        GivePlayerCash(playerid, -amount, "org deposit");
        Org[oi][oVault] += amount;
    } else {
        if (!Org_IsSubLeader(playerid)) return Notify(playerid, "Sem permissao.", COLOR_RED), 0;
        if (Org[oi][oVault] < -amount) return Notify(playerid, "Cofre sem saldo.", COLOR_RED), 0;
        Org[oi][oVault] += amount;
        GivePlayerCash(playerid, -amount, "org withdraw");
    }
    new q[128];
    format(q, sizeof(q), "UPDATE organizations SET vault=%d WHERE id=%d", Org[oi][oVault], Org[oi][oDBID]);
    mysql_tquery(g_SQL, q);
    return 1;
}
