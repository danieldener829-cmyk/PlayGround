package com.ps2hub.data.local.entity

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(tableName = "users")
data class UserEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val name: String = "Jogador",
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "genres")
data class GenreEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val name: String
)

@Entity(tableName = "developers")
data class DeveloperEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val name: String
)

@Entity(tableName = "publishers")
data class PublisherEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val name: String
)

/**
 * Catálogo principal. Preparado para milhares de registros (índices + paginação via Paging 3).
 * coverUrl pode ser http(s) ou null (neste caso a UI gera capa procedural sem violar copyright).
 * NENHUMA ROM/ISO é incluída no app.
 */
@Entity(
    tableName = "games",
    indices = [
        Index("title"),
        Index("genre"),
        Index("year"),
        Index("developer"),
        Index("region"),
        Index("updatedAt")
    ]
)
data class GameEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val title: String,
    val description: String = "",
    val genre: String = "",
    val developer: String = "",
    val publisher: String = "",
    val year: Int = 2000,
    val region: String = "NTSC-U", // NTSC-U | NTSC-J | PAL | NTSC-J/C ...
    val languages: String = "EN",   // CSV: EN, PT-BR, JA ...
    val players: String = "1",      // "1", "1-2", "1-4", "Online"
    val rating: String = "L",       // L, 10, 12, 14, 16, 18
    val sizeApprox: String = "",
    val status: String = "Completo",
    val tags: String = "",          // CSV
    val relatedIds: String = "",    // CSV de ids
    val coverUrl: String? = null,   // remoto opcional
    val featured: Boolean = false,
    val accessCount: Int = 0,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
)

@Entity(
    tableName = "favorites",
    primaryKeys = ["gameId"],
)
data class FavoriteEntity(
    val gameId: Long,
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "user_games")
data class UserGameEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val gameId: Long, // referência ao catálogo
    val addedAt: Long = System.currentTimeMillis()
)

@Entity(
    tableName = "game_files",
    foreignKeys = [
        ForeignKey(
            entity = UserGameEntity::class,
            parentColumns = ["id"],
            childColumns = ["userGameId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index("userGameId")]
)
data class GameFileEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val userGameId: Long,
    val displayName: String,
    val uri: String,       // content:// persistido via takePersistableUriPermission
    val mimeType: String? = null,
    val sizeBytes: Long = 0,
    val sha256Prefix: String? = null, // validação leve (prefixo), sem expor dados
    val addedAt: Long = System.currentTimeMillis()
)

@Entity(
    tableName = "play_history",
    indices = [Index("gameId"), Index("openedAt")]
)
data class PlayHistoryEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val gameId: Long,
    val openedAt: Long = System.currentTimeMillis(),
    val action: String = "view" // view | library_open | file_open
)
