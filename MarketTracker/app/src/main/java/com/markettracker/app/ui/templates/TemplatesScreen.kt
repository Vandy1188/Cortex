package com.markettracker.app.ui.templates

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Card
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.markettracker.app.data.db.Template

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TemplatesScreen(
    viewModel: TemplatesViewModel,
    onBack: () -> Unit,
) {
    val templates by viewModel.templates.collectAsState()
    var editingTemplate by remember { mutableStateOf<Template?>(null) }
    var showAddDialog by rememberSaveable { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Templates") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
            )
        },
        floatingActionButton = {
            FloatingActionButton(onClick = { showAddDialog = true }) {
                Icon(Icons.Filled.Add, contentDescription = "Add template")
            }
        },
    ) { padding ->
        if (templates.isEmpty()) {
            Column(
                modifier = Modifier.padding(padding).fillMaxSize(),
            ) {
                Text(
                    "No templates yet. Tap + to add one.",
                    modifier = Modifier.padding(16.dp),
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        } else {
            LazyColumn(
                modifier = Modifier.padding(padding).fillMaxSize(),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                items(templates, key = { it.id }) { template ->
                    TemplateRow(
                        template = template,
                        onEdit = { editingTemplate = template },
                        onDelete = { viewModel.deleteTemplate(template) },
                    )
                }
            }
        }
    }

    if (showAddDialog) {
        TemplateEditDialog(
            initialLabel = "",
            initialBody = "",
            onDismiss = { showAddDialog = false },
            onConfirm = { label, body ->
                viewModel.addTemplate(label, body)
                showAddDialog = false
            },
        )
    }

    editingTemplate?.let { template ->
        TemplateEditDialog(
            initialLabel = template.label,
            initialBody = template.body,
            onDismiss = { editingTemplate = null },
            onConfirm = { label, body ->
                viewModel.updateTemplate(template.copy(label = label, body = body))
                editingTemplate = null
            },
        )
    }
}

@Composable
private fun TemplateRow(template: Template, onEdit: () -> Unit, onDelete: () -> Unit) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.padding(start = 16.dp, top = 8.dp, bottom = 8.dp, end = 4.dp),
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(template.label, style = MaterialTheme.typography.titleSmall)
                Text(
                    template.body,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            IconButton(onClick = onEdit) {
                Icon(Icons.Filled.Edit, contentDescription = "Edit")
            }
            IconButton(onClick = onDelete) {
                Icon(Icons.Filled.Delete, contentDescription = "Delete")
            }
        }
    }
}

@Composable
private fun TemplateEditDialog(
    initialLabel: String,
    initialBody: String,
    onDismiss: () -> Unit,
    onConfirm: (label: String, body: String) -> Unit,
) {
    var label by rememberSaveable { mutableStateOf(initialLabel) }
    var body by rememberSaveable { mutableStateOf(initialBody) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(if (initialLabel.isEmpty()) "Add Template" else "Edit Template") },
        text = {
            Column {
                OutlinedTextField(
                    value = label,
                    onValueChange = { label = it },
                    label = { Text("Label") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )
                Spacer(Modifier.padding(4.dp))
                OutlinedTextField(
                    value = body,
                    onValueChange = { body = it },
                    label = { Text("Body") },
                    minLines = 2,
                    maxLines = 5,
                    modifier = Modifier.fillMaxWidth(),
                )
            }
        },
        confirmButton = {
            TextButton(
                onClick = { onConfirm(label.trim(), body.trim()) },
                enabled = label.isNotBlank() && body.isNotBlank(),
            ) {
                Text("Save")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancel") }
        },
    )
}
