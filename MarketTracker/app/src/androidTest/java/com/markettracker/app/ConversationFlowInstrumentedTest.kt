package com.markettracker.app

import androidx.room.Room
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.markettracker.app.data.StatusTag
import com.markettracker.app.data.db.AppDatabase
import com.markettracker.app.data.repository.ConversationRepository
import kotlinx.coroutines.runBlocking
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Instrumented (on-device/emulator) sanity check that the ingestion path works
 * end-to-end against a real Room database running on an actual Android
 * runtime, complementing the Robolectric-based unit tests. No emulator was
 * available in the environment this app was built in, so this hasn't been run
 * yet — run it via `./gradlew connectedDebugAndroidTest` once you have a
 * device or emulator connected.
 */
@RunWith(AndroidJUnit4::class)
class ConversationFlowInstrumentedTest {

    private lateinit var db: AppDatabase
    private lateinit var repository: ConversationRepository

    @Before
    fun setUp() {
        val context = ApplicationProvider.getApplicationContext<android.content.Context>()
        db = Room.inMemoryDatabaseBuilder(context, AppDatabase::class.java).build()
        repository = ConversationRepository(db.conversationDao(), db.messageDao())
    }

    @After
    fun tearDown() {
        db.close()
    }

    @Test
    fun newBuyerMessageCreatesNeedsTaggingConversation() = runBlocking {
        val id = repository.ingestIncomingMessage("Jane Buyer", "Is this still available?", 1_000L)

        val conversation = db.conversationDao().getConversation(id)
        assertEquals(StatusTag.NEEDS_TAGGING, conversation?.statusTag)
    }
}
