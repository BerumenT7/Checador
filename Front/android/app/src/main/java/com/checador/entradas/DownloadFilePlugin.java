package com.checador.entradas;

import android.content.ContentValues;
import android.content.Context;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

@CapacitorPlugin(name = "DownloadFile")
public class DownloadFilePlugin extends Plugin {

    @PluginMethod
    public void saveToDownloads(PluginCall call) {
        String base64Data = call.getString("data");
        String fileName = call.getString("fileName");
        String mimeType = call.getString("mimeType", "application/pdf");

        if (base64Data == null || fileName == null) {
            call.reject("Faltan parámetros 'data' o 'fileName'");
            return;
        }

        try {
            byte[] bytes = Base64.decode(base64Data, Base64.DEFAULT);
            Context context = getContext();

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                // Android 10+: usar MediaStore, no requiere permisos de almacenamiento.
                ContentValues values = new ContentValues();
                values.put(MediaStore.MediaColumns.DISPLAY_NAME, fileName);
                values.put(MediaStore.MediaColumns.MIME_TYPE, mimeType);
                values.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);

                Uri collection = MediaStore.Downloads.EXTERNAL_CONTENT_URI;
                Uri itemUri = context.getContentResolver().insert(collection, values);

                if (itemUri == null) {
                    call.reject("No se pudo crear el archivo en Descargas");
                    return;
                }

                try (OutputStream out = context.getContentResolver().openOutputStream(itemUri)) {
                    if (out == null) {
                        call.reject("No se pudo abrir el archivo para escritura");
                        return;
                    }
                    out.write(bytes);
                }

                JSObject ret = new JSObject();
                ret.put("uri", itemUri.toString());
                ret.put("path", "Download/" + fileName);
                call.resolve(ret);
            } else {
                // Android 9 y anteriores: escritura directa (requiere WRITE_EXTERNAL_STORAGE).
                File downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                if (!downloadsDir.exists()) {
                    downloadsDir.mkdirs();
                }
                File file = new File(downloadsDir, fileName);
                try (FileOutputStream fos = new FileOutputStream(file)) {
                    fos.write(bytes);
                }

                JSObject ret = new JSObject();
                ret.put("uri", Uri.fromFile(file).toString());
                ret.put("path", file.getAbsolutePath());
                call.resolve(ret);
            }
        } catch (Exception e) {
            call.reject("Error guardando archivo: " + e.getMessage(), e);
        }
    }
}
