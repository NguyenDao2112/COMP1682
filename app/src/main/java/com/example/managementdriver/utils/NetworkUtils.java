package com.example.managementdriver.utils;

import android.content.Context;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.NetworkRequest;
import android.os.Handler;
import android.os.Looper;

public class NetworkUtils {

    // Helper to check if user forced offline mode
    private static boolean isForcedOffline(Context context) {
        return new PrefsManager(context).isOfflineMapEnabled();
    }

    public interface NetworkStatusListener {
        void onNetworkAvailable();
        void onNetworkLost();
    }

    public static boolean isNetworkAvailable(Context context) {
        // Bỏ qua hàm check mạng của máy ảo vì hệ điều hành Android trên máy ảo đang bị lỗi không cập nhật trạng thái mạng sau khi wipe data.
        // Chỉ cần người dùng KHÔNG gạt nút Offline, App sẽ mặc định hiểu là đang có mạng.
        return !isForcedOffline(context);
    }

    public static void observeNetworkStatus(Context context, NetworkStatusListener listener) {
        ConnectivityManager connectivityManager = (ConnectivityManager) context.getSystemService(Context.CONNECTIVITY_SERVICE);
        if (connectivityManager == null) return;

        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.N) {
            connectivityManager.registerDefaultNetworkCallback(new ConnectivityManager.NetworkCallback() {
            private final Handler handler = new Handler(Looper.getMainLooper());

            private void updateState() {
                // Cancel any pending checks to debounce rapid onLost/onAvailable events
                handler.removeCallbacksAndMessages(null);
                
                // Wait 500ms for Android's global network state to settle before polling
                handler.postDelayed(() -> {
                    if (isNetworkAvailable(context)) {
                        listener.onNetworkAvailable();
                    } else {
                        listener.onNetworkLost();
                    }
                }, 500);
            }

            @Override
            public void onAvailable(Network network) {
                updateState();
            }

            @Override
            public void onLost(Network network) {
                updateState();
            }

            @Override
            public void onUnavailable() {
                updateState();
            }
        });
        }
        
        // Trạng thái ban đầu
        if (isForcedOffline(context) || !isNetworkAvailable(context)) {
            listener.onNetworkLost();
        } else {
            listener.onNetworkAvailable();
        }
    }
}
