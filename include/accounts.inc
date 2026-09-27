// accounts.inc - Registro/Login com Whirlpool + salt
#if defined _accounts_included
    #endinput
#endif
#define _accounts_included

#include <a_samp>

stock ShowLoginOrRegister(playerid) {
    new name[MAX_PLAYER_NAME];
    GetPlayerName(playerid, name, sizeof(name));
    if (!IsValidRPName(name)) {
        SendClientMessage(playerid, COLOR_RED, "[ERRO] Seu nick deve ser Nome_Sobrenome. Troque e reconecte.");
        Kick(playerid);
        return 0;
    }
    new query[160], esc[32];
    mysql_escape_string(name, esc, g_SQL, sizeof(esc));
    format(query, sizeof(query), "SELECT id,password_hash,salt,admin_level,banned FROM accounts WHERE username='%s' LIMIT 1", esc);
    mysql_tquery(g_SQL, query, "OnAccountCheck", "d", playerid);
    return 1;
}

forward OnAccountCheck(playerid);
public OnAccountCheck(playerid) {
    if (!IsPlayerConnected(playerid)) return 0;
    if (cache_num_rows() == 0) {
        ShowPlayerDialog(playerid, DIALOG_REGISTER, DIALOG_STYLE_PASSWORD, "Registro",
            "Bem-vindo a Aurora RP!\nSua conta nao existe. Crie uma senha (4-64 chars):",
            "Registrar", "Sair");
    } else {
        new banned;
        cache_get_value_int(0, "banned", banned);
        if (banned) { SendClientMessage(playerid, COLOR_RED, "[BAN] Conta banida."); Kick(playerid); return 0; }
        new aid;
        cache_get_value_int(0, "id", aid);
        PVarInt(playerid, "TmpAccountID", aid);
        ShowPlayerDialog(playerid, DIALOG_LOGIN, DIALOG_STYLE_PASSWORD, "Login",
            "Conta encontrada! Digite sua senha:",
            "Entrar", "Sair");
    }
    return 1;
}

forward OnAccountRegistered(playerid);
public OnAccountRegistered(playerid) {
    Player[playerid][pAccountID] = cache_insert_id();
    PVarInt(playerid, "TmpAccountID", Player[playerid][pAccountID]);
    LoadCharacter(playerid);
    return 1;
}

stock TryRegister(playerid, const pass[]) {
    if (!IsValidPassword(pass)) {
        ShowPlayerDialog(playerid, DIALOG_REGISTER, DIALOG_STYLE_PASSWORD, "Registro",
            "Senha invalida! Use 4-64 caracteres:", "Registrar", "Sair");
        return 0;
    }
    new name[MAX_PLAYER_NAME];
    GetPlayerName(playerid, name, sizeof(name));
    new salt[17], hash[129];
    GenerateSalt(salt);
    HashPassword(pass, salt, hash);
    new q[320], escN[32], escH[140], escS[20];
    mysql_escape_string(name, escN, g_SQL, sizeof(escN));
    mysql_escape_string(hash, escH, g_SQL, sizeof(escH));
    mysql_escape_string(salt, escS, g_SQL, sizeof(escS));
    new ip[20];
    GetPlayerIp(playerid, ip, sizeof(ip));
    new escIp[24];
    mysql_escape_string(ip, escIp, g_SQL, sizeof(escIp));
    format(q, sizeof(q), "INSERT INTO accounts (username,password_hash,salt,last_ip) VALUES ('%s','%s','%s','%s')",
        escN, escH, escS, escIp);
    mysql_tquery(g_SQL, q, "OnAccountRegistered", "d", playerid);
    return 1;
}

forward OnAccountLogin(playerid);
public OnAccountLogin(playerid) {
    if (cache_num_rows() == 0) { Kick(playerid); return 0; } // condicao de corrida
    new aid, admin;
    cache_get_value_int(0, "id", aid);
    cache_get_value_int(0, "admin_level", admin);
    Player[playerid][pAccountID] = aid;
    Player[playerid][pAdmin] = admin;
    PVarInt(playerid, "Admin", admin);
    new q[128];
    format(q, sizeof(q), "UPDATE accounts SET last_login=NOW() WHERE id=%d", aid);
    mysql_tquery(g_SQL, q);
    LoadCharacter(playerid);
    return 1;
}

stock TryLogin(playerid, const pass[]) {
    new aid = PVarInt(playerid, "TmpAccountID");
    // Comparacao via Whirlpool no Pawn (MySQL nao tem Whirlpool).
    // aid e inteiro -> sem risco de injection. pass via callback "s" e comparado em memoria.
    new q2[96];
    format(q2, sizeof(q2), "SELECT id,password_hash,salt,admin_level FROM accounts WHERE id=%d LIMIT 1", aid);
    mysql_tquery(g_SQL, q2, "OnAccountPasswordCheck", "ds", playerid, pass);
    return 1;
}

forward OnAccountPasswordCheck(playerid, const pass[]);
public OnAccountPasswordCheck(playerid, const pass[]) {
    if (cache_num_rows() == 0) { Kick(playerid); return 0; }
    new dbhash[129], salt[17], aid, admin;
    cache_get_value(0, "password_hash", dbhash);
    cache_get_value(0, "salt", salt);
    cache_get_value_int(0, "id", aid);
    cache_get_value_int(0, "admin_level", admin);
    new calc[129];
    HashPassword(pass, salt, calc);
    if (strcmp(calc, dbhash)) {
        new fails = PVarInt(playerid, "LoginFails") + 1;
        PVarInt(playerid, "LoginFails", fails);
        if (fails >= 3) { SendClientMessage(playerid, COLOR_RED, "[LOGIN] 3 falhas. Kick."); Kick(playerid); }
        else ShowPlayerDialog(playerid, DIALOG_LOGIN, DIALOG_STYLE_PASSWORD, "Login",
            "Senha incorreta! Tente novamente:", "Entrar", "Sair");
        return 0;
    }
    Player[playerid][pAccountID] = aid;
    Player[playerid][pAdmin] = admin;
    PVarInt(playerid, "Admin", admin);
    new q[128], ip[20], escIp[24];
    GetPlayerIp(playerid, ip, sizeof(ip));
    mysql_escape_string(ip, escIp, g_SQL, sizeof(escIp));
    format(q, sizeof(q), "UPDATE accounts SET last_login=NOW(),last_ip='%s' WHERE id=%d", escIp, aid);
    mysql_tquery(g_SQL, q);
    LoadCharacter(playerid);
    return 1;
}
