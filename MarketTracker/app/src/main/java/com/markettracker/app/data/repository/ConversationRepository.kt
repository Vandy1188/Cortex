package com.markettracker.app.data.repository

import com.markettracker.app.data.StatusTag
import com.markettracker.app.data.db.Conversation
import com.markettracker.app.data.db.ConversationDao
import com.markettracker.app.data.db.ConversationListItem
import com.markettracker.app.data.db.Message
import com.markettracker.app.data.db.MessageDao
import kotlinx.coroutines.flow.Flow

class ConversationRepository(
    private val conversationDao: ConversationDao,
    private val messageDao: MessageDao,
) {
    fun observeConversationList(): Flow<List<ConversationListItem>> =
        conversationDao.observeConversationList()

    fun observeConversation(id: Long): Flow<Conversation?> =
        conversationDao.observeConversation(id)

    fun observeMessages(conversationId: Long): Flow<List<Message>> =
        messageDao.observeMessagesForConversation(conversationId)

    suspend fun setStatusTag(conversationId: Long, statusTag: StatusTag) =
        conversationDao.updateStatusTag(conversationId, statusTag)

    suspend fun setNotes(conversationId: Long, notes: String) =
        conversationDao.updateNotes(conversationId, notes)

    suspend fun setItemName(conversationId: Long, itemName: String?) =
        conversationDao.updateItemName(conversationId, itemName?.trim()?.takeIf { it.isNotEmpty() })

    /**
     * Called by the notification listener for every captured Messenger message.
     * Matches to an existing conversation by buyer name, or creates a new one in
     * NEEDS_TAGGING state. Returns the (possibly newly created) conversation id.
     */
    suspend fun ingestIncomingMessage(
        senderName: String,
        text: String,
        timestampMillis: Long,
    ): Long {
        val existing = conversationDao.findByBuyerName(senderName)

        val conversationId = if (existing != null) {
            conversationDao.touchLastActivity(existing.id, timestampMillis)
            existing.id
        } else {
            conversationDao.insert(
                Conversation(
                    buyerName = senderName,
                    statusTag = StatusTag.NEEDS_TAGGING,
                    lastActivityAt = timestampMillis,
                    createdAt = timestampMillis,
                )
            )
        }

        messageDao.insert(
            Message(
                conversationId = conversationId,
                text = text,
                timestamp = timestampMillis,
                isFromListener = true,
            )
        )

        return conversationId
    }
}
