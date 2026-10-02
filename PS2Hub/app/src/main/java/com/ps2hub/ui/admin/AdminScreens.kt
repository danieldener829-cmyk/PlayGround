package com.ps2hub.ui.admin

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.paging.compose.collectAsLazyPagingItems
import com.ps2hub.data.local.entity.GameEntity
import com.ps2hub.data.repository.GameRepository
import com.ps2hub.data.repository.SearchFilters
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.launch
import kotlinx.coroutines.ExperimentalCoroutinesApi

class AdminViewModel(val repo: GameRepository) : ViewModel() {
    private val q = MutableStateFlow("")
    @OptIn(ExperimentalCoroutinesApi::class)
    val paged = q.flatMapLatest { repo.searchPaged(SearchFilters(query = it, sort = "title")) }
    fun setQuery(v: String) { q.value = v }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminScreen(repo: GameRepository, onBack: () -> Unit, onEdit: (Long) -> Unit, onNew: () -> Unit) {
    val scope = rememberCoroutineScope()
    val vm: AdminViewModel = viewModel(factory = object : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T = AdminViewModel(repo) as T
    })
    val items = vm.paged.collectAsLazyPagingItems()
    var query by remember { mutableStateOf("") }
    var genreName by remember { mutableStateOf("") }
    val genres by repo.genres().collectAsState(initial = emptyList())

