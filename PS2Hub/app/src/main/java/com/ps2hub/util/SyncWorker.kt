package com.ps2hub.util

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters

/**
 * Sincronização do catálogo (offline-first).
 * Estrutura pronta: quando houver backend, buscar JSON paginado e fazer upsert local.
 * Por padrão, apenas verifica conectividade e mantém o cache — sem baixar conteúdo protegido.
 */
class SyncWorker(ctx: Context, params: WorkerParameters) : CoroutineWorker(ctx, params) {
    override suspend fun doWork(): Result {
        // TODO: picks: GET https://sua-api/catalog?page=N -> upsert via GameDao.
        // Exemplo:
        // val api = RetrofitInstance.catalogApi
        // var page = 0
        // while (true) { val items = api.page(page); if (items.isEmpty()) break; dao.upsertAll(items.toEntity()); page++ }
        return Result.success()
    }
}
