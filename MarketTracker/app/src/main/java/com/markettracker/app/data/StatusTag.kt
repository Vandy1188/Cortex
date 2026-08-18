package com.markettracker.app.data

import androidx.compose.ui.graphics.Color

/**
 * Status of a buyer conversation. NEEDS_TAGGING is the default state a conversation
 * lands in when the notification listener creates it for the first time — it's
 * surfaced distinctly in the conversation list until the user picks a real status.
 */
enum class StatusTag(val displayName: String) {
    NEEDS_TAGGING("Needs Tagging"),
    HOT("Hot"),
    NEGOTIATING("Negotiating"),
    GHOSTED("Ghosted"),
    CLOSED("Closed"),
    PURCHASED("Purchased"),
}

/** Chip color per status, used by the conversation list/detail UI. */
fun StatusTag.color(): Color = when (this) {
    StatusTag.NEEDS_TAGGING -> Color(0xFF9C27B0)
    StatusTag.HOT -> Color(0xFFE53935)
    StatusTag.NEGOTIATING -> Color(0xFFFB8C00)
    StatusTag.GHOSTED -> Color(0xFF757575)
    StatusTag.CLOSED -> Color(0xFF3949AB)
    StatusTag.PURCHASED -> Color(0xFF43A047)
}
