package com.markettracker.app.data.db

import androidx.room.TypeConverter
import com.markettracker.app.data.StatusTag

class Converters {
    @TypeConverter
    fun fromStatusTag(value: StatusTag): String = value.name

    @TypeConverter
    fun toStatusTag(value: String): StatusTag =
        runCatching { StatusTag.valueOf(value) }.getOrDefault(StatusTag.NEEDS_TAGGING)
}
