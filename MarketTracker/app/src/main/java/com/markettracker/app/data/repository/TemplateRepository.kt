package com.markettracker.app.data.repository

import com.markettracker.app.data.db.Template
import com.markettracker.app.data.db.TemplateDao
import kotlinx.coroutines.flow.Flow

class TemplateRepository(private val templateDao: TemplateDao) {

    fun observeAllTemplates(): Flow<List<Template>> = templateDao.observeAllTemplates()

    suspend fun add(label: String, body: String) =
        templateDao.insert(Template(label = label, body = body))

    suspend fun update(template: Template) = templateDao.update(template)

    suspend fun delete(template: Template) = templateDao.delete(template)
}
