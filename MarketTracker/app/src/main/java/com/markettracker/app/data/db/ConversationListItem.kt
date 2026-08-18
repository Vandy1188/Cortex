package com.markettracker.app.data.db

import androidx.room.Embedded

/** A conversation plus the text of its most recent message, for the list screen. */
data class ConversationListItem(
    @Embedded val conversation: Conversation,
    val lastMessageSnippet: String?,
)
