package com.example.managementdriver.utils;

import android.content.Context;
import android.content.SharedPreferences;

public class PrefsManager {
    private static final String PREF_NAME = "DriverPrefs";
    private static final String KEY_TOKEN = "auth_token";
    private static final String KEY_ROUTE_ID = "current_route_id";
    private static final String KEY_DRIVER_ID = "driver_id";
    private static final String KEY_DRIVER_NAME = "driver_name";
    private static final String KEY_TOTAL_STOPS = "total_stops";
    private static final String KEY_OFFLINE_MAP = "offline_map_enabled";
    private static final String KEY_GPS_PRECISION = "gps_precision_enabled";
    
    private SharedPreferences prefs;

    public PrefsManager(Context context) {
        prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
    }

    public void saveToken(String token) {
        prefs.edit().putString(KEY_TOKEN, token).apply();
    }

    public String getToken() {
        return prefs.getString(KEY_TOKEN, null);
    }

    public void setOfflineMapEnabled(boolean enabled) {
        prefs.edit().putBoolean(KEY_OFFLINE_MAP, enabled).apply();
    }

    public boolean isOfflineMapEnabled() {
        return prefs.getBoolean(KEY_OFFLINE_MAP, false);
    }

    public void setGpsPrecisionEnabled(boolean enabled) {
        prefs.edit().putBoolean(KEY_GPS_PRECISION, enabled).apply();
    }

    public boolean isGpsPrecisionEnabled() {
        return prefs.getBoolean(KEY_GPS_PRECISION, true);
    }

    public void saveRouteData(String routeId, int totalStops) {
        prefs.edit()
             .putString(KEY_ROUTE_ID, routeId)
             .putInt(KEY_TOTAL_STOPS, totalStops)
             .apply();
    }

    public String getRouteId() {
        return prefs.getString(KEY_ROUTE_ID, "ROUTE_QD1_001");
    }

    public void saveDriverInfo(String id, String name) {
        prefs.edit()
             .putString(KEY_DRIVER_ID, id)
             .putString(KEY_DRIVER_NAME, name)
             .apply();
    }

    public String getDriverName() {
        return prefs.getString(KEY_DRIVER_NAME, "Nguyễn Văn Tuấn");
    }

    public String getDriverId() {
        return prefs.getString(KEY_DRIVER_ID, "WM-88291-MS");
    }
}
