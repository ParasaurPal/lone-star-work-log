package com.parasaurpal.lonestarworklog;

import android.content.ClipData;
import android.content.Intent;
import android.net.Uri;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "ShareIntent")
public class ShareIntentPlugin extends Plugin {
    @PluginMethod
    public void getPendingShare(PluginCall call) {
        JSObject payload = fromIntent(getActivity().getIntent());
        call.resolve(payload == null ? new JSObject() : payload);
    }

    @Override
    protected void handleOnNewIntent(Intent intent) {
        super.handleOnNewIntent(intent);
        JSObject payload = fromIntent(intent);
        if (payload != null) notifyListeners("shareReceived", payload);
    }

    private JSObject fromIntent(Intent intent) {
        if (intent == null || !Intent.ACTION_SEND.equals(intent.getAction())) return null;
        String text = intent.getStringExtra(Intent.EXTRA_TEXT);
        String subject = intent.getStringExtra(Intent.EXTRA_SUBJECT);
        Uri data = intent.getData();
        if ((text == null || text.trim().isEmpty()) && data != null) text = data.toString();
        if ((text == null || text.trim().isEmpty()) && intent.getClipData() != null) {
            ClipData clip = intent.getClipData();
            if (clip.getItemCount() > 0) {
                CharSequence itemText = clip.getItemAt(0).coerceToText(getContext());
                if (itemText != null) text = itemText.toString();
            }
        }
        if ((text == null || text.trim().isEmpty()) && (subject == null || subject.trim().isEmpty())) return null;
        JSObject result = new JSObject();
        result.put("text", text == null ? "" : text);
        result.put("subject", subject == null ? "" : subject);
        result.put("shared", true);
        return result;
    }
}
