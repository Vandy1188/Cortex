package com.markettracker.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.DisposableEffect
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.markettracker.app.notification.NotificationAccessHelper
import com.markettracker.app.ui.conversationdetail.ConversationDetailScreen
import com.markettracker.app.ui.conversationdetail.ConversationDetailViewModel
import com.markettracker.app.ui.conversationlist.ConversationListScreen
import com.markettracker.app.ui.conversationlist.ConversationListViewModel
import com.markettracker.app.ui.templates.TemplatesScreen
import com.markettracker.app.ui.templates.TemplatesViewModel
import com.markettracker.app.ui.theme.MarketTrackerTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            MarketTrackerTheme {
                MarketTrackerNavHost()
            }
        }
    }
}

private object Routes {
    const val LIST = "list"
    const val TEMPLATES = "templates"
    const val DETAIL = "detail/{conversationId}"
    fun detail(conversationId: Long) = "detail/$conversationId"
}

@Composable
private fun MarketTrackerNavHost() {
    val navController = rememberNavController()
    val context = LocalContext.current
    val app = ServiceLocator.app

    var notificationAccessGranted by remember {
        mutableStateOf(NotificationAccessHelper.isNotificationAccessGranted(context))
    }

    // Re-check when returning from system settings (or any resume) since Android
    // gives no callback for "user just granted notification access".
    val lifecycleOwner = LocalLifecycleOwner.current
    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_RESUME) {
                notificationAccessGranted = NotificationAccessHelper.isNotificationAccessGranted(context)
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }

    NavHost(navController = navController, startDestination = Routes.LIST) {
        composable(Routes.LIST) {
            val listViewModel: ConversationListViewModel = viewModel(
                factory = viewModelFactory {
                    initializer { ConversationListViewModel(app.conversationRepository) }
                },
            )
            ConversationListScreen(
                viewModel = listViewModel,
                notificationAccessGranted = notificationAccessGranted,
                onOpenConversation = { id -> navController.navigate(Routes.detail(id)) },
                onOpenTemplates = { navController.navigate(Routes.TEMPLATES) },
                onRequestNotificationAccess = { NotificationAccessHelper.openNotificationAccessSettings(context) },
            )
        }
        composable(Routes.TEMPLATES) {
            val templatesViewModel: TemplatesViewModel = viewModel(
                factory = viewModelFactory {
                    initializer { TemplatesViewModel(app.templateRepository) }
                },
            )
            TemplatesScreen(
                viewModel = templatesViewModel,
                onBack = { navController.popBackStack() },
            )
        }
        composable(
            route = Routes.DETAIL,
            arguments = listOf(navArgument("conversationId") { type = NavType.LongType }),
        ) { backStackEntry ->
            val conversationId = backStackEntry.arguments?.getLong("conversationId") ?: return@composable
            val detailViewModel: ConversationDetailViewModel = viewModel(
                key = "detail-$conversationId",
                factory = viewModelFactory {
                    initializer {
                        ConversationDetailViewModel(conversationId, app.conversationRepository, app.templateRepository)
                    }
                },
            )
            ConversationDetailScreen(
                viewModel = detailViewModel,
                onBack = { navController.popBackStack() },
            )
        }
    }
}
