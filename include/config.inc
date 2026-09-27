// config.inc - Configuracao central do servidor
// Motivo: single source of truth. Senhas NUNCA hardcoded: lidas de scriptfiles/mysql.ini
#if defined _config_included
    #endinput
#endif
#define _config_included

#include <a_samp>

// Nucleo de dados do jogador: definido aqui (cedo) para quebrar
// dependencia circular entre ui.inc <-> players.inc.
// Motivo: HUD precisa ler Player[] e players.inc precisa chamar UpdateHUD.
enum E_PLAYER {
    pAccountID,
    pCharID,
    bool:pLogged,
    pAdmin,
    pSkin,
    pSex,
    pAge,
    Float:pPosX, Float:pPosY, Float:pPosZ, Float:pAngle,
    pInterior, pVW,
    Float:pHealth, Float:pArmour,
    Float:pHunger, Float:pThirst,
    pMoney, pBank,
    pLevel, pExp,
    pJob, pJobLevel, pJobExp,
    pOrg, pOrgRank,
    pPhone,
    pJailed, pJailTime,
    pMutedUntil
};
new Player[MAX_PLAYERS][E_PLAYER];

#define SERVER_NAME         "Aurora Roleplay"
#define SERVER_VERSION      "1.0.0"
#define SERVER_LANGUAGE     "Portugues Brasileiro"
#define MAX_HOUSES          500
#define MAX_BUSINESSES      300
#define MAX_ORGS            64
#define MAX_PLAYER_VEHICLES 5
#define MAX_INVENTORY_SLOTS 24
#define MAX_PHONE_CONTACTS  50

// Economia
#define START_MONEY         1500
#define START_BANK          3000
#define PAYDAY_INTERVAL     3600 // segundos
#define MAX_MONEY_HAND      100000000

// Empregos: recompensa base (multiplicada por nivel)
#define JOB_BASE_PAY        150

// MySQL (defaults; sobrescritos por scriptfiles/mysql.ini)
#define MYSQL_HOST          "127.0.0.1"
#define MYSQL_USER          "samp"
#define MYSQL_PASS          ""
#define MYSQL_DB            "samp_rp"
#define MYSQL_PORT          3306
#define MYSQL_LOG           true

// Dialogs IDs (faixa reservada global p/ evitar colisao)
enum {
    DIALOG_UNUSED = 0,
    DIALOG_LOGIN = 1000,
    DIALOG_REGISTER,
    DIALOG_REGISTER_AGE,
    DIALOG_REGISTER_SEX,
    DIALOG_CHAR_SKIN,
    DIALOG_BANK,
    DIALOG_BANK_DEPOSIT,
    DIALOG_BANK_WITHDRAW,
    DIALOG_BANK_TRANSFER,
    DIALOG_INVENTORY,
    DIALOG_INVENTORY_USE,
    DIALOG_PHONE,
    DIALOG_PHONE_CONTACTS,
    DIALOG_PHONE_SMS,
    DIALOG_GPS,
    DIALOG_HOUSE_MENU,
    DIALOG_BIZ_MENU,
    DIALOG_ORG_MENU,
    DIALOG_ADMIN_PANEL,
    DIALOG_HELP
};

// Cores
#define COLOR_WHITE         0xFFFFFFFF
#define COLOR_RED           0xFF3B30FF
#define COLOR_GREEN         0x34C759FF
#define COLOR_BLUE          0x0A84FFFF
#define COLOR_YELLOW        0xFFCC00FF
#define COLOR_ORANGE        0xFF9500FF
#define COLOR_GREY          0x8E8E93FF
#define COLOR_ADMIN         0xFF2D55FF
#define COLOR_PM_IN         0xFFD60AFF
#define COLOR_OOC           0xAEAEB2FF
#define COLOR_ME            0xC7B299FF
#define COLOR_DO            0x5AC8FAFF
