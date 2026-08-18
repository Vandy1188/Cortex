package com.markettracker.app.ui.conversationdetail

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.markettracker.app.data.StatusTag
import com.markettracker.app.data.db.Conversation
import com.markettracker.app.data.db.Message
import com.markettracker.app.data.db.Template
import com.markettracker.app.data.repository.ConversationRepository
import com.markettracker.app.data.repository.TemplateRepository
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

data class ConversationDetailUiState(
    val conversation: Conversation? = null,
    val messages: List<Message> = emptyList(),
    val templates: List<Template> = emptyList(),
    val isLoading: Boolean = true,
)

class ConversationDetailViewModel(
    private val conversationId: Long,
    private val repository: ConversationRepository,
    templateRepository: TemplateRepository,
) : ViewModel() {

    val uiState: StateFlow<ConversationDetailUiState> =
        combine(
            repository.observeConversation(conversationId),
            repository.observeMessages(conversationId),
            templateRepository.observeAllTemplates(),
        ) { conversation, messages, templates ->
            ConversationDetailUiState(
                conversation = conversation,
                messages = messages,
                templates = templates,
                isLoading = false,
            )
        }.stateIn(
            viewModelScope,
            SharingStarted.WhileSubscribed(5_000),
            ConversationDetailUiState(),
        )

    fun setStatusTag(statusTag: StatusTag) {
        viewModelScope.launch { repository.setStatusTag(conversationId, statusTag) }
    }

    fun setNotes(notes: String) {
        viewModelScope.launch { repository.setNotes(conversationId, notes) }
    }

    fun setItemName(itemName: String) {
        viewModelScope.launch { repository.setItemName(conversationId, itemName) }
    }
}
