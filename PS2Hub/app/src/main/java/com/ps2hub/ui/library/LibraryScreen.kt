package com.ps2hub.ui.library

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.paging.compose.collectAsLazyPagingItems
import com.ps2hub.data.repository.GameRepository
import com.ps2hub.ui.components.GameCard

class LibraryViewModel(val repo: GameRepository) : ViewModel() {
    val paged = repo.libraryPaged()
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LibraryScreen(repo: GameRepository, onBack: () -> Unit, onGame: (Long) -> Unit) {
    val vm: LibraryViewModel = viewModel(factory = object : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T = LibraryViewModel(repo) as T
    })
    // cache paging no ViewModel original exigiria Pager no VM; aqui coletamos direto (suficiente p/ v1)
    val items = repo.libraryPaged().collectAsLazyPagingItems()
    Scaffold(
        topBar = {
            TopAppBar(title = { Text("Meus Jogos") },
                navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.Default.ArrowBack, null) } },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background))
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { pad ->
        if (items.itemCount == 0) {
            Text("Sua biblioteca está vazia. Abra um jogo e toque em “Adicionar à biblioteca”.",
                modifier = Modifier.padding(pad).padding(16.dp))
        } else {
            LazyVerticalGrid(columns = GridCells.Adaptive(140.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier.fillMaxSize().padding(pad).padding(12.dp)) {
                items(items.itemCount) { i ->
                    items[i]?.let { g -> GameCard(game = g, onClick = { onGame(g.id) }) }
                }
            }
        }
    }
}
