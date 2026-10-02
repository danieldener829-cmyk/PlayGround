package com.ps2hub.ui.catalog

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
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
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewModelScope
import androidx.paging.cachedIn
import androidx.paging.compose.collectAsLazyPagingItems
import com.ps2hub.data.repository.GameRepository
import com.ps2hub.data.repository.SearchFilters
import com.ps2hub.ui.components.GameCard
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.FlowPreview
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.debounce
import kotlinx.coroutines.flow.flatMapLatest

class CatalogViewModel(private val repo: GameRepository) : ViewModel() {
    private val _filters = MutableStateFlow(SearchFilters())
    val filters: StateFlow<SearchFilters> = _filters

    @OptIn(FlowPreview::class, ExperimentalCoroutinesApi::class)
    val paged = _filters.debounce(300).flatMapLatest { repo.searchPaged(it) }.cachedIn(viewModelScope)

    val genres = repo.allGenres()

    fun setQuery(q: String) {
        val yearGuess = q.trim().toIntOrNull()?.takeIf { it in 1999..2010 }
        _filters.value = _filters.value.copy(query = q, year = yearGuess ?: _filters.value.year)
    }
    fun setGenre(g: String?) { _filters.value = _filters.value.copy(genre = g) }
    fun setYear(y: Int?) { _filters.value = _filters.value.copy(year = y) }
    fun setDev(d: String?) { _filters.value = _filters.value.copy(developer = d?.ifBlank { null }) }
    fun setRegion(r: String?) { _filters.value = _filters.value.copy(region = r) }
    fun setSort(s: String) { _filters.value = _filters.value.copy(sort = s) }
    fun clearYear() { _filters.value = _filters.value.copy(year = null) }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CatalogScreen(repo: GameRepository, onBack: () -> Unit, onGame: (Long) -> Unit) {
    val vm: CatalogViewModel = viewModel(factory = object : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T = CatalogViewModel(repo) as T
    })
    val filters by vm.filters.collectAsState()
    val items = vm.paged.collectAsLazyPagingItems()
    val genres by vm.genres.collectAsState(initial = emptyList())
    var sortExpanded by remember { mutableStateOf(false) }
    var regionExpanded by remember { mutableStateOf(false) }

    val sorts = mapOf("relevance" to "Relevância", "title" to "A–Z", "yearAsc" to "Ano ↑", "yearDesc" to "Ano ↓", "mostAccessed" to "Mais acessados")
    val regions = listOf("", "NTSC-U", "NTSC-J", "PAL")

    Scaffold(
        topBar = {
            TopAppBar(title = { Text("Catálogo") },
                navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.Default.ArrowBack, null) } },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background))
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { pad ->
        Column(Modifier.fillMaxSize().padding(pad).padding(12.dp)) {
            OutlinedTextField(value = filters.query, onValueChange = vm::setQuery,
                placeholder = { Text("ação, 2005, Rockstar…") }, singleLine = true,
                modifier = Modifier.fillMaxWidth())

            Spacer(Modifier.height(8.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                // Gênero
                var gExp by remember { mutableStateOf(false) }
                ExposedDropdownMenuBox(expanded = gExp, onExpandedChange = { gExp = !gExp }, modifier = Modifier.weight(1f)) {
                    OutlinedTextField(value = filters.genre ?: "Gênero", onValueChange = {},
                        readOnly = true, trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(gExp) },
                        modifier = Modifier.menuAnchor().fillMaxWidth())
                    ExposedDropdownMenu(expanded = gExp, onDismissRequest = { gExp = false }) {
                        DropdownMenuItem(text = { Text("Todos") }, onClick = { vm.setGenre(null); gExp = false })
                        genres.forEach { g ->
                            DropdownMenuItem(text = { Text(g) }, onClick = { vm.setGenre(g); gExp = false })
                        }
                    }
                }
                // Ordenação
                ExposedDropdownMenuBox(expanded = sortExpanded, onExpandedChange = { sortExpanded = !sortExpanded }, modifier = Modifier.weight(1f)) {
                    OutlinedTextField(value = sorts[filters.sort] ?: filters.sort, onValueChange = {},
                        readOnly = true, trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(sortExpanded) },
                        modifier = Modifier.menuAnchor().fillMaxWidth())
                    ExposedDropdownMenu(expanded = sortExpanded, onDismissRequest = { sortExpanded = false }) {
                        sorts.forEach { (k, v) ->
                            DropdownMenuItem(text = { Text(v) }, onClick = { vm.setSort(k); sortExpanded = false })
                        }
                    }
                }
            }
            Spacer(Modifier.height(8.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                OutlinedTextField(value = filters.developer ?: "", onValueChange = { vm.setDev(it) },
                    placeholder = { Text("Desenvolvedora") }, singleLine = true, modifier = Modifier.weight(1f))
                ExposedDropdownMenuBox(expanded = regionExpanded, onExpandedChange = { regionExpanded = !regionExpanded }, modifier = Modifier.weight(1f)) {
                    OutlinedTextField(value = filters.region ?: "Região", onValueChange = {},
                        readOnly = true, trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(regionExpanded) },
                        modifier = Modifier.menuAnchor().fillMaxWidth())
                    ExposedDropdownMenu(expanded = regionExpanded, onDismissRequest = { regionExpanded = false }) {
                        regions.forEach { r ->
                            DropdownMenuItem(text = { Text(r.ifBlank { "Todas" }) }, onClick = { vm.setRegion(r.ifBlank { null }); regionExpanded = false })
                        }
                    }
                }
            }

            Spacer(Modifier.height(8.dp))
            LazyVerticalGrid(columns = GridCells.Adaptive(140.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier.fillMaxSize()) {
                items(items.itemCount) { i ->
                    items[i]?.let { g -> GameCard(game = g, onClick = { onGame(g.id) }) }
                }
            }
        }
    }
}
