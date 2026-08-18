package com.markettracker.app.notification

import android.app.Notification
import android.os.Build
import android.service.notification.StatusBarNotification

/**
 * Packages this app treats as "Messenger" for the purposes of capturing buyer
 * conversations. Covers the main Messenger app and Messenger Lite.
 */
val MESSENGER_PACKAGES = setOf(
    "com.facebook.orca",   // Messenger
    "com.facebook.mlite",  // Messenger Lite
)

/**
 * Result of successfully parsing a Messenger notification into something we can
 * store as a Conversation + Message.
 */
data class ParsedMessengerNotification(
    val senderName: String,
    val messageText: String,
    val timestampMillis: Long,
)

/**
 * Pure parsing logic for turning a Messenger [Notification] into a
 * [ParsedMessengerNotification], or null if it isn't a real one-on-one message we
 * should capture (e.g. a "N new messages" summary notification, a call/media
 * notification, or one missing the fields we need).
 *
 * Deliberately split so the core logic ([parseNotification]) operates on a plain
 * [Notification] rather than a [StatusBarNotification] — the latter's public
 * constructor shape varies across API levels, which makes it awkward to build in
 * tests, while [Notification]/[Notification.MessagingStyle] can be built directly
 * via their public Builder APIs. That keeps the highest-risk logic (actually
 * reading Messenger's notification content) fully unit-testable on the JVM via
 * Robolectric, without needing a device or emulator.
 */
object MessengerNotificationParser {

    fun isFromMessenger(packageName: String): Boolean = packageName in MESSENGER_PACKAGES

    fun isFromMessenger(sbn: StatusBarNotification): Boolean = isFromMessenger(sbn.packageName)

    fun parse(sbn: StatusBarNotification): ParsedMessengerNotification? {
        if (!isFromMessenger(sbn)) return null
        val notification = sbn.notification ?: return null
        return parseNotification(notification)
    }

    fun parseNotification(notification: Notification): ParsedMessengerNotification? {
        // Group-summary notifications (e.g. "3 new messages" across conversations)
        // don't represent a single buyer's message — skip them, the individual
        // child notifications carry the real per-conversation content.
        if (isGroupSummary(notification)) return null

        parseFromMessagingStyle(notification)?.let { return it }
        return parseFromExtras(notification)
    }

    private fun isGroupSummary(notification: Notification): Boolean =
        (notification.flags and Notification.FLAG_GROUP_SUMMARY) != 0

    /**
     * Modern Messenger notifications use [Notification.MessagingStyle], which stores
     * each message as a Bundle in the EXTRA_MESSAGES extra. This is the richest and
     * most reliable source: it gives us per-message text/timestamp/sender directly.
     */
    private fun parseFromMessagingStyle(notification: Notification): ParsedMessengerNotification? {
        val extras = notification.extras ?: return null

        @Suppress("DEPRECATION")
        val messageBundles = extras.getParcelableArray(Notification.EXTRA_MESSAGES) ?: return null
        if (messageBundles.isEmpty()) return null

        val messages = Notification.MessagingStyle.Message.getMessagesFromBundleArray(messageBundles)
        val lastMessage = messages.maxByOrNull { it.timestamp } ?: return null

        val text = lastMessage.text?.toString()?.trim()
        if (text.isNullOrEmpty()) return null

        val conversationTitle = extras.getCharSequence(Notification.EXTRA_CONVERSATION_TITLE)?.toString()
        val notificationTitle = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString()
        val senderPersonName = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            lastMessage.senderPerson?.name?.toString()
        } else null

        val senderName = (conversationTitle ?: notificationTitle ?: senderPersonName)
            ?.trim()
            ?.takeIf { it.isNotEmpty() }
            ?: return null

        val timestamp = lastMessage.timestamp.takeIf { it > 0 } ?: System.currentTimeMillis()

        return ParsedMessengerNotification(
            senderName = senderName,
            messageText = text,
            timestampMillis = timestamp,
        )
    }

    /**
     * Fallback for simple (non-MessagingStyle) notifications: plain EXTRA_TITLE /
     * EXTRA_TEXT, as Messenger falls back to on some devices/OS versions.
     */
    private fun parseFromExtras(notification: Notification): ParsedMessengerNotification? {
        val extras = notification.extras ?: return null

        val title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString()?.trim()
        val text = extras.getCharSequence(Notification.EXTRA_TEXT)?.toString()?.trim()

        if (title.isNullOrEmpty() || text.isNullOrEmpty()) return null

        val timestamp = notification.`when`.takeIf { it > 0 } ?: System.currentTimeMillis()

        return ParsedMessengerNotification(
            senderName = title,
            messageText = text,
            timestampMillis = timestamp,
        )
    }
}
