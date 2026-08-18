# MarketTracker

A personal, local-only Android app for tracking Facebook Marketplace buyer
conversations outside of Messenger. Single user, no backend, no accounts, no
network access at all — everything lives in a Room (SQLite) database on your
phone.

## How it works

1. A `NotificationListenerService` watches for notifications posted by the
   Messenger app (`com.facebook.orca` / `com.facebook.mlite`).
2. When one arrives, it's parsed for the buyer's name, message text, and
   timestamp (handles both modern `MessagingStyle` notifications and the
   plain title/text fallback; group-summary notifications like "3 new
   messages" are ignored).
3. If the sender matches an existing conversation (case-insensitive name
   match), the message is appended and `lastActivityAt` is bumped. If it's a
   new sender, a new conversation is created in `NEEDS_TAGGING` status.
4. Everything is stored locally in Room. The UI (Jetpack Compose) reads/writes
   the same database — conversation list, conversation detail (chat-style
   message view + editable notes/status/item), and a templates screen for
   canned replies you copy to the clipboard and paste into Messenger.

No internet permission is requested or used anywhere in the app.

## Project structure

```
app/src/main/java/com/markettracker/app/
  MainActivity.kt              Nav host + screen wiring
  MarketTrackerApp.kt          Application class / manual service locator
  data/
    StatusTag.kt                Conversation status enum + chip colors
    db/                         Room entities, DAOs, AppDatabase, converters
    repository/                 ConversationRepository, TemplateRepository
  notification/
    MessengerNotificationParser.kt        Pure parsing logic (unit tested)
    MessengerNotificationListenerService.kt  The actual listener service
    NotificationAccessHelper.kt           Permission check + settings deep link
  ui/
    conversationlist/           Home screen: list, status tabs, quick-tag highlight
    conversationdetail/         Chat view, notes/status/item editing, templates sheet
    templates/                  Manage saved reply templates
    theme/                      Material3 theme
  util/TimeFormat.kt            Relative timestamp formatting
app/src/test/                  JVM unit tests (Robolectric where real Notification
                                objects are needed — no device/emulator required)
app/src/androidTest/           Instrumented tests (need a device/emulator)
```

## Notification access permission

Notification-listener access is not a normal runtime permission — Android has
no dialog for it. The app detects whether access is granted
(`NotificationAccessHelper.isNotificationAccessGranted`) and shows a banner on
the conversation list if not; tapping it deep-links to the system
**Notification access** settings screen (`Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS`),
where you manually toggle MarketTracker on. This only has to be done once.

## Testing

The notification-listener parsing logic — the highest-risk, most novel piece
of this app — was built and verified first, in isolation, before anything
else. `MessengerNotificationParser` is pure Kotlin operating on real
`android.app.Notification` / `Notification.MessagingStyle` objects built via
**Robolectric**, so its behavior against realistic Messenger notification
shapes (1:1 `MessagingStyle` messages, multi-message threads, group-summary
notifications that must be skipped, and the plain-extras fallback) is checked
on the JVM without needing a physical device or emulator.

Run all unit tests:

```bash
./gradlew testDebugUnitTest
```

This includes:
- `MessengerNotificationParserTest` — notification parsing correctness
- `ConversationRepositoryTest` — new-sender-creates-conversation /
  known-sender-appends-message / case-insensitive matching, against a real
  in-memory Room database
- `TimeFormatTest` — relative timestamp formatting

Instrumented tests under `app/src/androidTest` require a device/emulator to
run (`./gradlew connectedDebugAndroidTest`) — there was no emulator available
in the environment this app was built in, so real on-device verification
(including actually receiving a Messenger notification) is up to you after
sideloading.

## Building the APK

You'll need [Android Studio](https://developer.android.com/studio) (which
bundles the JDK and Android SDK), or just the command line if you already have
an SDK installed.

### Option A — Android Studio (easiest)

1. Open this `MarketTracker/` folder in Android Studio.
2. Let it sync Gradle (first sync downloads dependencies — takes a few
   minutes).
3. **Build → Build Bundle(s) / APK(s) → Build APK(s)**, or run the app
   directly on a connected phone/emulator with the ▶ button.
4. The debug APK lands at `app/build/outputs/apk/debug/app-debug.apk`.

### Option B — command line

```bash
cd MarketTracker
./gradlew assembleDebug
```

The APK is written to `app/build/outputs/apk/debug/app-debug.apk`.

For a release build (unsigned by default — see below):

```bash
./gradlew assembleRelease
```

## Installing on your phone (sideloading)

This app is not on the Play Store, so you install it directly ("sideload").

1. **Enable installing unknown apps** on your phone: Settings → Apps →
   Special app access → Install unknown apps → pick the app you'll install
   from (e.g. Files, or your file manager) → allow.
2. **Get the APK onto your phone**, either:
   - **Via USB + adb** (recommended if you have Android Studio / platform-tools):
     ```bash
     adb install app/build/outputs/apk/debug/app-debug.apk
     ```
     (Enable Developer Options → USB debugging on your phone first: Settings →
     About phone → tap "Build number" 7 times, then Settings → Developer
     options → USB debugging.)
   - **Or copy the file over** (USB file transfer, email it to yourself,
     upload to Drive, etc.) and open it from a file manager on the phone.
3. Tap the APK file on your phone and confirm the install prompt.
4. **Open MarketTracker** once installed. You'll see a red banner at the top
   of the conversation list saying notification access is needed — tap it,
   find **MarketTracker** in the list on the settings screen that opens, and
   turn it on. Android will show a warning about the permission's scope
   (notification listeners can read all your notifications) — that's normal
   for this permission type; MarketTracker only *acts* on notifications from
   the Messenger package.
5. Send yourself a test message in Messenger (or wait for a real buyer message)
   and confirm it shows up as a new "Needs Tagging" conversation in the app.

### Updating later

Rebuild the APK the same way and reinstall — `adb install -r
app-debug.apk` (the `-r` keeps your existing data) or just tap the new APK
file again; Android will offer to update in place as long as the package name
and signing key haven't changed.
