package com.markettracker.app.data.db

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.markettracker.app.data.StatusTag

@Entity(tableName = "conversations")
data class Conversation(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val buyerName: String,
    val itemName: String? = null,
    val statusTag: StatusTag = StatusTag.NEEDS_TAGGING,
    val notes: String = "",
    val lastActivityAt: Long,
    val createdAt: Long,
)
