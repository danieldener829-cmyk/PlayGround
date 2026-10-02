# PS2 HUB — Biblioteca / Launcher de jogos de PlayStation 2

Aplicativo Android nativo (Kotlin + Jetpack Compose + Room + Paging 3 + Coil + WorkManager).
Funciona como **catálogo/biblioteca**: pesquisa, favoritos, biblioteca pessoal, importação de
arquivos próprios e área administrativa. **Não inclui ROMs, ISOs ou qualquer conteúdo protegido.**

## Stack (por que ela?)
- **Kotlin + Jetpack Compose (Material 3):** UI moderna, declarativa, rápida e responsiva.
- **Room:** cache offline-first preparado para milhares de jogos (índices + paginação).
- **Paging 3:** carregamento incremental — nunca carrega milhares de capas de uma vez.
- **Navigation Compose:** navegação tipada por rotas string simples.
- **Coil:** lazy loading + cache de imagens em memória/disco.
- **WorkManager (`SyncWorker`):** sincronização periódica do catálogo quando houver internet.
- **Storage Access Framework (`OpenDocument`):** importação segura, sem permissões amplas permanentes.

## Estrutura
```
PS2Hub/
  settings.gradle.kts  build.gradle.kts  gradle/libs.versions.toml
  app/
    build.gradle.kts
    src/main/
      AndroidManifest.xml
      java/com/ps2hub/
        MainActivity.kt  Ps2HubApp.kt
        navigation/ (Routes, Ps2HubNav)
        data/local/entity/ (users, games, genres, developers, publishers, favorites, user_games, game_files, play_history)
        data/local/dao/  data/local/Ps2HubDb.kt
        data/repository/GameRepository.kt
        data/seed/SeedGames.kt (20 jogos de exemplo, só metadados)
        ui/theme/  ui/components/ (GameCard, GameCover procedural)
        ui/home/ ui/catalog/ ui/detail/ ui/library/ ui/favorites/ ui/admin/
        util/ (FileValidator, EmulatorLauncher, SyncWorker)
```

## Telas
| Rota | Conteúdo |
|---|---|
| Home | Logo, busca, destaques, categorias, recentes, mais acessados, favoritos, botões Meus Jogos/Favoritos |
| Catálogo | Busca livre ("ação", "2005"), filtros gênero/ano/dev/região, ordenação, grade paginada |
| Detalhe | Capa grande, descrição, ficha técnica, Favoritar, Adicionar à biblioteca, Importar arquivo próprio, arquivos vinculados (Abrir com emulador), histórico |
| Meus Jogos | Grade paginada da biblioteca pessoal (offline) |
| Favoritos | Grade paginada de favoritos (offline) |
| Admin | CRUD de jogos, criar/remover gêneros, busca para editar (separada do usuário comum) |

## Banco de dados
Tabelas Room: `users, games, genres, developers, publishers, favorites, user_games, game_files, play_history`.
`games` tem índices em `title, genre, year, developer, region, updatedAt` para busca rápida offline.

## Offline
Tudo lido do Room. `SyncWorker` (24h) é o ponto de sincronização: implemente o `GET /catalog?page=N`
e faça `upsertAll()` — o app já nasce offline-first com seed local.

## Segurança / Legal
- `FileValidator`: aceita apenas extensões `iso, bin, img, cso, chd, isz, mdf, nrg, dump`, limite 8 GB, lê só 16 bytes de assinatura.
- Permissões mínimas: `INTERNET/ACCESS_NETWORK_STATE` + leitura de mídia condicional; importação via SAF com `takePersistableUriPermission` (sem `MANAGE_ALL_FILES`).
- `EmulatorLauncher`: apenas `ACTION_VIEW` + chooser — abre o arquivo do usuário no emulador que ele já tem instalado. Nenhum download automático.
- Capas: procedurais (gradiente + iniciais) quando `coverUrl == null`; URLs remotas opcionais via Coil com cache.

## Como abrir e compilar
1. Abra o **Android Studio (Hedgehog ou superior)** → Open → selecione a pasta `PS2Hub/`.
2. Aguarde o sync do Gradle (AGP 8.5.2, Kotlin 2.0.20, compileSdk 34, minSdk 26).
3. Rode em emulador/dispositivo: `Run > app` ou `./gradlew assembleDebug`.
4. APKs em `app/build/outputs/apk/debug/app-debug.apk` (instale com `adb install`).

```bash
cd PS2Hub
./gradlew assembleDebug        # APK debug
./gradlew assembleRelease      # release (minify + shrink ativados)
```

## Testes manuais sugeridos
- Buscar "ação" → só Ação; "2005" → só 2005; combinar gênero + região + ordenação A–Z.
- Favoritar/desfavoritar → confere na tela Favoritos (persiste offline).
- Detalhe → Adicionar à biblioteca → aparece em Meus Jogos.
- Detalhe → Importar arquivo próprio → escolha um `.iso/.chd` seu → Abrir → chooser do emulador.
- Admin (engrenagem na Home) → Novo jogo → salva → aparece no catálogo; edite/exclua.
- Gire a tela / telas pequenas: grades usam `GridCells.Adaptive(140.dp)`.

## Backend (opcional)
Implemente `GET /catalog?page&since=` retornando os campos de `GameEntity` e complete o `TODO` em
`util/SyncWorker.kt`. Para milhares de jogos, mantenha `pageSize=30` e `prefetchDistance=10`.
