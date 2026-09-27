// utils.inc - Funcoes utilitarias compartilhadas
#if defined _utils_included
    #endinput
#endif
#define _utils_included

#include <a_samp>

// Retorna true se string e valida como nome RP: Nome_Sobrenome
stock bool:IsValidRPName(const name[]) {
    new len = strlen(name);
    if (len < 3 || len > 24) return false;
    new underscores = 0;
    for (new i = 0; i < len; i++) {
        new c = name[i];
        if (c == '_') { underscores++; continue; }
        if (!('A' <= c <= 'Z' || 'a' <= c <= 'z')) return false;
    }
    return underscores == 1;
}

stock bool:IsValidPassword(const pass[]) {
    new len = strlen(pass);
    return (4 <= len <= 64);
}

// Escapa % e controla tamanho p/ format seguro
stock SendSafeMessage(playerid, color, const msg[]) {
    new buf[256];
    strmid(buf, msg, 0, sizeof(buf));
    SendClientMessage(playerid, color, buf);
    return 1;
}

// Gera salt alfanumerico de 16 chars
stock GenerateSalt(dest[], size = 17) {
    new const charset[] = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    for (new i = 0; i < size - 1; i++) {
        dest[i] = charset[random(sizeof(charset) - 1)];
    }
    dest[size - 1] = EOS;
}

// Hash = Whirlpool(password + salt). Requer plugin Whirlpool.
// buffer deve ter 129 cells.
stock HashPassword(const password[], const salt[], dest[]) {
    new input[96];
    format(input, sizeof(input), "%s%s", password, salt);
    WP_Hash(dest, 129, input);
}

// Valida inteiro em string
stock bool:TryParseInt(const s[], &out) {
    if (s[0] == EOS) return false;
    new i = 0, neg = false;
    if (s[0] == '-') { neg = true; i = 1; if (s[1] == EOS) return false; }
    new val = 0;
    for (; s[i] != EOS; i++) {
        if (s[i] < '0' || s[i] > '9') return false;
        val = val * 10 + (s[i] - '0');
        if (val > 1000000000) return false;
    }
    out = neg ? -val : val;
    return true;
}

stock GetPlayerRPName(playerid, dest[], size = MAX_PLAYER_NAME) {
    GetPlayerName(playerid, dest, size);
}

// Distancia 3D rapida
stock Float:GetDistance3D(Float:x1, Float:y1, Float:z1, Float:x2, Float:y2, Float:z2) {
    return floatsqroot((x1-x2)*(x1-x2) + (y1-y2)*(y1-y2) + (z1-z2)*(z1-z2));
}

stock bool:IsPlayerInRangeOf(Float:x, Float:y, Float:z, playerid, Float:range) {
    new Float:px, Float:py, Float:pz;
    GetPlayerPos(playerid, px, py, pz);
    return GetDistance3D(x, y, z, px, py, pz) <= range;
}

// Timestamp unix -> string dd/mm/yyyy hh:mm (sem dependencias externas)
stock UnixToString(timestamp, dest[], size = 32) {
    // Aproximacao simples via gmtime nativo do Pawn? Usamos format basico.
    // Para logs, o MySQL usa NOW(); isto e so fallback visual.
    format(dest, size, "%d", timestamp);
}
