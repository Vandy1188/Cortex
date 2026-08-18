package com.markettracker.app.ui.conversationlist

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.NotificationsActive
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.ScrollableTabRow
import androidx.compose.material3.Surface
import androidx.compose.material3.Tab
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.markettracker.app.data.StatusTag
import com.markettracker.app.data.color
import com.markettracker.app.data.db.ConversationListItem
import com.markettracker.app.util.formatRelativeTime

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ConversationListScreen(
    viewModel: ConversationListViewModel,
    notificationAccessGranted: Boolean,
    onOpenConversation: (Long) -> Unit,
    onOpenTemplates: () -> Unit,
    onRequestNotificationAccess: () -> Unit,
) {
    val uiState by viewModel.uiState.collectAsState()
    val selectedFilter by viewModel.selectedFilter.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("MarketTracker") },
                actions = {
                    IconButton(onClick = onOpenTemplates) {
                        Icon(Icons.Filled.Description, contentDescription = "Templates")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    titleContentColor = MaterialTheme.colorScheme.onPrimary,
                    actionIconContentColor = MaterialTheme.colorScheme.onPrimary,
                ),
            )
        },
    ) { padding ->
        Column(modifier = Modifier.padding(padding)) {
            if (!notificationAccessGranted) {
                NotificationAccessBanner(onClick = onRequestNotificationAccess)
            }

            StatusFilterTabs(selected = selectedFilter, onSelect = viewModel::selectFilter)

            if (uiState.isEmpty) {
                EmptyState()
            } else {
                LazyColumn(modifier = Modifier.fillMaxSize()) {
                    if (uiState.needsTagging.isNotEmpty()) {
                        item {
                            SectionHeader("Needs Tagging (${uiState.needsTagging.size})")
                        }
                        items(uiState.needsTagging, key = { it.conversation.id }) { item ->
                            ConversationRow(item = item, highlighted = true, onClick = { onOpenConversation(item.conversation.id) })
                            HorizontalDivider()
                        }
                    }
                    if (uiState.rest.isNotEmpty()) {
                        items(uiState.rest, key = { it.conversation.id }) { item ->
                            ConversationRow(item = item, highlighted = false, onClick = { onOpenConversation(item.conversation.id) })
                            HorizontalDivider()
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun NotificationAccessBanner(onClick: () -> Unit) {
    Surface(color = MaterialTheme.colorScheme.errorContainer) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clickable(onClick = onClick)
                .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(
                Icons.Filled.NotificationsActive,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onErrorContainer,
            )
            Spacer(Modifier.size(12.dp))
            Column(Modifier.weight(1f)) {
                Text(
                    "Notification access needed",
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onErrorContainer,
                )
                Text(
                    "Tap to enable so MarketTracker can capture Messenger conversations.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onErrorContainer,
                )
            }
        }
    }
}

@Composable
private fun SectionHeader(text: String) {
    Text(
        text = text,
        style = MaterialTheme.typography.labelLarge,
        fontWeight = FontWeight.Bold,
        color = MaterialTheme.colorScheme.tertiary,
        modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
    )
}

@Composable
private fun StatusFilterTabs(selected: StatusTag?, onSelect: (StatusTag?) -> Unit) {
    val tabs: List<StatusTag?> = listOf(null) + StatusTag.entries
    val selectedIndex = tabs.indexOf(selected).coerceAtLeast(0)

    ScrollableTabRow(selectedTabIndex = selectedIndex, edgePadding = 8.dp) {
        tabs.forEach { tag ->
            Tab(
                selected = tag == selected,
                onClick = { onSelect(tag) },
                text = { Text(tag?.displayName ?: "All") },
            )
        }
    }
}

@Composable
private fun ConversationRow(item: ConversationListItem, highlighted: Boolean, onClick: () -> Unit) {
    val conversation = item.conversation

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(if (highlighted) MaterialTheme.colorScheme.tertiaryContainer.copy(alpha = 0.35f) else Color.Transparent)
            .clickable(onClick = onClick)
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = conversation.buyerName,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.weight(1f, fill = false),
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Spacer(Modifier.size(8.dp))
                StatusChip(conversation.statusTag)
            }
            if (!conversation.itemName.isNullOrBlank()) {
                Text(
                    text = conversation.itemName,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.secondary,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
            }
            Spacer(Modifier.height(2.dp))
            Text(
                text = item.lastMessageSnippet ?: "No messages yet",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
        }
        Spacer(Modifier.size(12.dp))
        Text(
            text = formatRelativeTime(conversation.lastActivityAt),
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}

@Composable
fun StatusChip(status: StatusTag) {
    Surface(
        color = status.color(),
        shape = MaterialTheme.shapes.small,
    ) {
        Text(
            text = status.displayName,
            color = Color.White,
            style = MaterialTheme.typography.labelSmall,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
        )
    }
}

@Composable
private fun EmptyState() {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .padding(32.dp),
        contentAlignment = Alignment.Center,
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                "No conversations yet",
                style = MaterialTheme.typography.titleMedium,
            )
            Spacer(Modifier.height(8.dp))
            Text(
                "Buyer messages captured from Messenger will show up here.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}
