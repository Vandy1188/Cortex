package com.markettracker.app

import android.app.Application
import com.markettracker.app.data.db.AppDatabase
import com.markettracker.app.data.repository.ConversationRepository
import com.markettracker.app.data.repository.TemplateRepository

/**
 * Simple manual service locator — no DI framework needed for a single-user,
 * single-process, local-only app. [ServiceLocator] gives the NotificationListenerService
 * (which Android instantiates itself, not something we can constructor-inject into)
 * a way to reach the repositories.
 */
class MarketTrackerApp : Application() {

    val database: AppDatabase by lazy { AppDatabase.getInstance(this) }

    val conversationRepository: ConversationRepository by lazy {
        ConversationRepository(database.conversationDao(), database.messageDao())
    }

    val templateRepository: TemplateRepository by lazy {
        TemplateRepository(database.templateDao())
    }

    override fun onCreate() {
        super.onCreate()
        ServiceLocator.app = this
    }
}

object ServiceLocator {
    lateinit var app: MarketTrackerApp
}
