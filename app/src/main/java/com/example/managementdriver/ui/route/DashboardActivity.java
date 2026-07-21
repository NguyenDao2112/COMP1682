package com.example.managementdriver.ui.route;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.view.animation.Animation;
import android.view.animation.AnimationUtils;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import com.bumptech.glide.Glide;
import com.bumptech.glide.load.engine.DiskCacheStrategy;
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

import java.util.ArrayList;
import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class DashboardActivity extends AppCompatActivity {

    private View btnStartShift;
    private View btnViewMap;
    private TextView tvTotalStops, tvRouteId;
    private TextView tvStartLabel;
    private RecyclerView rvBins;
    private BinAdapter adapter;
    private SwipeRefreshLayout swipeRefresh;
    private List<BinCollection> binList = new ArrayList<>();
    private PrefsManager prefsManager;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        setTheme(R.style.Theme_ManagementDriver);
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_dashboard);

        prefsManager = new PrefsManager(this);
        btnStartShift = findViewById(R.id.btnStartShift);
        tvStartLabel = findViewById(R.id.tvStartLabel);
        btnViewMap = findViewById(R.id.btnViewMap);
        tvTotalStops = findViewById(R.id.tvTotalStops);
        tvRouteId = findViewById(R.id.tvRouteId);
        rvBins = findViewById(R.id.rvBins);
        swipeRefresh = findViewById(R.id.swipeRefresh);

        // Load Avatar
        ImageView ivAvatar = findViewById(R.id.ivDashAvatar);
        Glide.with(this)
                .load("https://images.unsplash.com/photo-1633332755192-727a05c4013d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80")
                .placeholder(R.drawable.ic_driver_avatar)
                .diskCacheStrategy(DiskCacheStrategy.ALL)
                .circleCrop()
                .into(ivAvatar);
        
        ivAvatar.setOnClickListener(v -> startActivity(new Intent(this, ProfileActivity.class)));

        TextView tvHeader = findViewById(R.id.tvHeader);
        if (tvHeader != null) {
            tvHeader.setText("Hi, " + prefsManager.getDriverName());
        }

        rvBins.setLayoutManager(new LinearLayoutManager(this));
        adapter = new BinAdapter(binList, bin -> {
            Intent intent = new Intent(this, CollectionActivity.class);
            intent.putExtra("bin_id", bin.getBin_id());
            intent.putExtra("id", bin.getId());
            intent.putExtra("location_name", bin.getLocation_name());
            intent.putExtra("route_id", prefsManager.getRouteId());
            startActivity(intent);
        });
        rvBins.setAdapter(adapter);

        swipeRefresh.setOnRefreshListener(() -> syncData(false));

        syncData(false);

        btnStartShift.setOnClickListener(v -> {
            if (tvStartLabel != null && "COMPLETE ROUTE".equals(tvStartLabel.getText().toString())) {
                completeRoute();
            } else {
                startShift();
            }
        });
        
        View.OnClickListener openMapListener = v -> {
            startActivity(new Intent(this, MapActivity.class));
        };
        btnViewMap.setOnClickListener(openMapListener);
        findViewById(R.id.cvOperationalPulse).setOnClickListener(openMapListener);
        findViewById(R.id.navRoute).setOnClickListener(openMapListener);
        findViewById(R.id.navActivity).setOnClickListener(v -> startActivity(new Intent(this, LogsActivity.class)));
        findViewById(R.id.navStatus).setOnClickListener(v -> startActivity(new Intent(this, StatusActivity.class)));
        findViewById(R.id.navProfile).setOnClickListener(v -> startActivity(new Intent(this, ProfileActivity.class)));

        Animation pulse = AnimationUtils.loadAnimation(this, R.anim.pulse);
        if (btnStartShift != null) btnStartShift.startAnimation(pulse);

        observeNetwork();
    }

    @Override
    protected void onResume() {
        super.onResume();
        syncData(false);
    }

    private void observeNetwork() {
        TextView tvOnline = findViewById(R.id.tvOnlineStatus);
        View vOnlineDot = findViewById(R.id.vOnlineDot);
        NetworkUtils.observeNetworkStatus(this, new NetworkUtils.NetworkStatusListener() {
            @Override public void onNetworkAvailable() {
                runOnUiThread(() -> {
                    if (tvOnline != null) {
                        tvOnline.setText("ONLINE");
                        tvOnline.setTextColor(ContextCompat.getColor(DashboardActivity.this, R.color.color_primary_green));
                    }
                    if (vOnlineDot != null) vOnlineDot.setBackgroundResource(R.drawable.bg_pulse_dot);
                });
                // Tự động đồng bộ ngầm ngay khi có mạng trở lại
                syncData(false);
            }
            @Override public void onNetworkLost() {
                runOnUiThread(() -> {
                    if (tvOnline != null) {
                        tvOnline.setText("OFFLINE");
                        tvOnline.setTextColor(ContextCompat.getColor(DashboardActivity.this, R.color.color_status_alert));
                    }
                    if (vOnlineDot != null) vOnlineDot.setBackgroundColor(ContextCompat.getColor(DashboardActivity.this, R.color.color_status_alert));
                });
            }
        });
    }

    private void startShift() {
        String token = "Bearer " + prefsManager.getToken();
        ApiClient.getApiService().updateDriverStatus(token, "On Duty").enqueue(new Callback<Void>() {
            @Override public void onResponse(Call<Void> call, Response<Void> response) {
                syncData(true);
            }
            @Override public void onFailure(Call<Void> call, Throwable t) { 
                syncData(true); 
            }
        });
    }

    private void syncData(boolean navigateToMap) {
        String token = "Bearer " + prefsManager.getToken();
        String routeId = prefsManager.getRouteId();
        
        // 1. Nạp dữ liệu Offline ngay lập tức
        new Thread(() -> {
            List<BinEntity> offlineBins = AppDatabase.getInstance(this).binDao().getAllBins();
            if (!offlineBins.isEmpty()) {
                final List<BinCollection> converted = new ArrayList<>();
                for (BinEntity e : offlineBins) {
                    BinCollection b = new BinCollection(e.binId, e.locationName, e.latitude, e.longitude, e.fillLevel, e.binType, e.zone, e.stopNumber, e.collectionStatus);
                    b.setId(e.databaseId);
                    converted.add(b);
                }
                runOnUiThread(() -> {
                    // Cập nhật danh sách từ cache để hiện lên ngay
                    binList.clear();
                    binList.addAll(converted);
                    updateUI(null); 
                });
            }

            // 2. Chạy tiến trình đồng bộ dữ liệu Offline lên Server (nếu có)
            AppDatabase db = AppDatabase.getInstance(this);
            List<BinEntity> unsynced = db.binDao().getUnsyncedBins();
            if (!unsynced.isEmpty()) {
                Log.d("SYNC", "Found " + unsynced.size() + " unsynced bins offline. Uploading...");
                for (BinEntity bin : unsynced) {
                    String idToSync = (bin.databaseId != null && !bin.databaseId.isEmpty()) ? bin.databaseId : bin.binId;
                    try {
                        retrofit2.Response<Void> res = ApiClient.getApiService().collectBin(token, idToSync).execute();
                        if (res.isSuccessful()) {
                            db.binDao().markSynced(bin.binId);
                            Log.d("SYNC", "Successfully synced bin: " + bin.binId);
                        } else {
                            Log.e("SYNC", "Failed to sync bin " + bin.binId + ", response: " + res.code());
                        }
                    } catch (Exception e) {
                        Log.e("SYNC", "Network error syncing bin: " + bin.binId, e);
                    }
                }
            }
            
            // 3. Tải danh sách mới nhất từ Server về
            fetchServerSequence(token, routeId, navigateToMap);
        }).start();
    }

    private void fetchServerSequence(String token, String routeId, boolean navigateToMap) {
        ApiClient.getApiService().getCollectionSequence(token).enqueue(new Callback<RouteResponse>() {
            @Override
            public void onResponse(Call<RouteResponse> call, Response<RouteResponse> response) {
                if (swipeRefresh != null) swipeRefresh.setRefreshing(false);
                if (response.isSuccessful() && response.body() != null) {
                    String currentStatus = response.body().getStatus();
                    List<BinCollection> bins = response.body().getRoute();
                    if (bins != null) {
                        if ("completed".equalsIgnoreCase(currentStatus)) {
                            bins.clear();
                        }
                        binList.clear();
                        binList.addAll(bins);
                        saveToLocalDb(bins);
                    }
                    runOnUiThread(() -> {
                        String routeIdDisplay = "completed".equalsIgnoreCase(currentStatus) ? "NO_ROUTE_ASSIGNED" : dataId(response.body(), routeId);
                        tvRouteId.setText(routeIdDisplay);
                        prefsManager.saveRouteData(routeIdDisplay, binList.size());
                        updateUI(currentStatus);
                        if (navigateToMap) startActivity(new Intent(DashboardActivity.this, MapActivity.class));
                    });
                } else {
                    if (response.code() == 401) {
                        runOnUiThread(() -> {
                            android.widget.Toast.makeText(DashboardActivity.this, "Session Expired. Please login again.", android.widget.Toast.LENGTH_LONG).show();
                            redirectToLogin();
                        });
                    } else if (navigateToMap) {
                        startActivity(new Intent(DashboardActivity.this, MapActivity.class));
                    }
                }
            }
            @Override public void onFailure(Call<RouteResponse> call, Throwable t) {
                runOnUiThread(() -> {
                    if (swipeRefresh != null) swipeRefresh.setRefreshing(false);
                    updateUI(null);
                    if (navigateToMap) startActivity(new Intent(DashboardActivity.this, MapActivity.class));
                });
            }
        });
    }

    private void saveToLocalDb(List<BinCollection> bins) {
        new Thread(() -> {
            AppDatabase db = AppDatabase.getInstance(this);
            if (bins == null || bins.isEmpty()) {
                // Route is completed or unassigned, clear local cache so old phantom stops don't show offline
                db.binDao().deleteAll();
                return;
            }
            List<BinEntity> entities = new ArrayList<>();
            for (BinCollection b : bins) {
                BinEntity local = db.binDao().getBinById(b.getBin_id());
                // If local bin exists and is unsynced, do NOT overwrite its collected status
                String status = b.getCollectionStatus();
                boolean synced = true;
                if (local != null && !local.isSynced) {
                    status = local.collectionStatus;
                    synced = false;
                }
                
                BinEntity entity = new BinEntity(b.getBin_id(), b.getId(), b.getLocation_name(), 
                    b.getLatitude(), b.getLongitude(), b.getFill_level(), 
                    b.getBinType(), b.getZone(), b.getStopNumber(), status);
                entity.isSynced = synced;
                entities.add(entity);
            }
            db.binDao().deleteAll();
            db.binDao().insertBins(entities);
        }).start();
    }

    private String dataId(RouteResponse body, String def) {
        return (body.getRouteId() != null && !body.getRouteId().isEmpty()) ? body.getRouteId() : "NO_ROUTE_ASSIGNED";
    }

    private void completeRoute() {
        String token = "Bearer " + prefsManager.getToken();
        ApiClient.getApiService().completeRoute(token).enqueue(new retrofit2.Callback<Void>() {
            @Override
            public void onResponse(retrofit2.Call<Void> call, retrofit2.Response<Void> response) {
                if (response.isSuccessful()) {
                    android.widget.Toast.makeText(DashboardActivity.this, "Route Completed! Shift Status Reset.", android.widget.Toast.LENGTH_LONG).show();
                    prefsManager.saveRouteData(null, 0);
                    new Thread(() -> {
                        runOnUiThread(() -> {
                            binList.clear();
                            syncData(false);
                        });
                    }).start();
                } else {
                    android.widget.Toast.makeText(DashboardActivity.this, "Failed to complete route: " + response.code(), android.widget.Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(retrofit2.Call<Void> call, Throwable t) {
                android.widget.Toast.makeText(DashboardActivity.this, "Network error: " + t.getMessage(), android.widget.Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void updateUI(String routeStatus) {
        int total = binList.size();
        int completed = 0;
        for (BinCollection b : binList) {
            String s = b.getCollectionStatus();
            if (s != null && (s.equalsIgnoreCase("collected") || s.equalsIgnoreCase("done") || s.equalsIgnoreCase("completed"))) {
                completed++;
            }
        }
        int remaining = total - completed;
        tvTotalStops.setText(remaining + " STOPS LEFT");
        
        TextView tvPulseTitle = findViewById(R.id.tvPulseTitle);
        TextView tvPulseDesc = findViewById(R.id.tvPulseDesc);
        if (completed > 0) {
            if (tvPulseTitle != null) tvPulseTitle.setText("SHIFT PROGRESS: " + completed + " COMPLETED");
            if (tvPulseDesc != null) tvPulseDesc.setText("You have " + remaining + " stops remaining. Keep up the pace!");
        } else {
            if (tvPulseTitle != null) tvPulseTitle.setText("Fleet Telemetry Active");
            if (tvPulseDesc != null) tvPulseDesc.setText("Real-time route optimization is enabled for your shift.");
        }

        if (tvStartLabel != null) {
            if (total == 0 || "completed".equalsIgnoreCase(routeStatus)) {
                tvStartLabel.setText("WAITING FOR ROUTE");
                tvStartLabel.setTextColor(ContextCompat.getColor(this, R.color.color_status_alert));
            } else if (remaining == 0) {
                tvStartLabel.setText("COMPLETE ROUTE");
                tvStartLabel.setTextColor(ContextCompat.getColor(this, R.color.color_status_alert));
            } else {
                tvStartLabel.setText("START SHIFT");
                tvStartLabel.setTextColor(ContextCompat.getColor(this, R.color.color_primary_green));
            }
        }
        
        adapter.notifyDataSetChanged();
    }

    private void redirectToLogin() {
        prefsManager.saveToken(null);
        Intent intent = new Intent(this, LoginActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        finish();
    }
}
