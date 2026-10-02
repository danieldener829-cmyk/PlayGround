package com.ps2hub.ui.detail

import android.content.Intent
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.FavoriteBorder
import androidx.compose.material.icons.filled.FolderOpen
import androidx.compose.material.icons.filled.LibraryAdd
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.ps2hub.data.local.entity.GameFileEntity
import com.ps2hub.data.repository.GameRepository
import com.ps2hub.ui.components.GameCover
import com.ps2hub.util.EmulatorLauncher
import com.ps2hub.util.FileValidator
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DetailScreen(repo: GameRepository, gameId: Long, onBack: () -> Unit) {
    val ctx = LocalContext.current
    val scope = rememberCoroutineScope()
    val game by repo.observeGame(gameId).collectAsState(initial = null)
    val isFav by repo.isFavorite(gameId).collectAsState(initial = false)
    val inLib by repo.isInLibrary(gameId).collectAsState(initial = false)
    val history by repo.historyFor(gameId).collectAsState(initial = emptyList())
    var userGameId by remember { mutableStateOf<Long?>(null) }
    var files by remember { mutableStateOf<List<GameFileEntity>>(emptyList()) }
    var msg by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(gameId) {
        repo.incrementAccess(gameId)
        userGameId = repo.userGameFor(gameId)?.id
    }
    LaunchedEffect(userGameId) {
        val id = userGameId ?: return@LaunchedEffect
        repo.filesFor(id).collect { files = it }
    }

    val picker = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri: Uri? ->
        if (uri == null) return@rememberLauncherForActivityResult
        scope.launch {
            val check = FileValidator.validate(ctx, uri)
            if (!check.ok) { msg = check.error; return@launch }
            try {
                ctx.contentResolver.takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION)
            } catch (_: Exception) { }
            var ugId = userGameId
            if (ugId == null) {
                repo.addToLibrary(gameId)
                ugId = repo.userGameFor(gameId)?.id
                userGameId = ugId
            }
            if (ugId == null) { msg = "Falha ao criar entrada na biblioteca."; return@launch }
            repo.addFile(GameFileEntity(userGameId = ugId, displayName = check.displayName,
                uri = uri.toString(), mimeType = check.mime, sizeBytes = check.size))
            repo.logAction(gameId, "file_open")
            msg = "Arquivo \"${check.displayName}\" importado com sucesso."
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(title = { Text(game?.title ?: "Jogo") },
                navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.Default.ArrowBack, null) } },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background))
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { pad ->
        val g = game
        if (g == null) {
            Text("Carregando…", modifier = Modifier.padding(pad).padding(16.dp))
            return@Scaffold
        }
        Column(Modifier.fillMaxSize().padding(pad).verticalScroll(rememberScrollState()).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)) {
            GameCover(game = g, big = true, modifier = Modifier.fillMaxWidth().height(240.dp))
            Text(g.title, fontWeight = FontWeight.Black, style = MaterialTheme.typography.headlineSmall, color = Color.White)

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                AssistChip(onClick = {}, label = { Text(g.genre.ifBlank { "—" }) })
                AssistChip(onClick = {}, label = { Text(g.year.toString()) })
                AssistChip(onClick = {}, label = { Text(g.region) })
            }
            Text(g.description, color = Color.White.copy(alpha = 0.85f))

            Info("Desenvolvedora", g.developer)
            Info("Publicadora", g.publisher)
            Info("Idiomas", g.languages)
            Info("Jogadores", g.players)
            Info("Classificação", g.rating)
            Info("Tamanho aprox.", g.sizeApprox)
            Info("Status", g.status)
            Info("Tags", g.tags)

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                Button(onClick = { scope.launch { repo.toggleFavorite(gameId, !isFav) } }, modifier = Modifier.weight(1f)) {
                    Icon(if (isFav) Icons.Default.Favorite else Icons.Default.FavoriteBorder, null)
                    Spacer(Modifier.padding(2.dp)); Text(if (isFav) "Favoritado" else "Favoritar")
                }
                OutlinedButton(onClick = { scope.launch {
                    if (inLib) repo.removeFromLibrary(gameId) else repo.addToLibrary(gameId)
                    userGameId = repo.userGameFor(gameId)?.id
                } }, modifier = Modifier.weight(1f)) {
                    Icon(Icons.Default.LibraryAdd, null); Spacer(Modifier.padding(2.dp))
                    Text(if (inLib) "Na biblioteca" else "Adicionar")
                }
            }
            Button(onClick = { picker.launch(arrayOf("*/*")) }, modifier = Modifier.fillMaxWidth()) {
                Icon(Icons.Default.FolderOpen, null); Spacer(Modifier.padding(2.dp))
                Text("Importar arquivo próprio")
            }
            Text("Use apenas arquivos que você possui legalmente. O app não baixa ROMs/ISOs.",
                color = Color.Gray, style = MaterialTheme.typography.bodySmall)

            if (files.isNotEmpty()) {
                Text("Arquivos vinculados", fontWeight = FontWeight.Bold, color = Color.White)
                files.forEach { f ->
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Column(Modifier.weight(1f)) {
                            Text(f.displayName, color = Color.White)
                            Text("${(f.sizeBytes / 1024 / 1024)} MB", color = Color.Gray)
                        }
                        OutlinedButton(onClick = {
                            scope.launch { repo.logAction(gameId, "file_open") }
                            EmulatorLauncher.openWithEmulator(ctx, Uri.parse(f.uri), f.mimeType)
                        }) {
                            Icon(Icons.Default.PlayArrow, null); Text("Abrir")
                        }
                    }
                }
            }

            if (history.isNotEmpty()) {
                Text("Histórico de uso", fontWeight = FontWeight.Bold, color = Color.White)
                history.take(10).forEach { h ->
                    Text("• ${h.action} — ${java.text.SimpleDateFormat("dd/MM/yyyy HH:mm").format(java.util.Date(h.openedAt))}",
                        color = Color.Gray)
                }
            }
            msg?.let { Text(it, color = MaterialTheme.colorScheme.primary) }
            Spacer(Modifier.height(32.dp))
        }
    }
}

@Composable
private fun Info(k: String, v: String) {
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(k, color = Color.Gray)
        Text(v.ifBlank { "—" }, color = Color.White, fontWeight = FontWeight.SemiBold)
    }
}
