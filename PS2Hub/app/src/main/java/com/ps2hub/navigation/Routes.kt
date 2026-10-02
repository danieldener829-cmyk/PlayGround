package com.ps2hub.navigation

object Routes {
    const val HOME = "home"
    const val CATALOG = "catalog"
    const val DETAIL = "detail/{gameId}"
    const val LIBRARY = "library"
    const val FAVORITES = "favorites"
    const val ADMIN = "admin"
    const val ADMIN_EDIT = "admin_edit?gameId={gameId}"

    fun detail(id: Long) = "detail/$id"
    fun adminEdit(id: Long?) = if (id == null) "admin_edit?gameId=-1" else "admin_edit?gameId=$id"
}
