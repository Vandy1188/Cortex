package com.markettracker.app.ui.conversationdetail

import android.content.ClipData
import android.content.Context
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
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.Description
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.markettracker.app.data.StatusTag
import com.markettracker.app.data.db.Message
import com.markettracker.app.data.db.Template
import com.markettracker.app.util.formatRelativeTime
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ConversationDetailScreen(
    viewModel: ConversationDetailViewModel,
    onBack: () -> Unit,
) {
    val uiState by viewModel.uiState.collectAsState()
    var showTemplates by rememberSaveable { mutableStateOf(false) }
    val snackbarHostState = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()
    val context = LocalContext.current

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(uiState.conversation?.buyerName ?: "Conversation") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    IconButton(onClick = { showTemplates = true }) {
                        Icon(Icons.Filled.Description, contentDescription = "Templates")
                    }
                },
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) },
    ) { padding ->
        val conversation = uiState.conversation
        if (conversation == null) {
            Box(modifier = Modifier.padding(padding).fillMaxSize()) { }
            return@Scaffold
        }

        Column(modifier = Modifier.padding(padding).fillMaxSize()) {
            EditableFields(
                statusTag = conversation.statusTag,
                itemName = conversation.itemName ?: "",
                notes = conversation.notes,
                onStatusChange = viewModel::setStatusTag,
                onItemNameChange = viewModel::setItemName,
                onNotesChange = viewModel::setNotes,
            )

            MessageList(
                messages = uiState.messages,
                modifier = Modifier.weight(1f),
            )
        }

        if (showTemplates) {
            TemplatesBottomSheet(
                templates = uiState.templates,
                onDismiss = { showTemplates = false },
                onTemplateSelected = { template ->
                    copyToClipboard(context, template.body)
                    showTemplates = false
                    scope.launch { snackbarHostState.showSnackbar("Copied \"${template.label}\" to clipboard") }
                },
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun EditableFields(
    statusTag: StatusTag,
    itemName: String,
    notes: String,
    onStatusChange: (StatusTag) -> Unit,
    onItemNameChange: (String) -> Unit,
    onNotesChange: (String) -> Unit,
) {
    var itemNameField by rememberSaveable(itemName) { mutableStateOf(itemName) }
    var notesField by rememberSaveable(notes) { mutableStateOf(notes) }
    var statusExpanded by remember { mutableStateOf(false) }

    Column(modifier = Modifier.fillMaxWidth().padding(16.dp)) {
        Box {
            OutlinedTextField(
                value = statusTag.displayName,
                onValueChange = {},
                readOnly = true,
                label = { Text("Status") },
                trailingIcon = {
                    Icon(Icons.Filled.ArrowDropDown, contentDescription = null)
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { statusExpanded = true },
            )
            // A transparent clickable overlay is needed because OutlinedTextField
            // consumes clicks itself even when readOnly; this makes the whole field
            // open the dropdown regardless of where it's tapped.
            Box(
                modifier = Modifier
                    .matchParentSize()
                    .clickable { statusExpanded = true },
            )
            DropdownMenu(
                expanded = statusExpanded,
                onDismissRequest = { statusExpanded = false },
            ) {
                StatusTag.entries.forEach { tag ->
                    DropdownMenuItem(
                        text = { Text(tag.displayName) },
                        onClick = {
                            onStatusChange(tag)
                            statusExpanded = false
                        },
                    )
                }
            }
        }

        Spacer(Modifier.height(8.dp))

        OutlinedTextField(
            value = itemNameField,
            onValueChange = {
                itemNameField = it
                onItemNameChange(it)
            },
            label = { Text("Item") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
        )

        Spacer(Modifier.height(8.dp))

        OutlinedTextField(
            value = notesField,
            onValueChange = {
                notesField = it
                onNotesChange(it)
            },
            label = { Text("Notes") },
            minLines = 2,
            maxLines = 5,
            modifier = Modifier.fillMaxWidth(),
        )
    }
}

@Composable
private fun MessageList(messages: List<Message>, modifier: Modifier = Modifier) {
    val listState = rememberLazyListState()

    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty()) listState.animateScrollToItem(messages.size - 1)
    }

    if (messages.isEmpty()) {
        Box(modifier = modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text(
                "No messages captured yet",
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
        return
    }

    LazyColumn(
        state = listState,
        modifier = modifier.fillMaxWidth(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        items(messages, key = { it.id }) { message ->
            MessageBubble(message)
        }
    }
}

@Composable
private fun MessageBubble(message: Message) {
    // Everything captured by the listener is an incoming buyer message, so bubbles
    // are left-aligned like a normal chat "them" bubble. isFromListener is kept on
    // the entity so a future manual/outgoing entry could render on the right.
    val isIncoming = message.isFromListener
    val alignment = if (isIncoming) Alignment.CenterStart else Alignment.CenterEnd
    val bubbleColor = if (isIncoming) MaterialTheme.colorScheme.surfaceVariant else MaterialTheme.colorScheme.primaryContainer

    Box(modifier = Modifier.fillMaxWidth(), contentAlignment = alignment) {
        Column(horizontalAlignment = if (isIncoming) Alignment.Start else Alignment.End) {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = bubbleColor),
                modifier = Modifier.widthIn(max = 280.dp),
            ) {
                Text(
                    text = message.text,
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                )
            }
            Text(
                text = formatRelativeTime(message.timestamp),
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp),
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TemplatesBottomSheet(
    templates: List<Template>,
    onDismiss: () -> Unit,
    onTemplateSelected: (Template) -> Unit,
) {
    val sheetState = rememberModalBottomSheetState()

    ModalBottomSheet(onDismissRequest = onDismiss, sheetState = sheetState) {
        Column(modifier = Modifier.padding(bottom = 24.dp)) {
            Text(
                "Templates",
                style = MaterialTheme.typography.titleLarge,
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
            )
            if (templates.isEmpty()) {
                Text(
                    "No templates yet. Add some from the Templates screen.",
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(16.dp),
                )
            }
            templates.forEach { template ->
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onTemplateSelected(template) },
                ) {
                    Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp)) {
                        Text(template.label, style = MaterialTheme.typography.titleSmall)
                        Text(
                            template.body,
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            maxLines = 2,
                        )
                    }
                }
            }
        }
    }
}

private fun copyToClipboard(context: Context, text: String) {
    val clipboardManager = context.getSystemService(Context.CLIPBOARD_SERVICE) as android.content.ClipboardManager
    clipboardManager.setPrimaryClip(ClipData.newPlainText("MarketTracker template", text))
}
