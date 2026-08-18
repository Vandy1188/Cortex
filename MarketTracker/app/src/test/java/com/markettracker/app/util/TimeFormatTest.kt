package com.markettracker.app.util

import org.junit.Assert.assertEquals
import org.junit.Test

class TimeFormatTest {

    private val now = 1_700_000_000_000L

    @Test
    fun `just now shows as now`() {
        assertEquals("now", formatRelativeTime(now - 5_000L, now))
    }

    @Test
    fun `minutes ago`() {
        assertEquals("5m", formatRelativeTime(now - 5 * 60_000L, now))
    }

    @Test
    fun `hours ago`() {
        assertEquals("3h", formatRelativeTime(now - 3 * 60 * 60_000L, now))
    }

    @Test
    fun `days ago`() {
        assertEquals("2d", formatRelativeTime(now - 2 * 24 * 60 * 60_000L, now))
    }
}
