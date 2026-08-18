package com.markettracker.app.notification

import android.content.Context
import android.content.Intent
import android.provider.Settings

/**
 * Notification access ("notification listener") is not a normal/dangerous runtime
 * permission — there is no ActivityCompat.requestPermissions() dialog for it.
 * The only way to grant it is for the user to manually flip it on in system
 * settings, so this app can only detect the current state and deep-link there.
 */
object NotificationAccessHelper {

    /** True if the user has granted this app notification-listener access. */
    fun isNotificationAccessGranted(context: Context): Boolean {
        val enabledPackages = Settings.Secure.getString(
            context.contentResolver,
            "enabled_notification_listeners",
        ) ?: return false

        return enabledPackages.split(":").any { it.contains(context.packageName) }
    }

    /**
     * Opens the system "Notification access" settings screen, where the user can
     * find MarketTracker in the list and toggle it on. Falls back to the general
     * notification-listener settings intent, which is the most broadly supported
     * across OEMs/API levels.
     */
    fun openNotificationAccessSettings(context: Context) {
        val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(intent)
    }
}
