package com.ps2hub.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.ps2hub.data.local.entity.GameEntity
import kotlin.math.abs

private val palettes = listOf(
    listOf(Color(0xFF0F2027), Color(0xFF203A43), Color(0xFF2C5364)),
    listOf(Color(0xFF41295A), Color(0xFF2F0743)),
    listOf(Color(0xFF134E5E), Color(0xFF71B280)),
    listOf(Color(0xFF232526), Color(0xFF414345)),
    listOf(Color(0xFF000428), Color(0xFF004E92)),
    listOf(Color(0xFF42275B), Color(0xFF734B6D))
)

fun paletteFor(title: String): List<Color> = palettes[abs(title.hashCode()) % palettes.size]

@Composable
fun GameCover(game: GameEntity, modifier: Modifier = Modifier, big: Boolean = false) {
    val shape = RoundedCornerShape(12.dp)
    Box(
        modifier = modifier
            .clip(shape)
            .background(Brush.linearGradient(paletteFor(game.title)))
    ) {
        if (game.coverUrl != null) {
            AsyncImage(
                model = game.coverUrl,
                contentDescription = game.title,
                contentScale = ContentScale.Crop,
                modifier = Modifier.matchParentSize()
            )
        }
        // Overlay com iniciais — capa procedural de alta qualidade, sem copyright.
        Box(
            modifier = Modifier
                .matchParentSize()
                .background(Brush.verticalGradient(listOf(Color.Transparent, Color(0xAA000000))))
        )
        Text(
            text = game.title.take(2).uppercase(),
            color = Color.White.copy(alpha = 0.9f),
            fontWeight = FontWeight.Black,
            fontSize = if (big) 64.sp else 28.sp,
            modifier = Modifier.align(Alignment.Center)
        )
        Column(
            modifier = Modifier
                .align(Alignment.BottomStart)
                .padding(8.dp)
        ) {
            Text(
                text = game.title,
                color = Color.White,
                fontWeight = FontWeight.Bold,
                fontSize = if (big) 18.sp else 11.sp,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis
            )
            Text(
                text = "${game.year} • ${game.genre}",
                color = Color.White.copy(alpha = 0.75f),
                fontSize = if (big) 13.sp else 10.sp,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}

@Composable
fun GameCard(game: GameEntity, onClick: () -> Unit, modifier: Modifier = Modifier) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(12.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        GameCover(game = game, modifier = Modifier.fillMaxWidth().aspectRatio(3f / 4f))
    }
}
