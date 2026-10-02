package com.ps2hub.data.local.dao

import androidx.paging.PagingSource
import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.ps2hub.data.local.entity.DeveloperEntity
import com.ps2hub.data.local.entity.GameEntity
import com.ps2hub.data.local.entity.GenreEntity
import com.ps2hub.data.local.entity.PublisherEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface GameDao {
    @Query("SELECT COUNT(*) FROM games")
    suspend fun count(): Int

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertAll(games: List<GameEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(game: GameEntity): Long

    @Update
    suspend fun update(game: GameEntity)

    @Query("DELETE FROM games WHERE id = :id")
    suspend fun deleteById(id: Long)

    @Query("SELECT * FROM games WHERE id = :id")
    suspend fun getById(id: Long): GameEntity?

    @Query("SELECT * FROM games WHERE id = :id")
    fun observeById(id: Long): Flow<GameEntity?>

    /**
     * Pesquisa rápida: nome, gênero, ano, desenvolvedora, região.
     * Suporta busca "livre": se query for número de 4 dígitos, filtra ano também.
     * Ordenação: relevance/title/yearAsc/yearDesc/recent/mostAccessed
     */
    fun pagingSearch(
        query: String,
        genre: String?,
        year: Int?,
        developer: String?,
        region: String?,
        sort: String
    ): PagingSource<Int, GameEntity> = pagingSearchInternal(
        q = "%${query.trim()}%",
        genre = genre,
        year = year,
        developer = developer,
        region = region,
        sortRelevance = sort == "relevance",
        sortTitle = sort == "title",
        sortYearAsc = sort == "yearAsc",
        sortYearDesc = sort == "yearDesc",
        sortAccessed = sort == "mostAccessed"
    )

    @Query(
        """
        SELECT * FROM games
        WHERE (:genre IS NULL OR :genre = '' OR genre = :genre)
          AND (:year IS NULL OR year = :year)
          AND (:developer IS NULL OR :developer = '' OR developer LIKE '%' || :developer || '%')
          AND (:region IS NULL OR :region = '' OR region = :region)
          AND (:q IS NULL OR :q = '%%' OR :q = '%' OR
               title LIKE :q OR genre LIKE :q OR developer LIKE :q OR publisher LIKE :q
               OR CAST(year AS TEXT) LIKE :q OR tags LIKE :q)
        ORDER BY
          CASE WHEN :sortRelevance = 1 THEN accessCount END DESC,
          CASE WHEN :sortAccessed = 1 THEN accessCount END DESC,
          CASE WHEN :sortTitle = 1 THEN title END ASC,
          CASE WHEN :sortYearAsc = 1 THEN year END ASC,
          CASE WHEN :sortYearDesc = 1 THEN year END DESC,
          updatedAt DESC
        """
    )
    fun pagingSearchInternal(
        q: String?,
        genre: String?,
        year: Int?,
        developer: String?,
        region: String?,
        sortRelevance: Boolean,
        sortTitle: Boolean,
        sortYearAsc: Boolean,
        sortYearDesc: Boolean,
        sortAccessed: Boolean
    ): PagingSource<Int, GameEntity>

    @Query("SELECT * FROM games ORDER BY createdAt DESC LIMIT :limit")
    fun recentAdded(limit: Int = 10): Flow<List<GameEntity>>

    @Query("SELECT * FROM games ORDER BY accessCount DESC LIMIT :limit")
    fun mostAccessed(limit: Int = 10): Flow<List<GameEntity>>

    @Query("SELECT * FROM games WHERE featured = 1 ORDER BY updatedAt DESC LIMIT :limit")
    fun featured(limit: Int = 10): Flow<List<GameEntity>>

    @Query("SELECT DISTINCT genre FROM games WHERE genre != '' ORDER BY genre ASC")
    fun allGenres(): Flow<List<String>>

    @Query("UPDATE games SET accessCount = accessCount + 1, updatedAt = :now WHERE id = :id")
    suspend fun incrementAccess(id: Long, now: Long)

    @Query("SELECT * FROM games WHERE id IN (:ids)")
    suspend fun getByIds(ids: List<Long>): List<GameEntity>
}

@Dao
interface CatalogMetaDao {
    @Query("SELECT * FROM genres ORDER BY name ASC")
    fun genres(): Flow<List<GenreEntity>>
    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun addGenre(e: GenreEntity): Long
    @Query("DELETE FROM genres WHERE id = :id")
    suspend fun deleteGenre(id: Long)

    @Query("SELECT * FROM developers ORDER BY name ASC")
    fun developers(): Flow<List<DeveloperEntity>>
    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun addDeveloper(e: DeveloperEntity): Long
    @Query("DELETE FROM developers WHERE id = :id")
    suspend fun deleteDeveloper(id: Long)

    @Query("SELECT * FROM publishers ORDER BY name ASC")
    fun publishers(): Flow<List<PublisherEntity>>
    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun addPublisher(e: PublisherEntity): Long
    @Query("DELETE FROM publishers WHERE id = :id")
    suspend fun deletePublisher(id: Long)
}

@Dao
interface FavoriteDao {
    @Query("SELECT gameId FROM favorites")
    fun observeIds(): Flow<List<Long>>
    @Query("SELECT EXISTS(SELECT 1 FROM favorites WHERE gameId = :gameId)")
    fun isFavorite(gameId: Long): Flow<Boolean>
    @Query("INSERT OR IGNORE INTO favorites(gameId, createdAt) VALUES (:gameId, :now)")
    suspend fun add(gameId: Long, now: Long)
    @Query("DELETE FROM favorites WHERE gameId = :gameId")
    suspend fun remove(gameId: Long)
    @Query(
        "SELECT g.* FROM games g INNER JOIN favorites f ON f.gameId = g.id ORDER BY f.createdAt DESC"
    )
    fun favoritesPaged(): PagingSource<Int, GameEntity>
    @Query(
        "SELECT g.* FROM games g INNER JOIN favorites f ON f.gameId = g.id ORDER BY f.createdAt DESC LIMIT :limit"
    )
    fun favoritesPreview(limit: Int = 10): Flow<List<GameEntity>>
}

@Dao
interface LibraryDao {
    @Query("INSERT OR IGNORE INTO user_games(gameId, addedAt) VALUES (:gameId, :now)")
    suspend fun addToLibrary(gameId: Long, now: Long)

    @Query("SELECT EXISTS(SELECT 1 FROM user_games WHERE gameId = :gameId)")
    fun isInLibrary(gameId: Long): Flow<Boolean>

    @Query("DELETE FROM user_games WHERE gameId = :gameId")
    suspend fun removeFromLibrary(gameId: Long)

    @Query(
        """
        SELECT g.* FROM games g INNER JOIN user_games u ON u.gameId = g.id
        ORDER BY u.addedAt DESC
        """
    )
    fun libraryPaged(): PagingSource<Int, GameEntity>

    @Query("SELECT * FROM user_games WHERE gameId = :gameId LIMIT 1")
    suspend fun userGameFor(gameId: Long): com.ps2hub.data.local.entity.UserGameEntity?

    @Query("SELECT * FROM user_games ORDER BY addedAt DESC")
    fun allUserGames(): Flow<List<com.ps2hub.data.local.entity.UserGameEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertFile(file: com.ps2hub.data.local.entity.GameFileEntity): Long

    @Query("SELECT * FROM game_files WHERE userGameId = :userGameId ORDER BY addedAt DESC")
    fun filesFor(userGameId: Long): Flow<List<com.ps2hub.data.local.entity.GameFileEntity>>

    @Query("DELETE FROM game_files WHERE id = :id")
    suspend fun deleteFile(id: Long)
}

@Dao
interface HistoryDao {
    @Insert
    suspend fun log(e: com.ps2hub.data.local.entity.PlayHistoryEntity)
    @Query("SELECT * FROM play_history WHERE gameId = :gameId ORDER BY openedAt DESC LIMIT :limit")
    fun forGame(gameId: Long, limit: Int = 20): Flow<List<com.ps2hub.data.local.entity.PlayHistoryEntity>>
    @Query("DELETE FROM play_history WHERE gameId = :gameId")
    suspend fun clearFor(gameId: Long)
}
