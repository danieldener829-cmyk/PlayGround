// vehicles.inc - Veiculos persistentes: comprar/vender/trancar/combustivel
#if defined _vehicles_included
    #endinput
#endif
#define _vehicles_included

#include <a_samp>

#define MAX_VEHICLES 1000

enum E_VEH {
    vDBID,
    vModel,
    vOwnerChar,
    vOwnerOrg,
    Float:vX, Float:vY, Float:vZ, Float:vA,
    vColor1, vColor2,
    vPlate[12],
    Float:vFuel,
    Float:vMileage,
    vLocked,
    vSAMP // vehicleid do servidor
};
new Veh[MAX_VEHICLES][E_VEH];
new g_VehCount = 0;

stock Veh_Init() {
    for (new i = 0; i < MAX_VEHICLES; i++) { Veh[i][vDBID] = 0; Veh[i][vSAMP] = INVALID_VEHICLE_ID; }
    return 1;
}

stock Veh_FindFree() {
    for (new i = 0; i < MAX_VEHICLES; i++) if (Veh[i][vDBID] == 0 && Veh[i][vSAMP] == INVALID_VEHICLE_ID) return i;
    return -1;
}
stock Veh_FindBySamp(vehicleid) {
    for (new i = 0; i < MAX_VEHICLES; i++) if (Veh[i][vSAMP] == vehicleid) return i;
    return -1;
}
stock Veh_CountPlayer(playerid) {
    new c = 0;
    for (new i = 0; i < MAX_VEHICLES; i++)
        if (Veh[i][vDBID] != 0 && Veh[i][vOwnerChar] == Player[playerid][pCharID]) c++;
    return c;
}

stock LoadPlayerVehicles(playerid) { LoadAllVehiclesFor(playerid); return 1; }

forward OnVehiclesLoaded(playerid);
public OnVehiclesLoaded(playerid) {
    if (!IsPlayerConnected(playerid)) return 0;
    for (new i = 0, r = cache_num_rows(); i < r; i++) {
        new slot = Veh_FindFree();
        if (slot == -1) break;
        cache_get_value_int(i, "id", Veh[slot][vDBID]);
        cache_get_value_int(i, "model", Veh[slot][vModel]);
        cache_get_value_int(i, "owner_char", Veh[slot][vOwnerChar]);
        cache_get_value_float(i, "pos_x", Veh[slot][vX]);
        cache_get_value_float(i, "pos_y", Veh[slot][vY]);
        cache_get_value_float(i, "pos_z", Veh[slot][vZ]);
        cache_get_value_float(i, "angle", Veh[slot][vA]);
        cache_get_value_int(i, "color1", Veh[slot][vColor1]);
        cache_get_value_int(i, "color2", Veh[slot][vColor2]);
        cache_get_value(i, "plate", Veh[slot][vPlate]);
        cache_get_value_float(i, "fuel", Veh[slot][vFuel]);
        cache_get_value_float(i, "mileage", Veh[slot][vMileage]);
        cache_get_value_int(i, "locked", Veh[slot][vLocked]);
        Veh[slot][vSAMP] = CreateVehicle(Veh[slot][vModel], Veh[slot][vX], Veh[slot][vY], Veh[slot][vZ], Veh[slot][vA], Veh[slot][vColor1], Veh[slot][vColor2], 60000);
        SetVehicleNumberPlate(Veh[slot][vSAMP], Veh[slot][vPlate]);
        // tranca visual
        new eng, lig, ala, por, cap, obj;
        GetVehicleParamsEx(Veh[slot][vSAMP], eng, lig, ala, por, cap, obj);
        SetVehicleParamsEx(Veh[slot][vSAMP], eng, lig, ala, Veh[slot][vLocked] ? 1 : 0, cap, obj);
    }
    return 1;
}

stock LoadAllVehiclesFor(playerid) {
    // Carrega veiculos do jogador + veiculos da org (streaming simples)
    if (!DB_IsConnected() || Player[playerid][pCharID] == 0) return 0;
    new q[160];
    format(q, sizeof(q), "SELECT * FROM vehicles WHERE owner_char=%d OR owner_org=%d LIMIT 20",
        Player[playerid][pCharID], Player[playerid][pOrg]);
    mysql_tquery(g_SQL, q, "OnVehiclesLoaded", "d", playerid);
    return 1;
}

stock SaveVehicle(slot) {
    if (Veh[slot][vDBID] == 0) return 0;
    new Float:x, Float:y, Float:z, Float:a;
    if (Veh[slot][vSAMP] != INVALID_VEHICLE_ID) GetVehiclePos(Veh[slot][vSAMP], x, y, z), GetVehicleZAngle(Veh[slot][vSAMP], a);
    else { x = Veh[slot][vX]; y = Veh[slot][vY]; z = Veh[slot][vZ]; a = Veh[slot][vA]; }
    new q[512], escP[20];
    mysql_escape_string(Veh[slot][vPlate], escP, g_SQL, sizeof(escP));
    format(q, sizeof(q), "UPDATE vehicles SET owner_char=%d,owner_org=%d,pos_x=%.2f,pos_y=%.2f,pos_z=%.2f,angle=%.2f,color1=%d,color2=%d,plate='%s',fuel=%.1f,mileage=%.1f,locked=%d WHERE id=%d",
        Veh[slot][vOwnerChar], Veh[slot][vOwnerOrg], x, y, z, a, Veh[slot][vColor1], Veh[slot][vColor2], escP, Veh[slot][vFuel], Veh[slot][vMileage], Veh[slot][vLocked], Veh[slot][vDBID]);
    mysql_tquery(g_SQL, q);
    return 1;
}

