package com.markettracker.app.data.db

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import androidx.sqlite.db.SupportSQLiteDatabase
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

@Database(
    entities = [Conversation::class, Message::class, Template::class],
    version = 1,
    exportSchema = true,
)
@TypeConverters(Converters::class)
abstract class AppDatabase : RoomDatabase() {

    abstract fun conversationDao(): ConversationDao
    abstract fun messageDao(): MessageDao
    abstract fun templateDao(): TemplateDao

    companion object {
        @Volatile
        private var instance: AppDatabase? = null

        fun getInstance(context: Context): AppDatabase =
            instance ?: synchronized(this) {
                instance ?: build(context).also { instance = it }
            }

        private fun build(context: Context): AppDatabase {
            lateinit var db: AppDatabase
            db = Room.databaseBuilder(
                context.applicationContext,
                AppDatabase::class.java,
                "markettracker.db",
            )
                .addCallback(object : RoomDatabase.Callback() {
                    override fun onCreate(sqLiteDatabase: SupportSQLiteDatabase) {
                        super.onCreate(sqLiteDatabase)
                        // Seed starter templates on first run only. This callback only
                        // fires once the DB file is actually opened (lazily, after
                        // build() returns), so `db` is guaranteed to be assigned by then.
                        CoroutineScope(Dispatchers.IO).launch {
                            val dao = db.templateDao()
                            if (dao.count() == 0) {
                                StarterTemplates.all.forEach { dao.insert(it) }
                            }
                        }
                    }
                })
                .build()
            return db
        }
    }
}

object StarterTemplates {
    val all = listOf(
        Template(label = "Still available?", body = "Hi! Is this still available?"),
        Template(label = "Offer", body = "Would you take [price]?"),
        Template(label = "Pickup time", body = "Can you do [time] for pickup?"),
    )
}
