// logs.inc - Log centralizado (arquivo + MySQL) + historico de transacoes
#if defined _logs_included
    #endinput
#endif
#define _logs_included

#include <a_samp>

enum E_LOG_TYPE {
    LOG_LOGIN,
    LOG_MONEY,
    LOG_ADMIN,
    LOG_EXPLOIT,
    LOG_CHAT,
    LOG_VEHICLE,
    LOG_PROPERTY
};

stock LogToFile(const file[], const text[]) {
    new File:f = fopen(file, io_append);
    if (!f) return 0;
    new date[16], time[16];
    getdate(date[2], date[1], date[0]);
    gettime(time[0], time[1], time[2]);
    new line[320];
    format(line, sizeof(line), "[%02d/%02d/%04d %02d:%02d:%02d] %s\r\n",
        date[2], date[1], date[0], time[0], time[1], time[2], text);
    fwrite(f, line);
    fclose(f);
    return 1;
}

stock LogEvent(E_LOG_TYPE:type, const text[]) {
    new fname[48];
    switch (type) {
        case LOG_LOGIN:   fname = "scriptfiles/logs/login.log";
        case LOG_MONEY:   fname = "scriptfiles/logs/money.log";
        case LOG_ADMIN:   fname = "scriptfiles/logs/admin.log";
        case LOG_EXPLOIT: fname = "scriptfiles/logs/exploit.log";
        case LOG_CHAT:    fname = "scriptfiles/logs/chat.log";
        case LOG_VEHICLE: fname = "scriptfiles/logs/vehicle.log";
        default:          fname = "scriptfiles/logs/general.log";
    }
    LogToFile(fname, text);

    // Espelha no MySQL (nao-bloqueante). Tabela `logs(type,text,created_at)`.
    if (g_DBConnected) {
        new query[512], esc[256];
        mysql_escape_string(text, esc, g_SQL, sizeof(esc));
        format(query, sizeof(query),
            "INSERT INTO logs (`type`,`text`) VALUES ('%d','%s')",
            _:type, esc);
        mysql_tquery(g_SQL, query);
    }
    return 1;
}

// Registra movimentacao monetaria (mao/banco) p/ auditoria anti-dupe
stock LogTransaction(fromChar, toChar, const type[], amount, const reason[]) {
    if (!g_DBConnected) return 0;
    new query[512], escR[128];
    mysql_escape_string(reason, escR, g_SQL, sizeof(escR));
    new escT[32];
    mysql_escape_string(type, escT, g_SQL, sizeof(escT));
    format(query, sizeof(query),
        "INSERT INTO transactions (from_char,to_char,`type`,amount,reason) VALUES (%d,%d,'%s',%d,'%s')",
        fromChar, toChar, escT, amount, escR);
    mysql_tquery(g_SQL, query);
    return 1;
}
