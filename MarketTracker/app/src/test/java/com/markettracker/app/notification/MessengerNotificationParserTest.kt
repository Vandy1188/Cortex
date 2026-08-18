package com.markettracker.app.notification

import android.app.Notification
import android.app.Person
import android.os.Build
import androidx.test.core.app.ApplicationProvider
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/**
 * Verifies the notification-listener's parsing logic can actually read Messenger's
 * notification content, using real android.app.Notification / MessagingStyle
 * objects built via Robolectric — i.e. without needing a physical device or
 * emulator to exercise this highest-risk piece of the app.
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [33])
class MessengerNotificationParserTest {

    private val context by lazy { ApplicationProvider.getApplicationContext<android.content.Context>() }

    private fun channelId(): String {
        // Notification.Builder requires a channel id on O+; a raw string is fine
        // for these unit tests since we never actually post the notification.
        return "test_channel"
    }

    // --- isFromMessenger -----------------------------------------------------

    @Test
    fun `recognizes Messenger package`() {
        assertTrue(MessengerNotificationParser.isFromMessenger("com.facebook.orca"))
    }

    @Test
    fun `recognizes Messenger Lite package`() {
        assertTrue(MessengerNotificationParser.isFromMessenger("com.facebook.mlite"))
    }

    @Test
    fun `rejects unrelated package`() {
        assertTrue(!MessengerNotificationParser.isFromMessenger("com.whatsapp"))
    }

    // --- MessagingStyle notifications (modern Messenger DMs) -----------------

    @Test
    fun `parses a MessagingStyle notification from a 1-on-1 buyer chat`() {
        val buyer = Person.Builder().setName("Jane Buyer").build()
        val me = Person.Builder().setName("Me").build()

        val style = Notification.MessagingStyle(me)
            .setConversationTitle("Jane Buyer")
            .addMessage("Hi, is this still available?", 1_700_000_000_000L, buyer)

        val notification = Notification.Builder(context, channelId())
            .setContentTitle("Jane Buyer")
            .setStyle(style)
            .build()

        val result = MessengerNotificationParser.parseNotification(notification)

        assertEquals("Jane Buyer", result?.senderName)
        assertEquals("Hi, is this still available?", result?.messageText)
        assertEquals(1_700_000_000_000L, result?.timestampMillis)
    }

    @Test
    fun `uses the most recent message when multiple are present`() {
        val buyer = Person.Builder().setName("Jane Buyer").build()
        val me = Person.Builder().setName("Me").build()

        val style = Notification.MessagingStyle(me)
            .setConversationTitle("Jane Buyer")
            .addMessage("First message", 1_000L, buyer)
            .addMessage("Second, newer message", 2_000L, buyer)

        val notification = Notification.Builder(context, channelId())
            .setStyle(style)
            .build()

        val result = MessengerNotificationParser.parseNotification(notification)

        assertEquals("Second, newer message", result?.messageText)
        assertEquals(2_000L, result?.timestampMillis)
    }

    @Test
    fun `falls back to sender person name when there is no conversation title`() {
        val buyer = Person.Builder().setName("Jane Buyer").build()
        val me = Person.Builder().setName("Me").build()

        val style = Notification.MessagingStyle(me)
            .addMessage("Would you take $20?", 1_000L, buyer)

        val notification = Notification.Builder(context, channelId())
            .setStyle(style)
            .build()

        val result = MessengerNotificationParser.parseNotification(notification)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            assertEquals("Jane Buyer", result?.senderName)
        }
    }

    // --- Group summary notifications should be skipped ------------------------

    @Test
    fun `skips group summary notifications`() {
        val buyer = Person.Builder().setName("Jane Buyer").build()
        val me = Person.Builder().setName("Me").build()

        val style = Notification.MessagingStyle(me)
            .setConversationTitle("Jane Buyer")
            .addMessage("Hello", 1_000L, buyer)

        val notification = Notification.Builder(context, channelId())
            .setGroup("messenger_group")
            .setGroupSummary(true)
            .setStyle(style)
            .build()

        assertNull(MessengerNotificationParser.parseNotification(notification))
    }

    // --- Plain (non-MessagingStyle) fallback ----------------------------------

    @Test
    fun `parses a plain title-text notification as fallback`() {
        val notification = Notification.Builder(context, channelId())
            .setContentTitle("Jane Buyer")
            .setContentText("Can you do $15?")
            .setWhen(1_650_000_000_000L)
            .build()

        val result = MessengerNotificationParser.parseNotification(notification)

        assertEquals("Jane Buyer", result?.senderName)
        assertEquals("Can you do $15?", result?.messageText)
        assertEquals(1_650_000_000_000L, result?.timestampMillis)
    }

    @Test
    fun `returns null when title or text is missing`() {
        val notification = Notification.Builder(context, channelId())
            .setContentTitle("Jane Buyer")
            .build()

        assertNull(MessengerNotificationParser.parseNotification(notification))
    }

    @Test
    fun `returns null for a notification with no extras at all`() {
        val notification = Notification()
        assertNull(MessengerNotificationParser.parseNotification(notification))
    }
}
