package com.markettracker.app.data

import androidx.room.Room
import androidx.test.core.app.ApplicationProvider
import com.markettracker.app.data.db.AppDatabase
import com.markettracker.app.data.repository.ConversationRepository
import kotlinx.coroutines.test.runTest
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/**
 * Exercises the "new sender -> NEEDS_TAGGING conversation" and
 * "known sender -> appended message" ingestion paths the notification listener
 * relies on, against a real (in-memory) Room database.
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [33])
class ConversationRepositoryTest {

    private lateinit var db: AppDatabase
    private lateinit var repository: ConversationRepository

    @Before
    fun setUp() {
        val context = ApplicationProvider.getApplicationContext<android.content.Context>()
        db = Room.inMemoryDatabaseBuilder(context, AppDatabase::class.java)
            .allowMainThreadQueries()
            .build()
        repository = ConversationRepository(db.conversationDao(), db.messageDao())
    }

    @After
    fun tearDown() {
        db.close()
    }

    @Test
    fun `ingesting a message from a new sender creates a NEEDS_TAGGING conversation`() = runTest {
        val id = repository.ingestIncomingMessage("Jane Buyer", "Is this available?", 1_000L)

        val conversation = db.conversationDao().getConversation(id)
        assertNotNull(conversation)
        assertEquals(StatusTag.NEEDS_TAGGING, conversation!!.statusTag)
        assertEquals("Jane Buyer", conversation.buyerName)
        assertEquals(1_000L, conversation.lastActivityAt)
    }

    @Test
    fun `ingesting a second message from the same sender appends to the existing conversation`() = runTest {
        val firstId = repository.ingestIncomingMessage("Jane Buyer", "Is this available?", 1_000L)
        val secondId = repository.ingestIncomingMessage("Jane Buyer", "Would you take $20?", 2_000L)

        assertEquals(firstId, secondId)

        val conversation = db.conversationDao().getConversation(firstId)
        assertEquals(2_000L, conversation!!.lastActivityAt)
    }

    @Test
    fun `sender matching is case-insensitive`() = runTest {
        val firstId = repository.ingestIncomingMessage("Jane Buyer", "Hi", 1_000L)
        val secondId = repository.ingestIncomingMessage("jane buyer", "Still there?", 2_000L)

        assertEquals(firstId, secondId)
    }

    @Test
    fun `different senders create separate conversations`() = runTest {
        val firstId = repository.ingestIncomingMessage("Jane Buyer", "Hi", 1_000L)
        val secondId = repository.ingestIncomingMessage("John Buyer", "Hey", 1_000L)

        assert(firstId != secondId)
    }
}
