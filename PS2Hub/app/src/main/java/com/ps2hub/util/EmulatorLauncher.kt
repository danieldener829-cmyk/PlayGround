package com.ps2hub.util

import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.Toast
import androidx.core.content.FileProvider

object EmulatorLauncher {
    /**
     * Tenta abrir o arquivo do usuário em um emulador compatível instalado.
     * NÃO baixa nem embute emulador/ROM. Apenas delega via ACTION_VIEW com permissão de leitura.
     */
    fun openWithEmulator(ctx: Context, uri: Uri, mime: String?) {
        try {
            val intent = Intent(Intent.ACTION_VIEW).apply {
                setDataAndType(uri, mime ?: "*/*")
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            val chooser = Intent.createChooser(intent, "Abrir com emulador")
            chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            ctx.startActivity(chooser)
        } catch (e: ActivityNotFoundException) {
            Toast.makeText(ctx, "Nenhum app compatível instalado para abrir este arquivo.", Toast.LENGTH_LONG).show()
        } catch (e: Exception) {
            Toast.makeText(ctx, "Falha ao abrir: ${e.message}", Toast.LENGTH_LONG).show()
        }
    }
}
