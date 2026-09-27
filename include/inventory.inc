// inventory.inc - Inventario com slots, peso, anti-dupe (server-authoritative)
#if defined _inventory_included
    #endinput
#endif
#define _inventory_included

#include <a_samp>

enum E_ITEMDEF {
    itemID,
    itemName[48],
    Float:itemWeight,
    itemMaxStack,
    itemType,
    itemPrice
};
new ItemDef[16][E_ITEMDEF]; // cache pequeno; tabela items e fonte p/ novos
new InvAmount[MAX_PLAYERS][16]; // amount por slot-item (item id 1..15)

stock Inventory_InitDefs() {
    // Espelha sql/schema.sql (evita query por uso)
    Inv_SetDef(1, "Pao", 0.2, 32, 1, 15);
    Inv_SetDef(2, "Agua", 0.3, 32, 2, 10);
    Inv_SetDef(3, "Kit Reparo", 2.0, 5, 5, 250);
    Inv_SetDef(4, "Celular", 0.1, 1, 5, 500);
    Inv_SetDef(5, "Corda", 0.5, 8, 0, 40);
    return 1;
}

stock Inv_SetDef(id, const name[], Float:w, maxstack, type, price) {
    ItemDef[id][itemID] = id;
    format(ItemDef[id][itemName], 48, "%s", name);
    ItemDef[id][itemWeight] = w;
    ItemDef[id][itemMaxStack] = maxstack;
    ItemDef[id][itemType] = type;
    ItemDef[id][itemPrice] = price;
}

stock bool:Inv_ValidItem(id) { return (1 <= id <= 5 && ItemDef[id][itemID] == id); }

stock Float:Inv_Weight(playerid) {
    new Float:w = 0.0;
    for (new i = 1; i <= 5; i++) w += float(InvAmount[playerid][i]) * ItemDef[i][itemWeight];
    return w;
}
#define MAX_INV_WEIGHT 30.0

stock LoadPlayerInventory(playerid) {
    for (new i = 0; i < 16; i++) InvAmount[playerid][i] = 0;
    if (Player[playerid][pCharID] == 0) return 0;
    new q[96];
    format(q, sizeof(q), "SELECT item_id,amount FROM inventory WHERE char_id=%d", Player[playerid][pCharID]);
    mysql_tquery(g_SQL, q, "OnInventoryLoaded", "d", playerid);
    return 1;
}

forward OnInventoryLoaded(playerid);
public OnInventoryLoaded(playerid) {
    for (new i = 0, r = cache_num_rows(); i < r; i++) {
        new iid, amt;
        cache_get_value_int(i, "item_id", iid);
        cache_get_value_int(i, "amount", amt);
        if (Inv_ValidItem(iid) && amt > 0) {
            if (amt > ItemDef[iid][itemMaxStack]) amt = ItemDef[iid][itemMaxStack]; // clamp anti-dupe
            InvAmount[playerid][iid] = amt;
        }
    }
    return 1;
}

stock SavePlayerInventory(playerid) {
    if (Player[playerid][pCharID] == 0) return 0;
    new cid = Player[playerid][pCharID];
    for (new i = 1; i <= 5; i++) {
        new q[160];
        if (InvAmount[playerid][i] <= 0)
            format(q, sizeof(q), "DELETE FROM inventory WHERE char_id=%d AND item_id=%d", cid, i);
        else
            format(q, sizeof(q), "INSERT INTO inventory (char_id,item_id,amount) VALUES (%d,%d,%d) ON DUPLICATE KEY UPDATE amount=%d",
                cid, i, InvAmount[playerid][i], InvAmount[playerid][i]);
        mysql_tquery(g_SQL, q);
    }
    return 1;
}

// Adiciona com checagem de peso/stack. Retorna 1 ok.
stock Inv_Give(playerid, itemid, amount, const reason[] = "give") {
    if (!Inv_ValidItem(itemid) || amount <= 0) return 0;
    if (InvAmount[playerid][itemid] + amount > ItemDef[itemid][itemMaxStack]) {
        Notify(playerid, "Slot cheio!", COLOR_RED); return 0;
    }
    new Float:nw = Inv_Weight(playerid) + float(amount) * ItemDef[itemid][itemWeight];
    if (nw > MAX_INV_WEIGHT) { Notify(playerid, "Peso maximo!", COLOR_RED); return 0; }
    InvAmount[playerid][itemid] += amount;
    SavePlayerInventory(playerid);
    new m[96];
    format(m, sizeof(m), "inv %+d x%s (%s)", amount, ItemDef[itemid][itemName], reason);
    LogEvent(LOG_MONEY, m);
    return 1;
}

stock Inv_Remove(playerid, itemid, amount) {
    if (!Inv_ValidItem(itemid) || amount <= 0) return 0;
    if (InvAmount[playerid][itemid] < amount) return 0;
    InvAmount[playerid][itemid] -= amount;
    SavePlayerInventory(playerid);
    return 1;
}

stock Inv_Use(playerid, itemid) {
    if (!RequireLogin(playerid)) return 0;
    if (!Inv_ValidItem(itemid) || InvAmount[playerid][itemid] <= 0) return 0;
    new Float:h, Float:a;
    GetPlayerHealth(playerid, h); GetPlayerArmour(playerid, a);
    if (itemid == 1) { // pao: +fome e +5 hp
        Player[playerid][pHunger] = floatmin(100.0, Player[playerid][pHunger] + 25.0);
        SetPlayerHealth(playerid, floatmin(100.0, h + 5.0));
        Inv_Remove(playerid, 1, 1);
        Notify(playerid, "Voce comeu Pao (+fome).");
    } else if (itemid == 2) {
        Player[playerid][pThirst] = floatmin(100.0, Player[playerid][pThirst] + 30.0);
        Inv_Remove(playerid, 2, 1);
        Notify(playerid, "Voce bebeu Agua (+sede).");
    } else if (itemid == 3) {
        if (!IsPlayerInAnyVehicle(playerid)) return Notify(playerid, "Entre num veiculo p/ usar Kit.", COLOR_RED), 0;
        new vid = GetPlayerVehicleID(playerid);
        RepairVehicle(vid);
        Inv_Remove(playerid, 3, 1);
        Notify(playerid, "Veiculo reparado!");
    } else {
        Notify(playerid, "Nada acontece...", COLOR_GREY);
        return 0;
    }
    UpdateHUD(playerid);
    return 1;
}

stock ShowInventory(playerid) {
    new body[512] = "Item\tQtd\n";
    new line[64];
    for (new i = 1; i <= 5; i++) {
        format(line, sizeof(line), "%s\t%d\n", ItemDef[i][itemName], InvAmount[playerid][i]);
        strcat(body, line);
    }
    new foot[64];
    format(foot, sizeof(foot), "Peso: %.1f/%.1f kg", Inv_Weight(playerid), MAX_INV_WEIGHT);
    strcat(body, foot);
    ShowPlayerDialog(playerid, DIALOG_INVENTORY, DIALOG_STYLE_TABLIST_HEADERS, "Inventario", body, "Usar", "Fechar");
    return 1;
}
