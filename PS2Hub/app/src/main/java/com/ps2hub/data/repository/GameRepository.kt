package com.ps2hub.data.repository

import androidx.paging.Pager
import androidx.paging.PagingConfig
import androidx.paging.PagingData
import com.ps2hub.data.local.dao.CatalogMetaDao
import com.ps2hub.data.local.dao.FavoriteDao
import com.ps2hub.data.local.dao.GameDao
import com.ps2hub.data.local.dao.HistoryDao
import com.ps2hub.data.local.dao.LibraryDao
import com.ps2hub.data.local.entity.DeveloperEntity
import com.ps2hub.data.local.entity.GameEntity
import com.ps2hub.data.local.entity.GameFileEntity
import com.ps2hub.data.local.entity.GenreEntity
import com.ps2hub.data.local.entity.PlayHistoryEntity
import com.ps2hub.data.local.entity.PublisherEntity
import kotlinx.coroutines.flow.Flow

data class SearchFilters(
    val query: String = "",
    val genre: String? = null,
    val year: Int? = null,
    val developer: String? = null,
    val region: String? = null,
    val sort: String = "relevance" // relevance|title|yearAsc|yearDesc|recent|mostAccessed
)

class GameRepository(
    private val games: GameDao,
    private val favorites: FavoriteDao,
    private val library: LibraryDao,
    private val history: HistoryDao,
    private val meta: CatalogMetaDao
) {
    fun searchPaged(filters: SearchFilters): Flow<PagingData<GameEntity>> =
        Pager(PagingConfig(pageSize = 30, prefetchDistance = 10, enablePlaceholders = false)) {
            games.pagingSearch(filters.query, filters.genre, filters.year, filters.developer, filters.region, filters.sort)
        }.flow

    fun favoritesPaged(): Flow<PagingData<GameEntity>> =
        Pager(PagingConfig(pageSize = 30, enablePlaceholders = false)) { favorites.favoritesPaged() }.flow

    fun libraryPaged(): Flow<PagingData<GameEntity>> =
        Pager(PagingConfig(pageSize = 30, enablePlaceholders = false)) { library.libraryPaged() }.flow

    fun recentAdded(limit: Int = 10) = games.recentAdded(limit)
    fun mostAccessed(limit: Int = 10) = games.mostAccessed(limit)
    fun featured(limit: Int = 5) = games.featured(limit)
    fun allGenres() = games.allGenres()
    fun observeGame(id: Long) = games.observeById(id)
    suspend fun getGame(id: Long) = games.getById(id)
    suspend fun incrementAccess(id: Long) {
        games.incrementAccess(id, System.currentTimeMillis())
        history.log(PlayHistoryEntity(gameId = id, action = "view"))
    }
    suspend fun upsert(game: GameEntity) = games.upsert(game)
    suspend fun delete(id: Long) = games.deleteById(id)

    fun isFavorite(id: Long) = favorites.isFavorite(id)
    fun favoriteIds() = favorites.observeIds()
    fun favoritesPreview(limit: Int = 10) = favorites.favoritesPreview(limit)
    suspend fun toggleFavorite(id: Long, fav: Boolean) {
        if (fav) favorites.add(id, System.currentTimeMillis()) else favorites.remove(id)
    }

    fun isInLibrary(id: Long) = library.isInLibrary(id)
    suspend fun addToLibrary(id: Long) { library.addToLibrary(id, System.currentTimeMillis()) }
    suspend fun removeFromLibrary(id: Long) = library.removeFromLibrary(id)
    suspend fun userGameFor(gameId: Long) = library.userGameFor(gameId)
    fun filesFor(userGameId: Long) = library.filesFor(userGameId)
    suspend fun addFile(f: GameFileEntity) = library.upsertFile(f)
    suspend fun deleteFile(id: Long) = library.deleteFile(id)

    fun historyFor(gameId: Long) = history.forGame(gameId)
    suspend fun logAction(gameId: Long, action: String) {
        history.log(PlayHistoryEntity(gameId = gameId, action = action))
    }

    // Admin — metadados
    fun genres() = meta.genres()
    fun developers() = meta.developers()
    fun publishers() = meta.publishers()
    suspend fun addGenre(name: String) = meta.addGenre(GenreEntity(name = name))
    suspend fun addDeveloper(name: String) = meta.addDeveloper(DeveloperEntity(name = name))
    suspend fun addPublisher(name: String) = meta.addPublisher(PublisherEntity(name = name))
    suspend fun deleteGenre(id: Long) = meta.deleteGenre(id)
    suspend fun deleteDeveloper(id: Long) = meta.deleteDeveloper(id)
    suspend fun deletePublisher(id: Long) = meta.deletePublisher(id)
}
