package com.ps2hub.util

import android.content.Context
import android.net.Uri
import android.provider.OpenableColumns

object FileValidator {
    /** Extensões aceitas para arquivos próprios de PS2 (o usuário deve possuir legalmente). */
    val allowedExtensions = setOf("iso", "bin", "img", "cso", "chd", "isz", "mdf", "nrg", "dump")
    const val MAX_SIZE_BYTES = 8L * 1024 * 1024 * 1024 // 8 GB

    data class Result(
        val ok: Boolean,
        val displayName: String,
        val size: Long,
        val mime: String?,
        val error: String? = null
    )

    fun validate(ctx: Context, uri: Uri): Result {
        var name = "arquivo"
        var size = 0L
        var mime: String? = null
        try {
            mime = ctx.contentResolver.getType(uri)
            ctx.contentResolver.query(uri, null, null, null, null)?.use { c ->
                val ni = c.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                val si = c.getColumnIndex(OpenableColumns.SIZE)
                if (c.moveToFirst()) {
                    if (ni >= 0) name = c.getString(ni) ?: name
                    if (si >= 0) size = c.getLong(si)
                }
            }
        } catch (e: Exception) {
            return Result(false, name, 0, null, "Não foi possível ler o arquivo: ${e.message}")
        }
        val ext = name.substringAfterLast('.', "").lowercase()
        if (ext !in allowedExtensions) {
            return Result(false, name, size, mime, "Extensão .$ext não suportada. Use: ${allowedExtensions.joinToString(", ")}")
        }
        if (size > MAX_SIZE_BYTES) {
            return Result(false, name, size, mime, "Arquivo muito grande (>8 GB).")
        }
        // Validação de assinatura leve: tenta ler os primeiros bytes sem carregar tudo.
        try {
            ctx.contentResolver.openInputStream(uri)?.use { it.read(ByteArray(16)) }
        } catch (e: Exception) {
            return Result(false, name, size, mime, "Arquivo ilegível: ${e.message}")
        }
        return Result(true, name, size, mime)
    }
}
