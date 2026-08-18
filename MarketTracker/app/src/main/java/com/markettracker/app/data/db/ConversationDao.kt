package com.markettracker.app.data.db

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import androidx.room.Update
import com.markettracker.app.data.StatusTag
import kotlinx.coroutines.flow.Flow

@Dao
interface ConversationDao {

    @Query(
        """
        SELECT c.*,
          (SELECT m.text FROM messages m WHERE m.conversationId = c.id ORDER BY m.timestamp DESC LIMIT 1) AS lastMessageSnippet
        FROM conversations c
        ORDER BY c.lastActivityAt DESC
        """
    )
    fun observeConversationList(): Flow<List<ConversationListItem>>

    @Query("SELECT * FROM conversations WHERE id = :id")
    fun observeConversation(id: Long): Flow<Conversation?>

    @Query("SELECT * FROM conversations WHERE id = :id")
    suspend fun getConversation(id: Long): Conversation?

    /**
     * Matches an incoming notification's sender to an existing conversation.
     * Messenger only gives us a display name (no stable buyer ID), so this is a
     * case-insensitive exact match on buyerName.
     */
    @Query("SELECT * FROM conversations WHERE buyerName = :buyerName COLLATE NOCASE LIMIT 1")
    suspend fun findByBuyerName(buyerName: String): Conversation?

    @Insert
    suspend fun insert(conversation: Conversation): Long

    @Update
    suspend fun update(conversation: Conversation)

    @Query("UPDATE conversations SET lastActivityAt = :timestamp WHERE id = :id")
    suspend fun touchLastActivity(id: Long, timestamp: Long)

    @Query("UPDATE conversations SET statusTag = :statusTag WHERE id = :id")
    suspend fun updateStatusTag(id: Long, statusTag: StatusTag)

    @Query("UPDATE conversations SET notes = :notes WHERE id = :id")
    suspend fun updateNotes(id: Long, notes: String)

    @Query("UPDATE conversations SET itemName = :itemName WHERE id = :id")
    suspend fun updateItemName(id: Long, itemName: String?)
}
