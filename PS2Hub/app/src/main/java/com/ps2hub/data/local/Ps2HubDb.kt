package com.ps2hub.data.local

import androidx.room.Database
import androidx.room.RoomDatabase
import com.ps2hub.data.local.dao.CatalogMetaDao
import com.ps2hub.data.local.dao.FavoriteDao
import com.ps2hub.data.local.dao.GameDao
import com.ps2hub.data.local.dao.HistoryDao
import com.ps2hub.data.local.dao.LibraryDao
import com.ps2hub.data.local.entity.DeveloperEntity
import com.ps2hub.data.local.entity.FavoriteEntity
import com.ps2hub.data.local.entity.GameEntity
import com.ps2hub.data.local.entity.GameFileEntity
import com.ps2hub.data.local.entity.GenreEntity
import com.ps2hub.data.local.entity.PlayHistoryEntity
import com.ps2hub.data.local.entity.PublisherEntity
import com.ps2hub.data.local.entity.UserEntity
import com.ps2hub.data.local.entity.UserGameEntity

@Database(
    entities = [
        UserEntity::class,
        GameEntity::class,
        GenreEntity::class,
        DeveloperEntity::class,
        PublisherEntity::class,
        FavoriteEntity::class,
        UserGameEntity::class,
        GameFileEntity::class,
        PlayHistoryEntity::class
    ],
    version = 1,
    exportSchema = false
)
abstract class Ps2HubDb : RoomDatabase() {
    abstract fun gameDao(): GameDao
    abstract fun metaDao(): CatalogMetaDao
    abstract fun favoriteDao(): FavoriteDao
    abstract fun libraryDao(): LibraryDao
    abstract fun historyDao(): HistoryDao
}
