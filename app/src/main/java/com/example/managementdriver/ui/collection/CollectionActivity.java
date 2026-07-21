package com.example.managementdriver.ui.collection;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.View;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.camera.core.CameraSelector;
import androidx.camera.core.ImageCapture;
import androidx.camera.core.Preview;
import androidx.camera.lifecycle.ProcessCameraProvider;
import androidx.camera.view.PreviewView;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.bumptech.glide.Glide;
import com.airbnb.lottie.LottieAnimationView;
import com.example.managementdriver.R;
import com.example.managementdriver.ui.login.LoginActivity;
import com.example.managementdriver.database.AppDatabase;
import com.example.managementdriver.network.ApiClient;
import com.example.managementdriver.utils.NetworkUtils;
import com.example.managementdriver.utils.PrefsManager;
import com.google.android.material.checkbox.MaterialCheckBox;
import com.google.common.util.concurrent.ListenableFuture;

import java.util.concurrent.ExecutionException;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class CollectionActivity extends AppCompatActivity {

    private PreviewView viewFinder;
    private MaterialCheckBox cbEmptied, cbCleaned;
    private View btnCapture;
    private LottieAnimationView lottieCheckmark;
    private View progressBar;
    private com.google.android.material.card.MaterialCardView cvEmptied, cvCleaned;
    private ImageView ivIconEmptied, ivIconCleaned;
    
    private String binId;
    private String routeId;
    private PrefsManager prefsManager;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        setTheme(R.style.Theme_ManagementDriver);
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_collection);

        binId = getIntent().getStringExtra("bin_id");
        routeId = getIntent().getStringExtra("route_id");
        if (routeId == null) routeId = "ROUTE_QD1_001"; // Fallback
        prefsManager = new PrefsManager(this);

        viewFinder = findViewById(R.id.viewFinder);
        cbEmptied = findViewById(R.id.cbEmptied);
        cbCleaned = findViewById(R.id.cbCleaned);
        btnCapture = findViewById(R.id.btnCapture);
        lottieCheckmark = findViewById(R.id.lottieCheckmark);
        progressBar = findViewById(R.id.collectionProgressBar);

        cvEmptied = findViewById(R.id.cvEmptied);
        cvCleaned = findViewById(R.id.cvCleaned);
        ivIconEmptied = findViewById(R.id.ivIconEmptied);
        ivIconCleaned = findViewById(R.id.ivIconCleaned);

        // Start scanner line loop animation
        View vScannerLine = findViewById(R.id.vScannerLine);
        if (vScannerLine != null) {
            android.view.animation.TranslateAnimation anim = new android.view.animation.TranslateAnimation(
                android.view.animation.Animation.RELATIVE_TO_PARENT, 0.0f,
                android.view.animation.Animation.RELATIVE_TO_PARENT, 0.0f,
                android.view.animation.Animation.RELATIVE_TO_PARENT, 0.0f,
                android.view.animation.Animation.RELATIVE_TO_PARENT, 0.9f
            );
            anim.setDuration(3000);
            anim.setRepeatCount(android.view.animation.Animation.INFINITE);
            anim.setRepeatMode(android.view.animation.Animation.REVERSE);
            anim.setInterpolator(new android.view.animation.AccelerateDecelerateInterpolator());
            vScannerLine.startAnimation(anim);
        }

        TextView tvAssetId = findViewById(R.id.tvAssetId);
        tvAssetId.setText(binId != null ? binId : "BIN-X8842-WEST");
        
        TextView tvAddress = findViewById(R.id.tvAddress);
        String address = getIntent().getStringExtra("location_name");
        if (address != null) tvAddress.setText(address);

        findViewById(R.id.btnBack).setOnClickListener(v -> finish());
        
        setupChecklistLogic();

        if (allPermissionsGranted()) {
            startCamera();
        } else {
            ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.CAMERA}, 10);
        }

        btnCapture.setOnClickListener(v -> attemptCompleteCollection());

        // Start pulse animation for online badge
        startPulseAnimation();

        observeNetwork();
    }

    private void observeNetwork() {
        TextView tvOnline = findViewById(R.id.tvOnlineStatus);
        View vOnlineDot = findViewById(R.id.vOnlinePulse);

        // Check initial state
        if (!NetworkUtils.isNetworkAvailable(this)) {
            if (tvOnline != null) {
                tvOnline.setText("OFFLINE");
                tvOnline.setTextColor(ContextCompat.getColor(this, R.color.color_status_alert));
            }
            if (vOnlineDot != null) {
                vOnlineDot.setBackgroundColor(ContextCompat.getColor(this, R.color.color_status_alert));
                vOnlineDot.clearAnimation();
            }
        }

        NetworkUtils.observeNetworkStatus(this, new NetworkUtils.NetworkStatusListener() {
            @Override
            public void onNetworkAvailable() {
                if (tvOnline != null) {
                    tvOnline.setText("ONLINE");
                    tvOnline.setTextColor(ContextCompat.getColor(CollectionActivity.this, R.color.color_primary_green));
                }
                if (vOnlineDot != null) {
                    vOnlineDot.setBackgroundResource(R.drawable.bg_pulse_dot);
                    startPulseAnimation();
                }
            }

            @Override
            public void onNetworkLost() {
                if (tvOnline != null) {
                    tvOnline.setText("OFFLINE");
                    tvOnline.setTextColor(ContextCompat.getColor(CollectionActivity.this, R.color.color_status_alert));
                }
                if (vOnlineDot != null) {
                    vOnlineDot.setBackgroundColor(ContextCompat.getColor(CollectionActivity.this, R.color.color_status_alert));
                    vOnlineDot.clearAnimation();
                }
            }
        });
    }

    private void setupChecklistLogic() {
        final float density = getResources().getDisplayMetrics().density;
        cbEmptied.setOnCheckedChangeListener((buttonView, isChecked) -> {
            cbEmptied.setText(isChecked ? "VERIFIED" : "WAITING");
            cbEmptied.setTextColor(isChecked ? Color.parseColor("#10B981") : Color.parseColor("#64748B"));
            if (cvEmptied != null) {
                cvEmptied.setCardBackgroundColor(Color.parseColor(isChecked ? "#F0FDF4" : "#FFFFFF"));
                cvEmptied.setStrokeColor(Color.parseColor(isChecked ? "#10B981" : "#E2E8F0"));
                cvEmptied.setStrokeWidth((int) (1.5f * density));
            }
            if (ivIconEmptied != null) {
                ivIconEmptied.setColorFilter(Color.parseColor(isChecked ? "#10B981" : "#64748B"));
            }
        });

        cbCleaned.setOnCheckedChangeListener((buttonView, isChecked) -> {
            cbCleaned.setText(isChecked ? "VERIFIED" : "WAITING");
            cbCleaned.setTextColor(isChecked ? Color.parseColor("#10B981") : Color.parseColor("#64748B"));
            if (cvCleaned != null) {
                cvCleaned.setCardBackgroundColor(Color.parseColor(isChecked ? "#F0FDF4" : "#FFFFFF"));
                cvCleaned.setStrokeColor(Color.parseColor(isChecked ? "#10B981" : "#E2E8F0"));
                cvCleaned.setStrokeWidth((int) (1.5f * density));
            }
            if (ivIconCleaned != null) {
                ivIconCleaned.setColorFilter(Color.parseColor(isChecked ? "#10B981" : "#64748B"));
            }
        });
    }

    private void startPulseAnimation() {
        View vPulse = findViewById(R.id.vOnlinePulse);
        android.view.animation.Animation pulse = new android.view.animation.AlphaAnimation(0.3f, 1.0f);
        pulse.setDuration(1000);
        pulse.setRepeatMode(android.view.animation.Animation.REVERSE);
        pulse.setRepeatCount(android.view.animation.Animation.INFINITE);
        vPulse.startAnimation(pulse);
    }

    private void attemptCompleteCollection() {
        if (!cbEmptied.isChecked() || !cbCleaned.isChecked()) {
            Toast.makeText(this, "Please complete the checklist first", Toast.LENGTH_SHORT).show();
            return;
        }

        // Trong thực tế sẽ chụp ảnh ở đây, tạm thời giả lập chụp xong và gọi API
        confirmCollectionToBackend();
    }

    private void confirmCollectionToBackend() {
        progressBar.setVisibility(View.VISIBLE);
        btnCapture.setEnabled(false);

        // Lấy ID database nếu có, không thì dùng bin_id
        String tempId = getIntent().getStringExtra("id");
        if (tempId == null) tempId = binId;
        final String finalId = tempId;

        // Simulate AI Vision analysis before sending
        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            String token = "Bearer " + prefsManager.getToken();
            ApiClient.getApiService().collectBin(token, finalId).enqueue(new Callback<Void>() {
                @Override
                public void onResponse(Call<Void> call, Response<Void> response) {
                    progressBar.setVisibility(View.GONE);
                    if (response.isSuccessful()) {
                        // Mark as collected in local Room DB to keep sync state
                        new Thread(() -> {
                            AppDatabase.getInstance(CollectionActivity.this).binDao().markCollected(finalId, "collected");
                        }).start();
                        showSuccessAndExit();
                    } else {
                        btnCapture.setEnabled(true);
                        if (response.code() == 401) {
                            Toast.makeText(CollectionActivity.this, "Session Expired. Please log in again.", Toast.LENGTH_LONG).show();
                            redirectToLogin();
                        } else {
                            Toast.makeText(CollectionActivity.this, "AI Verification Failed: " + response.code(), Toast.LENGTH_SHORT).show();
                        }
                    }
                }

                @Override
                public void onFailure(Call<Void> call, Throwable t) {
                    // OFFLINE MODE: Save collection to local DB to sync later with isSynced = 0
                    new Thread(() -> {
                        AppDatabase.getInstance(CollectionActivity.this).binDao().markCollectedOffline(finalId, "collected");
                    }).start();
                    
                    progressBar.setVisibility(View.GONE);
                    Toast.makeText(CollectionActivity.this, "Saved Offline: Will sync when network returns", Toast.LENGTH_LONG).show();
                    showSuccessAndExit();
                }
            });
        }, 1500); 
    }

    private void redirectToLogin() {
        prefsManager.saveToken(null);
        Intent intent = new Intent(this, LoginActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        finish();
    }

    private void showSuccessAndExit() {
        lottieCheckmark.setVisibility(View.VISIBLE);
        lottieCheckmark.playAnimation();
        
        Toast.makeText(this, "Collection Successful!", Toast.LENGTH_SHORT).show();
        
        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            setResult(RESULT_OK);
            finish();
        }, 1800);
    }

    private void startCamera() {
        ListenableFuture<ProcessCameraProvider> cameraProviderFuture = ProcessCameraProvider.getInstance(this);
        cameraProviderFuture.addListener(() -> {
            try {
                ProcessCameraProvider cameraProvider = cameraProviderFuture.get();
                Preview preview = new Preview.Builder().build();
                preview.setSurfaceProvider(viewFinder.getSurfaceProvider());

                CameraSelector cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA;
                cameraProvider.unbindAll();
                cameraProvider.bindToLifecycle(this, cameraSelector, preview);

            } catch (ExecutionException | InterruptedException e) {
                Log.e("CAMERA", "Use case binding failed", e);
            }
        }, ContextCompat.getMainExecutor(this));
    }

    private boolean allPermissionsGranted() {
        return ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED;
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == 10 && allPermissionsGranted()) {
            startCamera();
        }
    }
}
