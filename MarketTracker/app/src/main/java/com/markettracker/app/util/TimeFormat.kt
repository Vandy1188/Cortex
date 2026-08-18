package com.markettracker.app.util

import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/** Relative time string like "5m", "3h", "2d" for list rows; falls back to a date for old items. */
fun formatRelativeTime(timestampMillis: Long, nowMillis: Long = System.currentTimeMillis()): String {
    val diff = nowMillis - timestampMillis
    if (diff < 0) return "now"

    val minute = 60_000L
    val hour = 60 * minute
    val day = 24 * hour

    return when {
        diff < minute -> "now"
        diff < hour -> "${diff / minute}m"
        diff < day -> "${diff / hour}h"
        diff < 7 * day -> "${diff / day}d"
        else -> SimpleDateFormat("MMM d", Locale.getDefault()).format(Date(timestampMillis))
    }
}