    Scaffold(
        topBar = {
            TopAppBar(title = { Text("Admin — Catálogo") },
                navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.Default.ArrowBack, null) } },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background))
        },
        floatingActionButton = { FloatingActionButton(onClick = onNew) { Icon(Icons.Default.Add, null) } },
        containerColor = MaterialTheme.colorScheme.background
    ) { pad ->
        LazyColumn(Modifier.fillMaxSize().padding(pad).padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            item {
                Text("Área separada do usuário comum. Gerencie jogos, gêneros e tags.",
                    color = Color.Gray)
                Spacer(Modifier.height(8.dp))
                OutlinedTextField(value = query, onValueChange = { query = it; vm.setQuery(it) },
                    placeholder = { Text("Buscar para editar…") }, modifier = Modifier.fillMaxWidth(), singleLine = true)
                Spacer(Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                    OutlinedTextField(value = genreName, onValueChange = { genreName = it },
                        placeholder = { Text("Novo gênero") }, modifier = Modifier.weight(1f), singleLine = true)
                    Button(onClick = { scope.launch { repo.addGenre(genreName); genreName = "" } }, enabled = genreName.isNotBlank()) {
                        Text("Criar")
                    }
                }
                genres.forEach { g ->
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("• ${g.name}", color = Color.White)
                        IconButton(onClick = { scope.launch { repo.deleteGenre(g.id) } }) {
                            Icon(Icons.Default.Delete, null, tint = Color.Red)
                        }
                    }
                }
                Spacer(Modifier.height(8.dp))
                Text("Jogos", fontWeight = FontWeight.Bold, color = Color.White)
            }
            items(items.itemCount) { i ->
                val g = items[i] ?: return@items
                Card(Modifier.fillMaxWidth()) {
                    Row(Modifier.fillMaxWidth().padding(12.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                        Column(Modifier.weight(1f)) {
                            Text(g.title, fontWeight = FontWeight.Bold)
                            Text("${g.genre} • ${g.year} • ${g.region}", color = Color.Gray)
                        }
                        IconButton(onClick = { onEdit(g.id) }) { Icon(Icons.Default.Edit, null) }
                        IconButton(onClick = { scope.launch { repo.delete(g.id); items.refresh() } }) {
                            Icon(Icons.Default.Delete, null, tint = Color.Red)
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminEditScreen(repo: GameRepository, gameId: Long?, onBack: () -> Unit) {
    val scope = rememberCoroutineScope()
    var loaded by remember { mutableStateOf<GameEntity?>(null) }
    var title by remember { mutableStateOf("") }
    var desc by remember { mutableStateOf("") }
    var genre by remember { mutableStateOf("") }
    var dev by remember { mutableStateOf("") }
    var pub by remember { mutableStateOf("") }
    var year by remember { mutableStateOf("2005") }
    var region by remember { mutableStateOf("NTSC-U") }
    var langs by remember { mutableStateOf("EN") }
    var players by remember { mutableStateOf("1") }
    var rating by remember { mutableStateOf("L") }
    var size by remember { mutableStateOf("") }
    var status by remember { mutableStateOf("Completo") }
    var tags by remember { mutableStateOf("") }
    var cover by remember { mutableStateOf("") }
    var featured by remember { mutableStateOf(false) }
    var msg by remember { mutableStateOf<String?>(null) }

    androidx.compose.runtime.LaunchedEffect(gameId) {
        if (gameId != null) {
            val g = repo.getGame(gameId)
            loaded = g
            g?.let {
                title = it.title; desc = it.description; genre = it.genre; dev = it.developer
                pub = it.publisher; year = it.year.toString(); region = it.region
                langs = it.languages; players = it.players; rating = it.rating
                size = it.sizeApprox; status = it.status; tags = it.tags
                cover = it.coverUrl ?: ""; featured = it.featured
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(title = { Text(if (gameId == null) "Novo jogo" else "Editar jogo") },
                navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.Default.ArrowBack, null) } },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background))
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { pad ->
        androidx.compose.foundation.layout.Column(
            Modifier.fillMaxSize().padding(pad).padding(16.dp)
                .verticalScroll(androidx.compose.foundation.rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Field("Nome*", title) { title = it }
            Field("Descrição", desc) { desc = it }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                androidx.compose.foundation.layout.Box(Modifier.weight(1f)) { Field("Gênero", genre) { genre = it } }
                androidx.compose.foundation.layout.Box(Modifier.weight(1f)) { Field("Ano", year) { year = it } }
            }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                androidx.compose.foundation.layout.Box(Modifier.weight(1f)) { Field("Desenvolvedora", dev) { dev = it } }
                androidx.compose.foundation.layout.Box(Modifier.weight(1f)) { Field("Publicadora", pub) { pub = it } }
            }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                androidx.compose.foundation.layout.Box(Modifier.weight(1f)) { Field("Região", region) { region = it } }
                androidx.compose.foundation.layout.Box(Modifier.weight(1f)) { Field("Idiomas (CSV)", langs) { langs = it } }
            }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                androidx.compose.foundation.layout.Box(Modifier.weight(1f)) { Field("Jogadores", players) { players = it } }
                androidx.compose.foundation.layout.Box(Modifier.weight(1f)) { Field("Classificação", rating) { rating = it } }
            }
            Field("Tamanho aprox.", size) { size = it }
            Field("Status", status) { status = it }
            Field("Tags (CSV)", tags) { tags = it }
            Field("URL da capa (opcional)", cover) { cover = it }
            Row { androidx.compose.material3.Checkbox(checked = featured, onCheckedChange = { featured = it }); Text("Destaque", color = Color.White) }

            Button(onClick = {
                scope.launch {
                    if (title.isBlank()) { msg = "Nome é obrigatório."; return@launch }
                    val y = year.toIntOrNull() ?: 2000
                    val entity = GameEntity(
                        id = gameId ?: 0,
                        title = title.trim(), description = desc, genre = genre, developer = dev,
                        publisher = pub, year = y, region = region, languages = langs,
                        players = players, rating = rating, sizeApprox = size, status = status,
                        tags = tags, coverUrl = cover.ifBlank { null }, featured = featured,
                        accessCount = loaded?.accessCount ?: 0,
                        createdAt = loaded?.createdAt ?: System.currentTimeMillis(),
                        updatedAt = System.currentTimeMillis()
                    )
                    repo.upsert(entity)
                    msg = "Salvo com sucesso."
                    onBack()
                }
            }, modifier = Modifier.fillMaxWidth()) { Text("Salvar") }
            msg?.let { Text(it, color = MaterialTheme.colorScheme.primary) }
            Spacer(Modifier.height(32.dp))
        }
    }
}

@Composable
private fun Field(label: String, value: String, onChange: (String) -> Unit) {
    OutlinedTextField(value = value, onValueChange = onChange, label = { Text(label) },
        modifier = Modifier.fillMaxWidth(), singleLine = label != "Descrição")
}
