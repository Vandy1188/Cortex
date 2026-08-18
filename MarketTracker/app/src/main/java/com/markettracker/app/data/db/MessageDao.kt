package com.markettracker.app.data.db

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface MessageDao {

    @Query("SELECT * FROM messages WHERE conversationId = :conversationId ORDER BY timestamp ASC")
    fun observeMessagesForConversation(conversationId: Long): Flow<List<Message>>

    @Insert
    suspend fun insert(message: Message): Long
}
