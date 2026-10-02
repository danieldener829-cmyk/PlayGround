package com.ps2hub.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.ps2hub.data.repository.GameRepository
import com.ps2hub.ui.admin.AdminEditScreen
import com.ps2hub.ui.admin.AdminScreen
import com.ps2hub.ui.catalog.CatalogScreen
import com.ps2hub.ui.detail.DetailScreen
import com.ps2hub.ui.favorites.FavoritesScreen
import com.ps2hub.ui.home.HomeScreen
import com.ps2hub.ui.library.LibraryScreen

@Composable
fun Ps2HubNav(repo: GameRepository) {
    val nav = rememberNavController()
    NavHost(navController = nav, startDestination = Routes.HOME) {
        composable(Routes.HOME) {
            HomeScreen(repo = repo,
                onGame = { nav.navigate(Routes.detail(it)) },
                onCatalog = { nav.navigate(Routes.CATALOG) },
                onLibrary = { nav.navigate(Routes.LIBRARY) },
                onFavorites = { nav.navigate(Routes.FAVORITES) },
                onAdmin = { nav.navigate(Routes.ADMIN) })
        }
        composable(Routes.CATALOG) {
            CatalogScreen(repo = repo, onBack = { nav.popBackStack() }, onGame = { nav.navigate(Routes.detail(it)) })
        }
        composable(Routes.DETAIL, arguments = listOf(navArgument("gameId") { type = NavType.LongType })) { backStack ->
            val id = backStack.arguments?.getLong("gameId") ?: 0L
            DetailScreen(repo = repo, gameId = id, onBack = { nav.popBackStack() })
        }
        composable(Routes.LIBRARY) {
            LibraryScreen(repo = repo, onBack = { nav.popBackStack() }, onGame = { nav.navigate(Routes.detail(it)) })
        }
        composable(Routes.FAVORITES) {
            FavoritesScreen(repo = repo, onBack = { nav.popBackStack() }, onGame = { nav.navigate(Routes.detail(it)) })
        }
        composable(Routes.ADMIN) {
            AdminScreen(repo = repo, onBack = { nav.popBackStack() },
                onEdit = { id -> nav.navigate(Routes.adminEdit(id)) },
                onNew = { nav.navigate(Routes.adminEdit(null)) })
        }
        composable(
            Routes.ADMIN_EDIT,
            arguments = listOf(navArgument("gameId") { type = NavType.LongType; defaultValue = -1L })
        ) { backStack ->
            val raw = backStack.arguments?.getLong("gameId") ?: -1L
            val id = if (raw == -1L) null else raw
            AdminEditScreen(repo = repo, gameId = id, onBack = { nav.popBackStack() })
        }
    }
}
