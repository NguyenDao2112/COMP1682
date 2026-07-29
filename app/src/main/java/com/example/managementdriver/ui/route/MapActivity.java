package com.example.managementdriver.ui.route;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.graphics.Paint;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import com.bumptech.glide.Glide;
import com.bumptech.glide.load.engine.DiskCacheStrategy;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.preference.PreferenceManager;

import com.example.managementdriver.R;
import com.example.managementdriver.database.AppDatabase;
import com.example.managementdriver.database.BinEntity;
import com.example.managementdriver.models.BinCollection;
import com.example.managementdriver.models.RouteResponse;
import com.example.managementdriver.network.ApiClient;
import com.example.managementdriver.ui.collection.CollectionActivity;
import com.example.managementdriver.ui.login.LoginActivity;
import com.example.managementdriver.utils.NetworkUtils;
import com.example.managementdriver.utils.PrefsManager;
import com.google.android.material.progressindicator.LinearProgressIndicator;

import org.osmdroid.api.IMapController;
import org.osmdroid.config.Configuration;
import org.osmdroid.tileprovider.tilesource.TileSourceFactory;
import org.osmdroid.util.BoundingBox;
import org.osmdroid.util.GeoPoint;
import org.osmdroid.views.MapView;
import org.osmdroid.views.overlay.Marker;
import org.osmdroid.views.overlay.Polyline;
import org.osmdroid.views.overlay.mylocation.GpsMyLocationProvider;
import org.osmdroid.views.overlay.mylocation.MyLocationNewOverlay;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class MapActivity extends AppCompatActivity {

    private MapView map = null;
    private IMapController mapController;
    private MyLocationNewOverlay locationOverlay;
    private PrefsManager prefsManager;
    private List<BinCollection> binList = new ArrayList<>();
    private BinAdapter adapter;
    private SwipeRefreshLayout swipeRefresh;
    private String currentRouteId;
    private BinCollection selectedBin = null;
    
    private LinearProgressIndicator routeProgressBar;
    private TextView tvOnlineStatus;
    private View vOnlineDot;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        Configuration.getInstance().setUserAgentValue("Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36");
        Configuration.getInstance().load(this, PreferenceManager.getDefaultSharedPreferences(this));
        Configuration.getInstance().setTileFileSystemCacheMaxBytes(500L * 1024 * 1024);
        
        setTheme(R.style.Theme_ManagementDriver);
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_map);

        prefsManager = new PrefsManager(this);
        currentRouteId = prefsManager.getRouteId();

        routeProgressBar = findViewById(R.id.routeProgressBar);
        tvOnlineStatus = findViewById(R.id.tvOnlineStatus);
        vOnlineDot = findViewById(R.id.vOnlineDot);
        swipeRefresh = findViewById(R.id.swipeRefresh);
        ((TextView)findViewById(R.id.tvDriverNameOnMap)).setText(prefsManager.getDriverName());



        map = findViewById(R.id.map);
        map.setTileSource(new org.osmdroid.tileprovider.tilesource.OnlineTileSourceBase(
            "EsriWorldStreetMap",
            0, 19, 256, ".png",
            new String[] { "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/" }
        ) {
            @Override
            public String getTileURLString(final long pMapTileIndex) {
                return getBaseUrl() + org.osmdroid.util.MapTileIndex.getZoom(pMapTileIndex) + "/"
                        + org.osmdroid.util.MapTileIndex.getY(pMapTileIndex) + "/"
                        + org.osmdroid.util.MapTileIndex.getX(pMapTileIndex);
            }
        });
        map.setMultiTouchControls(true);
        map.setBuiltInZoomControls(false);
        map.setTilesScaledToDpi(true);
        map.setUseDataConnection(true); 
        
        mapController = map.getController();
        mapController.setZoom(16.0);
        mapController.setCenter(new GeoPoint(16.0544, 108.2022));

        final RecyclerView rvStops = findViewById(R.id.rvRouteStops);
        rvStops.setLayoutManager(new LinearLayoutManager(this));
        adapter = new BinAdapter(binList, this::openCollectionScreen);
        rvStops.setAdapter(adapter);

        if (swipeRefresh != null) {
            swipeRefresh.setOnRefreshListener(this::fetchFleetOperationsData);
        }

        findViewById(R.id.btnBack).setOnClickListener(v -> finish());
        findViewById(R.id.navRoute).setOnClickListener(v -> focusOnRoute());
        findViewById(R.id.navActivity).setOnClickListener(v -> {
            startActivity(new Intent(this, LogsActivity.class));
            finish();
        });
        findViewById(R.id.navStatus).setOnClickListener(v -> {
            startActivity(new Intent(this, StatusActivity.class));
            finish();
        });
        findViewById(R.id.navProfile).setOnClickListener(v -> {
            startActivity(new Intent(this, ProfileActivity.class));
            finish();
        });
        findViewById(R.id.fabRecenter).setOnClickListener(v -> focusOnRoute());

        findViewById(R.id.btnNavigate).setOnClickListener(v -> {
            BinCollection target = selectedBin != null ? selectedBin : findNextPending();
            if (target != null) {
                openCollectionScreen(target);
            } else {
                completeRoute();
            }
        });

        checkPermissions();
        fetchFleetOperationsData();
        observeNetwork();

        // Dynamic Bottom Sheet Behavior Callback and Scroll Listener to resolve gesture conflicts
        final View bottomSheetView = findViewById(R.id.bottomSheet);
        if (bottomSheetView != null && rvStops != null) {
            final com.google.android.material.bottomsheet.BottomSheetBehavior<View> behavior = 
                com.google.android.material.bottomsheet.BottomSheetBehavior.from(bottomSheetView);
            
            // 1. Scroll listener on RecyclerView to lock/unlock dragging when expanded
            rvStops.addOnScrollListener(new RecyclerView.OnScrollListener() {
                @Override
                public void onScrolled(@androidx.annotation.NonNull RecyclerView recyclerView, int dx, int dy) {
                    super.onScrolled(recyclerView, dx, dy);
                    if (behavior.getState() == com.google.android.material.bottomsheet.BottomSheetBehavior.STATE_EXPANDED) {
                        // Disable dragging of BottomSheet ONLY if RecyclerView can scroll up (user isn't at the top of the list)
                        boolean canScrollUp = recyclerView.canScrollVertically(-1);
                        behavior.setDraggable(!canScrollUp);
                    } else {
                        // Always allow dragging if collapsed/dragging
                        behavior.setDraggable(true);
                    }
                }
            });

            // 2. State listener on BottomSheet to update drag locks and SwipeRefresh activation
            behavior.addBottomSheetCallback(new com.google.android.material.bottomsheet.BottomSheetBehavior.BottomSheetCallback() {
                @Override
                public void onStateChanged(@androidx.annotation.NonNull View bottomSheet, int newState) {
                    if (swipeRefresh != null) {
                        // Enable SwipeRefreshLayout ONLY when fully expanded so it doesn't intercept panel dragging
                        swipeRefresh.setEnabled(newState == com.google.android.material.bottomsheet.BottomSheetBehavior.STATE_EXPANDED);
                    }
                    if (newState == com.google.android.material.bottomsheet.BottomSheetBehavior.STATE_EXPANDED) {
                        boolean canScrollUp = rvStops.canScrollVertically(-1);
                        behavior.setDraggable(!canScrollUp);
                    } else {
                        behavior.setDraggable(true);
                    }
                }

                @Override
                public void onSlide(@androidx.annotation.NonNull View bottomSheet, float slideOffset) {
                    // No-op
                }
            });

            // Set initial state
            if (swipeRefresh != null) {
                swipeRefresh.setEnabled(behavior.getState() == com.google.android.material.bottomsheet.BottomSheetBehavior.STATE_EXPANDED);
            }
        }
    }

    private void openCollectionScreen(BinCollection bin) {
        Intent intent = new Intent(this, CollectionActivity.class);
        intent.putExtra("bin_id", bin.getBin_id());
        intent.putExtra("id", bin.getId());
        intent.putExtra("route_id", currentRouteId);
        intent.putExtra("location_name", bin.getLocation_name());
        startActivity(intent);
    }

    private void fetchFleetOperationsData() {
        String token = "Bearer " + prefsManager.getToken();
        
        new Thread(() -> {
            List<BinEntity> entities = AppDatabase.getInstance(this).binDao().getAllBins();
            if (!entities.isEmpty()) {
                final List<BinCollection> offlineItems = new ArrayList<>();
                for (BinEntity e : entities) {
                    offlineItems.add(new BinCollection(e.binId, e.locationName, e.latitude, e.longitude, e.fillLevel, e.binType, e.zone, e.stopNumber, e.collectionStatus));
                }
                runOnUiThread(() -> {
                    binList.clear();
                    binList.addAll(offlineItems);
                    adapter.notifyDataSetChanged();
                    updateCommandCenterUI(null); 
                    addFleetMarkers();
                    focusOnRoute();
                });
            }
        }).start();

        ApiClient.getApiService().getCollectionSequence(token).enqueue(new Callback<RouteResponse>() {
            @Override
            public void onResponse(Call<RouteResponse> call, Response<RouteResponse> response) {
                if (swipeRefresh != null) swipeRefresh.setRefreshing(false);
                if (response.isSuccessful() && response.body() != null) {
                    processFleetResponse(response.body());
                } else if (response.code() == 401) {
                    runOnUiThread(() -> {
                        Toast.makeText(MapActivity.this, "Session Expired. Please login again.", Toast.LENGTH_LONG).show();
                        redirectToLogin();
                    });
                }
            }
            @Override public void onFailure(Call<RouteResponse> call, Throwable t) {
                if (swipeRefresh != null) swipeRefresh.setRefreshing(false);
            }
        });
    }

    private void processFleetResponse(RouteResponse data) {
        List<BinCollection> bins = data.getRoute();
        if (bins != null) {
            binList.clear();
            binList.addAll(bins);
            runOnUiThread(() -> {
                adapter.notifyDataSetChanged();
                updateCommandCenterUI(data);
                addFleetMarkers();
                focusOnRoute();
            });
        }
    }

    private android.graphics.drawable.Drawable createMarkerIcon(int stopNumber, boolean isDone, boolean isNext) {
        int size = 96; // 96px is about 32dp
        android.graphics.Bitmap bitmap = android.graphics.Bitmap.createBitmap(size, size, android.graphics.Bitmap.Config.ARGB_8888);
        android.graphics.Canvas canvas = new android.graphics.Canvas(bitmap);
        
        android.graphics.Paint paint = new android.graphics.Paint();
        paint.setAntiAlias(true);
        
        // 1. Draw Shadow
        paint.setColor(Color.parseColor("#40000000"));
        canvas.drawCircle(size / 2f, size / 2f + 4, size / 2.5f, paint);
        
        // 2. Draw Outer Circle (Border)
        paint.setColor(Color.WHITE);
        canvas.drawCircle(size / 2f, size / 2f, size / 2.5f, paint);
        
        // 3. Draw Inner Circle (Background)
        int color;
        if (isDone) {
            color = Color.parseColor("#94A3B8"); // Muted slate gray
        } else if (isNext) {
            color = Color.parseColor("#FF9100"); // Vibrant warning orange
        } else {
            color = Color.parseColor("#10B981"); // Emerald green
        }
        paint.setColor(color);
        canvas.drawCircle(size / 2f, size / 2f, size / 2.8f, paint);
        
        // 4. Draw Stop Number Text
        paint.setColor(Color.WHITE);
        paint.setTextSize(32f);
        paint.setTypeface(android.graphics.Typeface.create(android.graphics.Typeface.DEFAULT, android.graphics.Typeface.BOLD));
        paint.setTextAlign(android.graphics.Paint.Align.CENTER);
        
        android.graphics.Rect bounds = new android.graphics.Rect();
        String text = String.valueOf(stopNumber);
        paint.getTextBounds(text, 0, text.length(), bounds);
        float y = (size / 2f) - bounds.exactCenterY();
        
        canvas.drawText(text, size / 2f, y, paint);
        
        return new android.graphics.drawable.BitmapDrawable(getResources(), bitmap);
    }

    private void addFleetMarkers() {
        if (map == null) return;
        map.getOverlays().clear();
        if (locationOverlay != null) map.getOverlays().add(locationOverlay);
        if (binList.isEmpty()) {
            map.invalidate();
            return;
        }

        int nextIndex = -1;
        for (int i = 0; i < binList.size(); i++) {
            String s = binList.get(i).getCollectionStatus();
            if (s == null || !(s.equalsIgnoreCase("collected") || s.equalsIgnoreCase("done") || s.equalsIgnoreCase("completed"))) {
                nextIndex = i;
                break;
            }
        }

        for (int i = 0; i < binList.size(); i++) {
            BinCollection bin = binList.get(i);
            if (Math.abs(bin.getLatitude()) < 0.1) continue;

            GeoPoint pos = new GeoPoint(bin.getLatitude(), bin.getLongitude());

            Marker marker = new Marker(map);
            marker.setPosition(pos);
            
            String s = bin.getCollectionStatus();
            boolean isDone = s != null && (s.equalsIgnoreCase("collected") || s.equalsIgnoreCase("done") || s.equalsIgnoreCase("completed"));
            final int stopIndex = i + 1;
            
            marker.setIcon(createMarkerIcon(stopIndex, isDone, i == nextIndex));
            marker.setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_CENTER);

            final BinCollection finalBin = bin;
            marker.setOnMarkerClickListener((m, mapView) -> {
                selectedBin = finalBin;
                map.getController().animateTo(m.getPosition());
                
                TextView tvNextStopAddress = findViewById(R.id.tvNextStopAddress);
                if (tvNextStopAddress != null) {
                    tvNextStopAddress.setText(finalBin.getLocation_name());
                }
                
                TextView tvETA = findViewById(R.id.tvETA);
                if (tvETA != null) {
                    int etaMin = 8 + (stopIndex * 4);
                    tvETA.setText(String.valueOf(etaMin));
                }
                
                TextView tvDriverNameOnMap = findViewById(R.id.tvDriverNameOnMap);
                if (tvDriverNameOnMap != null) {
                    tvDriverNameOnMap.setText("STOP #" + String.format(Locale.getDefault(), "%02d", stopIndex));
                    tvDriverNameOnMap.setTextColor(Color.WHITE);
                }

                com.google.android.material.button.MaterialButton btnNavigate = findViewById(R.id.btnNavigate);
                if (btnNavigate != null) {
                    btnNavigate.setText("START STOP #" + String.format(Locale.getDefault(), "%02d", stopIndex) + " COLLECTION");
                }
                
                RecyclerView rv = findViewById(R.id.rvRouteStops);
                if (rv != null) {
                    rv.smoothScrollToPosition(stopIndex - 1);
                }
                return true;
            });

            map.getOverlays().add(marker);
        }

        // Fetch actual road network routing between stops
        fetchRoadRoute(binList, nextIndex);
    }

    private void fetchRoadRoute(List<BinCollection> bins, int nextIndex) {
        if (bins.size() < 2) return;
        
        StringBuilder sb = new StringBuilder();
        List<BinCollection> validBins = new ArrayList<>();
        for (BinCollection b : bins) {
            if (Math.abs(b.getLatitude()) > 0.1) {
                validBins.add(b);
            }
        }
        
        if (validBins.size() < 2) return;
        
        for (int i = 0; i < validBins.size(); i++) {
            BinCollection b = validBins.get(i);
            sb.append(b.getLongitude()).append(",").append(b.getLatitude());
            if (i < validBins.size() - 1) {
                sb.append(";");
            }
        }
        
        // OSRM routing request for actual driving road network path with turn-by-turn steps
        String urlString = "https://router.project-osrm.org/route/v1/driving/" + sb.toString() + "?overview=full&geometries=geojson&steps=true";
        
        new Thread(() -> {
            try {
                java.net.URL url = new java.net.URL(urlString);
                java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
                conn.setRequestMethod("GET");
                conn.setConnectTimeout(10000);
                conn.setReadTimeout(10000);
                // OSRM Community server strictly requires a User-Agent header, otherwise it returns HTTP 403 Forbidden
                conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36");
                
                int responseCode = conn.getResponseCode();
                android.util.Log.d("OSRM_ROUTING", "OSRM Request URL: " + urlString);
                android.util.Log.d("OSRM_ROUTING", "OSRM Response Code: " + responseCode);
                
                if (responseCode == 200) {
                    java.io.InputStream is = conn.getInputStream();
                    java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.InputStreamReader(is));
                    StringBuilder response = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) {
                        response.append(line);
                    }
                    reader.close();
                    
                    parseAndDrawOSRMRoute(response.toString(), nextIndex);
                } else {
                    runOnUiThread(this::drawStraightLines);
                }
            } catch (Exception e) {
                android.util.Log.e("OSRM_ROUTING", "Error fetching road route", e);
                runOnUiThread(this::drawStraightLines);
            }
        }).start();
    }

    private void parseAndDrawOSRMRoute(String jsonResponse, int nextIndex) {
        try {
            org.json.JSONObject json = new org.json.JSONObject(jsonResponse);
            org.json.JSONArray routes = json.getJSONArray("routes");
            if (routes.length() > 0) {
                org.json.JSONObject route = routes.getJSONObject(0);
                org.json.JSONObject geometry = route.getJSONObject("geometry");
                org.json.JSONArray coordinates = geometry.getJSONArray("coordinates");
                
                List<GeoPoint> roadPoints = new ArrayList<>();
                for (int i = 0; i < coordinates.length(); i++) {
                    org.json.JSONArray coord = coordinates.getJSONArray(i);
                    double lon = coord.getDouble(0);
                    double lat = coord.getDouble(1);
                    roadPoints.add(new GeoPoint(lat, lon));
                }
                
                // Parse turn-by-turn navigation maneuver step
                String navText = "Follow route to next stop";
                String navIcon = "⬆";
                
                org.json.JSONArray legs = route.optJSONArray("legs");
                int currentLegIndex = (nextIndex > 0) ? nextIndex - 1 : 0;
                if (legs != null && currentLegIndex < legs.length()) {
                    org.json.JSONObject leg = legs.getJSONObject(currentLegIndex);
                    org.json.JSONArray steps = leg.optJSONArray("steps");
                    if (steps != null && steps.length() > 0) {
                        org.json.JSONObject step = steps.getJSONObject(0);
                        if (steps.length() > 1 && step.optString("name").isEmpty()) {
                            step = steps.getJSONObject(1);
                        }
                        
                        org.json.JSONObject maneuver = step.optJSONObject("maneuver");
                        String modifier = maneuver != null ? maneuver.optString("modifier") : "";
                        String type = maneuver != null ? maneuver.optString("type") : "";
                        String streetName = step.optString("name");
                        double distance = step.optDouble("distance", 0);
                        
                        // Select icon
                        if (modifier.contains("left")) {
                            navIcon = "⬏";
                        } else if (modifier.contains("right")) {
                            navIcon = "⬎";
                        } else if (type.contains("arrive")) {
                            navIcon = "📍";
                        } else {
                            navIcon = "⬆";
                        }
                        
                        // Build instruction string
                        if (type.contains("arrive")) {
                            navText = "Arriving at stop #" + String.format(Locale.getDefault(), "%02d", nextIndex + 1);
                        } else {
                            String streetText = streetName.isEmpty() ? "next street" : streetName;
                            String action = "Go straight";
                            if (modifier.contains("left")) action = "Turn left";
                            else if (modifier.contains("right")) action = "Turn right";
                            
                            if (distance > 0) {
                                if (distance >= 1000) {
                                    navText = String.format(Locale.getDefault(), "%s onto %s (%.1f km)", action, streetText, distance / 1000.0);
                                } else {
                                    navText = String.format(Locale.getDefault(), "%s onto %s (%d m)", action, streetText, (int) distance);
                                }
                            } else {
                                navText = String.format(Locale.getDefault(), "%s onto %s", action, streetText);
                            }
                        }
                    }
                }
                
                final String finalNavText = navText;
                final String finalNavIcon = navIcon;
                
                runOnUiThread(() -> {
                    drawOSRMPathOnMap(roadPoints);
                    
                    // Update turn-by-turn banner
                    TextView tvManeuverIcon = findViewById(R.id.tvManeuverIcon);
                    TextView tvManeuverText = findViewById(R.id.tvManeuverText);
                    if (tvManeuverIcon != null) {
                        tvManeuverIcon.setText(finalNavIcon);
                    }
                    if (tvManeuverText != null) {
                        tvManeuverText.setText(finalNavText);
                    }
                });
            } else {
                runOnUiThread(this::drawStraightLines);
            }
        } catch (Exception e) {
            e.printStackTrace();
            runOnUiThread(this::drawStraightLines);
        }
    }

    private void drawOSRMPathOnMap(List<GeoPoint> roadPoints) {
        if (map == null) return;
        
        // Remove existing straight Polylines
        List<org.osmdroid.views.overlay.Overlay> overlays = map.getOverlays();
        List<org.osmdroid.views.overlay.Overlay> toRemove = new ArrayList<>();
        for (org.osmdroid.views.overlay.Overlay o : overlays) {
            if (o instanceof Polyline) {
                toRemove.add(o);
            }
        }
        overlays.removeAll(toRemove);
        
        Polyline remainingPath = new Polyline();
        remainingPath.getOutlinePaint().setColor(Color.parseColor("#10B981")); // Emerald Green road path
        remainingPath.getOutlinePaint().setStrokeWidth(12f);
        remainingPath.setPoints(roadPoints);
        
        // Insert polyline under the markers
        map.getOverlays().add(0, remainingPath);
        map.invalidate();
    }

    private void drawStraightLines() {
        if (map == null) return;
        
        List<org.osmdroid.views.overlay.Overlay> overlays = map.getOverlays();
        List<org.osmdroid.views.overlay.Overlay> toRemove = new ArrayList<>();
        for (org.osmdroid.views.overlay.Overlay o : overlays) {
            if (o instanceof Polyline) {
                toRemove.add(o);
            }
        }
        overlays.removeAll(toRemove);
        
        Polyline remainingPath = new Polyline();
        remainingPath.getOutlinePaint().setColor(Color.parseColor("#10B981"));
        remainingPath.getOutlinePaint().setStrokeWidth(12f);
        
        for (BinCollection b : binList) {
            if (Math.abs(b.getLatitude()) > 0.1) {
                remainingPath.addPoint(new GeoPoint(b.getLatitude(), b.getLongitude()));
            }
        }
        
        map.getOverlays().add(0, remainingPath);
        map.invalidate();
    }

    private void focusOnRoute() {
        List<GeoPoint> points = new ArrayList<>();
        for (BinCollection b : binList) if (Math.abs(b.getLatitude()) > 0.1) points.add(new GeoPoint(b.getLatitude(), b.getLongitude()));
        if (!points.isEmpty()) {
            if (locationOverlay != null) locationOverlay.disableFollowLocation();
            map.postDelayed(() -> {
                try {
                    map.zoomToBoundingBox(BoundingBox.fromGeoPoints(points).increaseByScale(1.4f), true);
                    if (map.getZoomLevelDouble() > 18) mapController.setZoom(16.0);
                } catch (Exception ignored) {}
            }, 500);
        }
    }

    private BinCollection findNextPending() {
        for (BinCollection bin : binList) {
            String s = bin.getCollectionStatus();
            if (s == null || !(s.equalsIgnoreCase("collected") || s.equalsIgnoreCase("done") || s.equalsIgnoreCase("completed"))) {
                return bin;
            }
        }
        return null;
    }

    private void updateCommandCenterUI(RouteResponse data) {
        int total = binList.size();
        int completed = 0;
        for (BinCollection b : binList) {
            String s = b.getCollectionStatus();
            if (s != null && (s.equalsIgnoreCase("collected") || s.equalsIgnoreCase("done") || s.equalsIgnoreCase("completed"))) {
                completed++;
            }
        }
        int remaining = total - completed;

        if (data != null) {
            ((TextView)findViewById(R.id.tvHeaderRouteId)).setText(data.getRouteId());
            ((TextView)findViewById(R.id.tvDistrictName)).setText(data.getDistrict() != null ? data.getDistrict() : "Work Zone");
        } else {
            ((TextView)findViewById(R.id.tvHeaderRouteId)).setText(currentRouteId);
        }
        
        ((TextView)findViewById(R.id.tvRouteSubtitle)).setText(remaining + " STOPS LEFT");
        
        if (routeProgressBar != null) {
            int progress = (int) ((float) completed / (total == 0 ? 1 : total) * 100);
            routeProgressBar.setProgress(progress);
        }

        BinCollection next = findNextPending();
        com.google.android.material.button.MaterialButton btnNavigate = findViewById(R.id.btnNavigate);
        if (total == 0) {
            ((TextView)findViewById(R.id.tvNextStopAddress)).setText("No active route assigned");
            if (btnNavigate != null) {
                btnNavigate.setText("WAITING FOR ROUTE");
                btnNavigate.setBackgroundColor(Color.parseColor("#94A3B8")); // Slate grey
                btnNavigate.setTextColor(Color.WHITE);
                btnNavigate.setEnabled(false);
            }
        } else if (next != null) {
            ((TextView)findViewById(R.id.tvNextStopAddress)).setText(next.getLocation_name());
            int nextIdx = -1;
            for (int i = 0; i < binList.size(); i++) {
                if (binList.get(i).getBin_id().equals(next.getBin_id())) {
                    nextIdx = i;
                    break;
                }
            }
            if (btnNavigate != null && nextIdx != -1) {
                btnNavigate.setText("START STOP #" + String.format(Locale.getDefault(), "%02d", nextIdx + 1) + " COLLECTION");
                btnNavigate.setBackgroundColor(ContextCompat.getColor(this, R.color.color_primary_green));
                btnNavigate.setTextColor(Color.parseColor("#1E293B"));
                btnNavigate.setEnabled(true);
            }
        } else {
            ((TextView)findViewById(R.id.tvNextStopAddress)).setText("All stops collected!");
            if (btnNavigate != null) {
                btnNavigate.setText("COMPLETE ROUTE");
                btnNavigate.setBackgroundColor(Color.parseColor("#EF4444")); // Red warning color
                btnNavigate.setTextColor(Color.WHITE);
                btnNavigate.setEnabled(true);
            }
        }
        
        int nextIdx = -1;
        for (int i = 0; i < binList.size(); i++) {
            String s = binList.get(i).getCollectionStatus();
            if (s == null || !(s.equalsIgnoreCase("collected") || s.equalsIgnoreCase("done") || s.equalsIgnoreCase("completed"))) {
                nextIdx = i;
                break;
            }
        }
        if (nextIdx != -1) {
            final int pos = nextIdx;
            RecyclerView rv = findViewById(R.id.rvRouteStops);
            if (rv != null) rv.postDelayed(() -> rv.smoothScrollToPosition(pos), 500);
        }
    }

    private void observeNetwork() {
        NetworkUtils.observeNetworkStatus(this, new NetworkUtils.NetworkStatusListener() {
            @Override public void onNetworkAvailable() { runOnUiThread(() -> { tvOnlineStatus.setText("SYSTEM ONLINE"); tvOnlineStatus.setTextColor(ContextCompat.getColor(MapActivity.this, R.color.color_primary_green)); vOnlineDot.setBackgroundResource(R.drawable.bg_pulse_dot); }); }
            @Override public void onNetworkLost() { runOnUiThread(() -> { tvOnlineStatus.setText("SYSTEM OFFLINE"); tvOnlineStatus.setTextColor(ContextCompat.getColor(MapActivity.this, R.color.color_status_alert)); vOnlineDot.setBackgroundColor(ContextCompat.getColor(MapActivity.this, R.color.color_status_alert)); }); }
        });
    }

    private void checkPermissions() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.ACCESS_FINE_LOCATION}, 1);
        else setupLocationOverlay();
    }

    private void setupLocationOverlay() {
        locationOverlay = new MyLocationNewOverlay(new GpsMyLocationProvider(this), map);
        locationOverlay.enableMyLocation();
        locationOverlay.disableFollowLocation();
        map.getOverlays().add(locationOverlay);
    }

    @Override 
    public void onResume() { 
        super.onResume(); 
        if (map != null) map.onResume(); 
        fetchFleetOperationsData();
    }
    @Override public void onPause() { super.onPause(); if (map != null) map.onPause(); }

    private void completeRoute() {
        String token = "Bearer " + prefsManager.getToken();
        ApiClient.getApiService().completeRoute(token).enqueue(new Callback<Void>() {
            @Override
            public void onResponse(Call<Void> call, Response<Void> response) {
                if (response.isSuccessful()) {
                    Toast.makeText(MapActivity.this, "Route Completed! Shift Status Reset.", Toast.LENGTH_LONG).show();
                    prefsManager.saveRouteData(null, 0);
                    new Thread(() -> {
                        runOnUiThread(() -> {
                            binList.clear();
                            finish();
                        });
                    }).start();
                } else {
                    Toast.makeText(MapActivity.this, "Failed to complete route: " + response.code(), Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<Void> call, Throwable t) {
                Toast.makeText(MapActivity.this, "Network error: " + t.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void redirectToLogin() {
        prefsManager.saveToken(null);
        Intent intent = new Intent(this, LoginActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        finish();
    }
}