// Admin cria veiculo persistente p/ jogador
stock AdminCreateVehicle(playerid, model, color1 = -1, color2 = -1, price = 0) {
    new slot = Veh_FindFree();
    if (slot == -1) return 0;
    new Float:x, Float:y, Float:z, Float:a;
    GetPlayerPos(playerid, x, y, z); GetPlayerFacingAngle(playerid, a);
    x += 2.0;
    Veh[slot][vModel] = model;
    Veh[slot][vOwnerChar] = Player[playerid][pCharID];
    Veh[slot][vX] = x; Veh[slot][vY] = y; Veh[slot][vZ] = z; Veh[slot][vA] = a;
    Veh[slot][vColor1] = color1; Veh[slot][vColor2] = color2;
    format(Veh[slot][vPlate], 12, "AURORA");
    Veh[slot][vFuel] = 100.0; Veh[slot][vLocked] = 1;
    Veh[slot][vSAMP] = CreateVehicle(model, x, y, z, a, color1, color2, 60000);
    SetVehicleNumberPlate(Veh[slot][vSAMP], Veh[slot][vPlate]);
    new q[512];
    format(q, sizeof(q), "INSERT INTO vehicles (owner_char,model,pos_x,pos_y,pos_z,angle,color1,color2,plate,fuel,price) VALUES (%d,%d,%.2f,%.2f,%.2f,%.2f,%d,%d,'%s',100,%d)",
        Veh[slot][vOwnerChar], model, x, y, z, a, color1, color2, Veh[slot][vPlate], price);
    mysql_tquery(g_SQL, q, "OnVehicleCreated", "d", slot);
    new m[128];
    format(m, sizeof(m), "vehicle create model=%d char=%d", model, Veh[slot][vOwnerChar]);
    LogEvent(LOG_VEHICLE, m);
    return 1;
}

forward OnVehicleCreated(slot);
public OnVehicleCreated(slot) { Veh[slot][vDBID] = cache_insert_id(); return 1; }

stock Veh_ToggleLock(playerid) {
    if (!IsPlayerInAnyVehicle(playerid)) {
        // tenta trancar o mais proximo do jogador que ele seja dono
        new Float:px, Float:py, Float:pz;
        GetPlayerPos(playerid, px, py, pz);
        new best = -1; new Float:bd = 6.0;
        for (new i = 0; i < MAX_VEHICLES; i++) {
            if (Veh[i][vDBID] == 0 || Veh[i][vSAMP] == INVALID_VEHICLE_ID) continue;
            if (Veh[i][vOwnerChar] != Player[playerid][pCharID] && Veh[i][vOwnerOrg] != Player[playerid][pOrg]) continue;
            new Float:x, Float:y, Float:z;
            GetVehiclePos(Veh[i][vSAMP], x, y, z);
            new Float:d = GetDistance3D(px, py, pz, x, y, z);
            if (d < bd) { bd = d; best = i; }
        }
        if (best == -1) return Notify(playerid, "Nenhum veiculo seu por perto.", COLOR_RED), 0;
        Veh[best][vLocked] = !Veh[best][vLocked];
        new eng, lig, ala, por, cap, obj;
        GetVehicleParamsEx(Veh[best][vSAMP], eng, lig, ala, por, cap, obj);
        SetVehicleParamsEx(Veh[best][vSAMP], eng, lig, ala, Veh[best][vLocked] ? 1 : 0, cap, obj);
        Notify(playerid, Veh[best][vLocked] ? "Veiculo trancado." : "Veiculo destrancado.");
        SaveVehicle(best);
        return 1;
    }
    return 0;
}

// Consumo de combustivel: timer global chama a cada 60s p/ veiculos ocupados
stock Veh_FuelTick() {
    for (new i = 0; i < MAX_VEHICLES; i++) {
        if (Veh[i][vSAMP] == INVALID_VEHICLE_ID) continue;
        new eng, lig, ala, por, cap, obj;
        GetVehicleParamsEx(Veh[i][vSAMP], eng, lig, ala, por, cap, obj);
        if (eng == 1) {
            Veh[i][vFuel] -= 0.5;
            if (Veh[i][vFuel] <= 0.0) {
                Veh[i][vFuel] = 0.0;
                SetVehicleParamsEx(Veh[i][vSAMP], 0, lig, ala, por, cap, obj);
            }
        }
    }
    return 1;
}
