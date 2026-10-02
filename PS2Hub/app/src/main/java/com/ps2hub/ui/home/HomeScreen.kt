package com.ps2hub.ui.home

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.LibraryBooks
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ps2hub.data.repository.GameRepository
import com.ps2hub.ui.components.GameCard
import com.ps2hub.ui.components.GameCover

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    repo: GameRepository,
    onGame: (Long) -> Unit,
    onCatalog: () -> Unit,
    onLibrary: () -> Unit,
    onFavorites: () -> Unit,
    onAdmin: () -> Unit
) {
    var query by remember { mutableStateOf("") }
    val recent by repo.recentAdded(10).collectAsState(initial = emptyList())
    val popular by repo.mostAccessed(10).collectAsState(initial = emptyList())
    val featured by repo.featured(5).collectAsState(initial = emptyList())
    val favs by repo.favoritesPreview(10).collectAsState(initial = emptyList())
    val genres by repo.allGenres().collectAsState(initial = emptyList())
    var selectedGenre by remember { mutableStateOf<String?>(null) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text("PS2 HUB", fontWeight = FontWeight.Black, letterSpacing = 2.sp,
                        color = MaterialTheme.colorScheme.primary)
                },
                actions = {
                    IconButton(onClick = onAdmin) {
                        Icon(Icons.Default.Settings, contentDescription = "Admin", tint = Color.Gray)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background)
            )
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { pad ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(pad),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(18.dp)
        ) {
            // Barra de pesquisa
            item {
                OutlinedTextField(
                    value = query,
                    onValueChange = { query = it },
                    placeholder = { Text("Buscar jogo, gênero, ano, dev…") },
                    leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                    singleLine = true,
                    shape = RoundedCornerShape(14.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedContainerColor = MaterialTheme.colorScheme.surface,
                        unfocusedContainerColor = MaterialTheme.colorScheme.surface
                    ),
                    modifier = Modifier.fillMaxWidth()
                )
                if (query.isNotBlank()) {
                    Spacer(Modifier.height(8.dp))
                    Button(onClick = onCatalog, modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)) {
                        Text("Pesquisar por \"$query\" no catálogo")
                    }
                }
            }

            // Atalhos
            item {
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
                    Button(onClick = onLibrary, modifier = Modifier.weight(1f)) {
                        Icon(Icons.Default.LibraryBooks, contentDescription = null)
                        Spacer(Modifier.width(6.dp)); Text("Meus Jogos")
                    }
                    Button(onClick = onFavorites, modifier = Modifier.weight(1f)) {
                        Icon(Icons.Default.Favorite, contentDescription = null)
                        Spacer(Modifier.width(6.dp)); Text("Favoritos")
                    }
                }
            }

            // Destaques
            if (featured.isNotEmpty()) {
                item {
                    SectionTitle("Destaques")
                    Spacer(Modifier.height(8.dp))
                }
                item {
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        items(featured) { g ->
                            GameCoverClickable(game = g, onGame = onGame)
                        }
                    }
                }
            }

            // Categorias
            item {
                SectionTitle("Categorias")
                Spacer(Modifier.height(8.dp))
                LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    item {
                        FilterChip(selected = selectedGenre == null, onClick = { selectedGenre = null; onCatalog() }, label = { Text("Todas") })
                    }
                    items(genres) { genre ->
                        FilterChip(selected = selectedGenre == genre,
                            onClick = { selectedGenre = genre; onCatalog() },
                            label = { Text(genre) })
                    }
                }
            }

            item { GameRow("Recentemente adicionados", recent, onGame) }
            item { GameRow("Mais acessados", popular, onGame) }
            if (favs.isNotEmpty()) item { GameRow("Favoritos", favs, onGame) }

            item {
                Button(onClick = onCatalog, modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)) {
                    Text("Ver catálogo completo")
                }
                Spacer(Modifier.height(40.dp))
            }
        }
    }
}

@Composable
private fun GameCoverClickable(game: com.ps2hub.data.local.entity.GameEntity, onGame: (Long) -> Unit) {
    GameCover(game = game, big = false,
        modifier = Modifier.width(220.dp).height(130.dp).clickable { onGame(game.id) })
}

@Composable
private fun SectionTitle(t: String) {
    Text(t, fontWeight = FontWeight.Bold, fontSize = 18.sp, color = Color.White)
}

@Composable
private fun GameRow(title: String, games: List<com.ps2hub.data.local.entity.GameEntity>, onGame: (Long) -> Unit) {
    Column {
        SectionTitle(title)
        Spacer(Modifier.height(8.dp))
        if (games.isEmpty()) {
            Text("Nada por aqui ainda.", color = Color.Gray)
        } else {
            LazyRow(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                items(games) { g ->
                    GameCard(game = g, onClick = { onGame(g.id) }, modifier = Modifier.width(140.dp))
                }
            }
        }
    }
}
