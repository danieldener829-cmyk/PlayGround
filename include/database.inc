// database.inc - Conexao MySQL + helpers (versao final)
// Requer: plugin mysql R41-4, include a_mysql.inc
#if defined _database_included
    #endinput
#endif
#define _database_included

#include <a_samp>
#include <a_mysql>

new MySQL:g_SQL = MYSQL_INVALID_HANDLE;
new bool:g_DBConnected = false;

stock LoadMySQLConfig(host[], hsize, user[], usize, pass[], psize, db[], dbsize, &port) {
    format(host, hsize, "%s", MYSQL_HOST);
    format(user, usize, "%s", MYSQL_USER);
    format(pass, psize, "%s", MYSQL_PASS);
    format(db, dbsize, "%s", MYSQL_DB);
    port = MYSQL_PORT;
    new File:f = fopen("scriptfiles/mysql.ini", io_read);
    if (!f) return 0;
    new line[160], key[32], val[96];
    while (fread(f, line)) {
        if (line[0] == EOS || line[0] == ';' || line[0] == '#') continue;
        new eq = strfind(line, "=");
        if (eq == -1) continue;
        strmid(key, line, 0, eq, sizeof(key));
        strmid(val, line, eq + 1, strlen(line), sizeof(val));
        new klen = strlen(key);
        while (klen > 0 && (key[klen-1] == ' ' || key[klen-1] == '\t' || key[klen-1] == '\r' || key[klen-1] == '\n')) key[--klen] = EOS;
        new vlen = strlen(val);
        while (vlen > 0 && (val[vlen-1] == '\r' || val[vlen-1] == '\n' || val[vlen-1] == ' ' || val[vlen-1] == '\t')) val[--vlen] = EOS;
        // remove aspas
        if (vlen >= 2 && val[0] == '"' && val[vlen-1] == '"') { strmid(val, val, 1, vlen-1, sizeof(val)); }
        if (!strcmp(key, "host")) format(host, hsize, "%s", val);
        else if (!strcmp(key, "user")) format(user, usize, "%s", val);
        else if (!strcmp(key, "pass")) format(pass, psize, "%s", val);
        else if (!strcmp(key, "db")) format(db, dbsize, "%s", val);
        else if (!strcmp(key, "port")) port = strval(val);
    }
    fclose(f);
    return 1;
}

forward OnDatabaseConnect();
public OnDatabaseConnect() {
    if (mysql_errno(g_SQL) != 0) {
        printf("[DB] Falha MySQL errno=%d. Retry em 5s.", mysql_errno(g_SQL));
        g_DBConnected = false;
        SetTimer("RetryDatabaseConnect", 5000, false);
        return 0;
    }
    g_DBConnected = true;
    print("[DB] MySQL conectado.");
    mysql_set_charset("utf8mb4");
    return 1;
}

forward RetryDatabaseConnect();
public RetryDatabaseConnect() { DB_Connect(); return 1; }

stock DB_Connect() {
    new host[64], user[32], pass[64], db[32], port;
    LoadMySQLConfig(host, sizeof(host), user, sizeof(user), pass, sizeof(pass), db, sizeof(db), port);
    new opt = mysql_init_option();
    mysql_set_option(opt, AUTO_RECONNECT, true);
    mysql_set_option(opt, MULTI_STATEMENTS, false);
    #if MYSQL_LOG == true
        mysql_log(ALL);
    #endif
    g_SQL = mysql_connect(host, user, pass, db, opt, port, true);
    if (g_SQL == MYSQL_INVALID_HANDLE) { print("[DB] Handle invalido."); return 0; }
    CallLocalFunction("OnDatabaseConnect", "");
    return 1;
}

stock DB_IsConnected() { return g_DBConnected && g_SQL != MYSQL_INVALID_HANDLE; }
