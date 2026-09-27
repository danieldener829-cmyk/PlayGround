# Aurora RP — Guia de instalação, compilação e extensão

## 1. Estrutura de pastas (onde cada arquivo vai)

```
server-root/
  samp-server.exe / samp03svr      <- binário SA-MP 0.3.7-R2
  server.cfg                        <- copie de server.cfg.example
  gamemodes/main.pwn -> main.amx    <- compilado
  pawno/includes/                   <- a_samp, a_mysql, streamer, sscanf2, Whirlpool, pawn.cmd
  plugins/                          <- .so (linux) ou .dll (windows)
  scriptfiles/mysql.ini             <- copie de scriptfiles/mysql.ini.example
  scriptfiles/logs/                 <- mkdir manual
  sql/schema.sql
```

> Este repositório guarda os fontes em `gamemodes/`, `include/`, `sql/`, `scriptfiles/`.
> Na hora de hospedar, copie `gamemodes/main.pwn` para `gamemodes/` do servidor
> e `include/*.inc` para `pawno/include/aurora/` ajustando os `#include` se mudar o caminho.

## 2. Dependências exatas

| Tipo | Nome | Onde baixar |
|---|---|---|
| Plugin | MySQL R41-4 (mysql_static) | github.com/pBlueG/SA-MP-MySQL |
| Plugin | Streamer v2.9+ | github.com/samp-incognito/samp-streamer-plugin |
| Plugin | sscanf 2.8+ | github.com/maddinat0r/sscanf |
| Plugin | Whirlpool | github.com/Southclaws/samp-whirlpool (ou samp-store) |
| Plugin | pawn.cmd 3.x | github.com/katursis/Pawn.CMD |
| Include | a_mysql.inc (R41-4) | mesmo repo do plugin MySQL |
| Compilador | pawncc 3.10 (Zeex) | github.com/pawn-lang/compiler |

Includes padrão `a_samp.inc` vêm com o pacote do servidor SA-MP 0.3.7.

## 3. MySQL

```bash
sudo apt install mysql-server
sudo mysql -e "CREATE USER 'samp'@'127.0.0.1' IDENTIFIED BY 'troque_aqui';"
sudo mysql -e "CREATE DATABASE samp_rp CHARACTER SET utf8mb4;"
sudo mysql -e "GRANT ALL ON samp_rp.* TO 'samp'@'127.0.0.1';"
mysql -u samp -p samp_rp < sql/schema.sql
cp scriptfiles/mysql.ini.example scriptfiles/mysql.ini
# edite host/user/pass/db
mkdir -p scriptfiles/logs
```

## 4. Compilar

```bash
# Windows (pawno):
pawncc gamemodes/main.pwn -o gamemodes/main.amx -;+ -(+ -d3

# Linux (pawncc Zeex):
./pawncc gamemodes/main.pwn -o gamemodes/main.amx -;+ -(+
```

Flags: `-;+` permite `;` opcional, `-(+` mostra warnings úteis.
Se `include/` estiver em outro caminho, adicione `-i include -i pawno/include`.

## 5. Iniciar

```bash
cp server.cfg.example server.cfg
# edite rcon_password e plugins (.so vs .dll)
./samp03svr  # linux
samp-server.exe  # windows
```

## 6. Como adicionar novos sistemas

1. Crie `include/meusistema.inc` com guard `#if defined _x_included`.
2. Se precisar ler `Player[]`, garanta que `config.inc` vem antes (já vem).
3. Se o sistema chama `Notify/UpdateHUD/GivePlayerCash`, inclua **depois** de `ui.inc/players.inc` no `main.pwn`.
4. Registre loaders em `DelayedLoad()` e savers em `AutosaveTick()` + `OnPlayerDisconnect`.
5. Crie tabela no `sql/schema.sql` + `INSERT` de migração.

## 7. Como adicionar comandos

Edite `include/commands.inc`:

```pawn
CMD:exemplo(playerid, params[]) {
    if (!RequireLogin(playerid)) return 1;
    SendClientMessage(playerid, COLOR_WHITE, "ok");
    return 1;
}
```

Valide sempre: login, permissão, distância, estado, args (sscanf), cooldown (`CmdCooldown`).

## 8. Como adicionar empregos

Em `include/jobs.inc`: incremente o `JobNames/JobStart/JobVehicle/JobPay` (índice 10+),
adicione `#define JOB_NOVO 10` e o ponto aparece automaticamente em `/emprego` e `/gps`
(adicione também em `GPSPoints`).

## 9. Como adicionar orgs

```sql
INSERT INTO organizations (name, org_type, base_x, base_y, base_z) VALUES ('Nova Org', 5, x, y, z);
```

Reinicie ou `rcon reload` — `LoadOrgs()` lê tudo. Cargos são 0-6 (`OrgRankNames`).

## 10. Segurança (o que já está coberto)

- Senhas: Whirlpool(pass+salt), salt 16 chars, comparação em Pawn (nunca SQL com senha).
- SQL: `mysql_escape_string` em todo input; ids numéricos via `%d`/`strval`.
- Flood: chat 800ms, cmds 600ms + 8/5s, mute progressivo.
- Teleport: snapshot 2s, tolerância 400m, auto-correção + log.
- Dinheiro: só via `GivePlayerCash/GivePlayerBank` (server-authoritative + log + clamp).
- Inventário: stack/peso validados no servidor + `ON DUPLICATE KEY` + clamp no load.
- Pre-login: `OnPlayerText/OnPlayerCommandReceived/OnPlayerSpawn` bloqueiam tudo.
