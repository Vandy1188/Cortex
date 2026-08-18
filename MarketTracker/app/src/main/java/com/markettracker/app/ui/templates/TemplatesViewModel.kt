package com.markettracker.app.ui.templates

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.markettracker.app.data.db.Template
import com.markettracker.app.data.repository.TemplateRepository
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class TemplatesViewModel(
    private val repository: TemplateRepository,
) : ViewModel() {

    val templates: StateFlow<List<Template>> =
        repository.observeAllTemplates()
            .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    fun addTemplate(label: String, body: String) {
        viewModelScope.launch { repository.add(label, body) }
    }

    fun updateTemplate(template: Template) {
        viewModelScope.launch { repository.update(template) }
    }

    fun deleteTemplate(template: Template) {
        viewModelScope.launch { repository.delete(template) }
    }
}
