package com.tijori.sms

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.provider.Telephony
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

private const val SMS_RECEIVED_EVENT = "onSmsReceived"

/**
 * Reads SMS from the device inbox and streams newly received ones to JS.
 *
 * Only messages from alphanumeric sender IDs (e.g. "AD-HDFCBK") are ever handed to JS —
 * personal messages from phone numbers are skipped here, before they leave native code.
 * Nothing is persisted or sent anywhere by this module.
 */
class TijoriSmsModule : Module() {
  private var receiver: BroadcastReceiver? = null

  private val context: Context
    get() = appContext.reactContext ?: throw IllegalStateException("React context is not available")

  override fun definition() = ModuleDefinition {
    Name("TijoriSms")

    Events(SMS_RECEIVED_EVENT)

    AsyncFunction("readInboxAsync") { sinceMillis: Double ->
      readInbox(sinceMillis.toLong())
    }

    OnStartObserving(SMS_RECEIVED_EVENT) { startListening() }

    OnStopObserving(SMS_RECEIVED_EVENT) { stopListening() }

    OnDestroy { stopListening() }
  }

  private fun readInbox(sinceMillis: Long): List<Map<String, Any>> {
    val messages = ArrayList<Map<String, Any>>()
    val projection = arrayOf(Telephony.Sms.ADDRESS, Telephony.Sms.BODY, Telephony.Sms.DATE)

    context.contentResolver.query(
      Telephony.Sms.Inbox.CONTENT_URI,
      projection,
      "${Telephony.Sms.DATE} >= ?",
      arrayOf(sinceMillis.toString()),
      "${Telephony.Sms.DATE} DESC"
    )?.use { cursor ->
      val addressIndex = cursor.getColumnIndexOrThrow(Telephony.Sms.ADDRESS)
      val bodyIndex = cursor.getColumnIndexOrThrow(Telephony.Sms.BODY)
      val dateIndex = cursor.getColumnIndexOrThrow(Telephony.Sms.DATE)

      while (cursor.moveToNext()) {
        val sender = cursor.getString(addressIndex) ?: continue
        if (!isBusinessSender(sender)) continue
        val body = cursor.getString(bodyIndex) ?: continue
        messages.add(
          mapOf(
            "sender" to sender,
            "body" to body,
            "timestamp" to cursor.getLong(dateIndex).toDouble()
          )
        )
      }
    }
    return messages
  }

  private fun startListening() {
    if (receiver != null) return

    val smsReceiver = object : BroadcastReceiver() {
      override fun onReceive(ctx: Context, intent: Intent) {
        if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return
        val parts = Telephony.Sms.Intents.getMessagesFromIntent(intent) ?: return

        // Long SMS arrive as several parts; stitch them back together per sender.
        parts.filterNotNull()
          .groupBy { it.originatingAddress.orEmpty() }
          .forEach { (sender, pieces) ->
            if (!isBusinessSender(sender)) return@forEach
            sendEvent(
              SMS_RECEIVED_EVENT,
              mapOf(
                "sender" to sender,
                "body" to pieces.joinToString("") { it.messageBody.orEmpty() },
                // Match the inbox's DATE column (time received), not the carrier timestamp.
                "timestamp" to System.currentTimeMillis().toDouble()
              )
            )
          }
      }
    }

    val filter = IntentFilter(Telephony.Sms.Intents.SMS_RECEIVED_ACTION)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      context.registerReceiver(smsReceiver, filter, Context.RECEIVER_EXPORTED)
    } else {
      context.registerReceiver(smsReceiver, filter)
    }
    receiver = smsReceiver
  }

  private fun stopListening() {
    val current = receiver ?: return
    receiver = null
    try {
      appContext.reactContext?.unregisterReceiver(current)
    } catch (_: IllegalArgumentException) {
      // Already unregistered.
    }
  }

  /** Banks send from alphanumeric headers; anything that is only digits/+ is a person. */
  private fun isBusinessSender(sender: String): Boolean = sender.any { it.isLetter() }
}
