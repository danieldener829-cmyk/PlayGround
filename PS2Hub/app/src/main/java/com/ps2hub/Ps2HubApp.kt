package com.ps2hub

import android.app.Application
import androidx.room.Room
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import com.ps2hub.data.local.Ps2HubDb
import com.ps2hub.data.repository.GameRepository
import com.ps2hub.data.seed.SeedGames
import com.ps2hub.util.SyncWorker
import java.util.concurrent.TimeUnit
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

class Ps2HubApp : Application() {
    lateinit var db: Ps2HubDb
        private set
    lateinit var repo: GameRepository
        private set

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onCreate() {
        super.onCreate()
        db = Room.databaseBuilder(this, Ps2HubDb::class.java, "ps2hub.db")
            .fallbackToDestructiveMigration(false)
            .build()
        repo = GameRepository(db.gameDao(), db.favoriteDao(), db.libraryDao(), db.historyDao(), db.metaDao())

        // Seed inicial (offline-first). Só insere se catálogo vazio.
        scope.launch {
            try {
                if (db.gameDao().count() == 0) {
                    db.gameDao().upsertAll(SeedGames.all())
                }
            } catch (_: Exception) { /* log local, sem crash */ }
        }

        // Sincronização periódica do catálogo quando houver internet (ver SyncWorker).
        try {
            val req = PeriodicWorkRequestBuilder<SyncWorker>(24, TimeUnit.HOURS).build()
            WorkManager.getInstance(this).enqueueUniquePeriodicWork(
                "catalog-sync", ExistingPeriodicWorkPolicy.KEEP, req
            )
        } catch (_: Exception) { }
    }
}
