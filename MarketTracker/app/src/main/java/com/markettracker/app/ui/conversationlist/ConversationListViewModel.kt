package com.markettracker.app.ui.conversationlist

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.markettracker.app.data.StatusTag
import com.markettracker.app.data.db.ConversationListItem
import com.markettracker.app.data.repository.ConversationRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn

/** null = the "All" tab/filter. */
typealias StatusFilter = StatusTag?

class ConversationListViewModel(
    private val repository: ConversationRepository,
) : ViewModel() {

    private val _selectedFilter = MutableStateFlow<StatusFilter>(null)
    val selectedFilter: StateFlow<StatusFilter> = _selectedFilter.asStateFlow()

    private val allConversations: StateFlow<List<ConversationListItem>> =
        repository.observeConversationList()
            .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    /**
     * Conversations needing attention (quick-tag flow) are pinned to the top as a
     * distinct group so a newly captured buyer message is impossible to miss, even
     * if it's not the most recently active conversation overall.
     */
    val uiState: StateFlow<ConversationListUiState> =
        combine(allConversations, _selectedFilter) { conversations, filter ->
            val filtered = if (filter == null) conversations else conversations.filter { it.conversation.statusTag == filter }
            val (needsTagging, rest) = filtered.partition { it.conversation.statusTag == StatusTag.NEEDS_TAGGING }
            ConversationListUiState(
                needsTagging = needsTagging,
                rest = rest,
                isEmpty = conversations.isEmpty(),
            )
        }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), ConversationListUiState())

    fun selectFilter(filter: StatusFilter) {
        _selectedFilter.value = filter
    }
}

data class ConversationListUiState(
    val needsTagging: List<ConversationListItem> = emptyList(),
    val rest: List<ConversationListItem> = emptyList(),
    val isEmpty: Boolean = false,
)
