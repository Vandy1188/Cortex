package com.markettracker.app.notification

import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log
import com.markettracker.app.ServiceLocator
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch

/**
 * Listens for notifications system-wide and captures messages posted by the
 * Facebook Messenger app, filing them into the local Room database as
 * Conversations/Messages. Requires the user to grant Notification Access in
 * system settings (see NotificationAccessHelper) — Android does not allow this
 * permission to be requested via a runtime dialog.
 */
class MessengerNotificationListenerService : NotificationListenerService() {

    private val serviceJob = Job()
    private val serviceScope = CoroutineScope(Dispatchers.IO + serviceJob)

    override fun onNotificationPosted(sbn: StatusBarNotification) {
        super.onNotificationPosted(sbn)
        handle(sbn)
    }

    private fun handle(sbn: StatusBarNotification) {
        val parsed = try {
            MessengerNotificationParser.parse(sbn)
        } catch (t: Throwable) {
            // Never let a malformed notification crash the listener — that would
            // silently kill capture for every future notification too.
            Log.w(TAG, "Failed to parse notification from ${sbn.packageName}", t)
            null
        } ?: return

        serviceScope.launch {
            runCatching {
                ServiceLocator.app.conversationRepository.ingestIncomingMessage(
                    senderName = parsed.senderName,
                    text = parsed.messageText,
                    timestampMillis = parsed.timestampMillis,
                )
            }.onFailure { Log.w(TAG, "Failed to ingest parsed message", it) }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        serviceJob.cancel()
    }

    companion object {
        private const val TAG = "MessengerListener"
    }
}
