package com.ps2hub.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val Blue = Color(0xFF2D9CDB)
private val NeonBlue = Color(0xFF00D4FF)
private val Bg = Color(0xFF0A0E1A)
private val Surface = Color(0xFF141B2E)
private val Surface2 = Color(0xFF1C2540)

private val Scheme = darkColorScheme(
    primary = NeonBlue,
    secondary = Blue,
    background = Bg,
    surface = Surface,
    surfaceVariant = Surface2,
    onBackground = Color.White,
    onSurface = Color.White
)

@Composable
fun PS2HUBTheme(content: @Composable () -> Unit) {
    MaterialTheme(colorScheme = Scheme, content = content)
}
