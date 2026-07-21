package com.example.managementdriver.ui.login;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.view.animation.AlphaAnimation;
import android.view.animation.Animation;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;
import android.text.InputType;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;

import com.example.managementdriver.R;
import com.example.managementdriver.models.LoginRequest;
import com.example.managementdriver.models.LoginResponse;
import com.example.managementdriver.network.ApiClient;
import com.example.managementdriver.ui.route.DashboardActivity;
import com.example.managementdriver.utils.NetworkUtils;
import com.example.managementdriver.utils.PrefsManager;
import com.google.android.material.button.MaterialButton;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class LoginActivity extends AppCompatActivity {

    private EditText etDriverId, etPassword;
    private MaterialButton btnLogin;
    private ProgressBar progressBar;
    private View vPulseIndicator;
    private PrefsManager prefsManager;
    private boolean isPasswordVisible = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        setTheme(R.style.Theme_ManagementDriver);
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);

        etDriverId = findViewById(R.id.etDriverId);
        etPassword = findViewById(R.id.etPassword);
        btnLogin = findViewById(R.id.btnLogin);
        progressBar = findViewById(R.id.progressBar);
        vPulseIndicator = findViewById(R.id.vPulseIndicator);
        prefsManager = new PrefsManager(this);

        ImageView ivTogglePassword = findViewById(R.id.ivTogglePassword);
        ivTogglePassword.setOnClickListener(v -> {
            isPasswordVisible = !isPasswordVisible;
            if (isPasswordVisible) {
                etPassword.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD);
                ivTogglePassword.setImageResource(R.drawable.ic_eye);
            } else {
                etPassword.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_PASSWORD);
                ivTogglePassword.setImageResource(R.drawable.ic_eye_off);
            }
            etPassword.setSelection(etPassword.getText().length());
        });

        btnLogin.setOnClickListener(v -> performLogin());

        // Start Footer Pulse
        pulse = new AlphaAnimation(0.2f, 1.0f);
        pulse.setDuration(1000);
        pulse.setRepeatMode(Animation.REVERSE);
        pulse.setRepeatCount(Animation.INFINITE);
        vPulseIndicator.startAnimation(pulse);

        observeNetwork();
    }

    private void observeNetwork() {
        TextView tvStatus = findViewById(R.id.tvConnectionStatus);
        
        // Check initial state
        if (!NetworkUtils.isNetworkAvailable(this)) {
            tvStatus.setText("SERVER DISCONNECTED");
            tvStatus.setTextColor(ContextCompat.getColor(this, R.color.color_status_alert));
            vPulseIndicator.setBackgroundColor(ContextCompat.getColor(this, R.color.color_status_alert));
            vPulseIndicator.clearAnimation();
        }

        NetworkUtils.observeNetworkStatus(this, new NetworkUtils.NetworkStatusListener() {
            @Override
            public void onNetworkAvailable() {
                tvStatus.setText("CENTRAL SERVER CONNECTED");
                tvStatus.setTextColor(ContextCompat.getColor(LoginActivity.this, R.color.color_soft_gray));
                vPulseIndicator.setBackgroundResource(R.drawable.bg_pulse_dot);
                vPulseIndicator.clearAnimation();
                vPulseIndicator.startAnimation(pulse);
            }

            @Override
            public void onNetworkLost() {
                tvStatus.setText("SERVER DISCONNECTED");
                tvStatus.setTextColor(ContextCompat.getColor(LoginActivity.this, R.color.color_status_alert));
                vPulseIndicator.setBackgroundColor(ContextCompat.getColor(LoginActivity.this, R.color.color_status_alert));
                vPulseIndicator.clearAnimation();
            }
        });
    }

    private Animation pulse;

    private void performLogin() {
        String driverId = etDriverId.getText().toString().trim();
        String password = etPassword.getText().toString().trim();

        if (driverId.isEmpty() || password.isEmpty()) {
            Toast.makeText(this, "Fields required", Toast.LENGTH_SHORT).show();
            return;
        }

        progressBar.setVisibility(View.VISIBLE);
        btnLogin.setEnabled(false);

        LoginRequest request = new LoginRequest(driverId, password);
        ApiClient.getApiService().login(request).enqueue(new Callback<LoginResponse>() {
            @Override
            public void onResponse(Call<LoginResponse> call, Response<LoginResponse> response) {
                progressBar.setVisibility(View.GONE);
                btnLogin.setEnabled(true);

                if (response.isSuccessful() && response.body() != null) {
                    String token = response.body().getToken();
                    if (token != null && !token.isEmpty()) {
                        prefsManager.saveToken(token);
                        if (response.body().getDriverName() != null) {
                            prefsManager.saveDriverInfo(driverId, response.body().getDriverName());
                        }
                        // DEBUG: Hiển thị 5 ký tự đầu của Token để kiểm tra
                        String debugToken = token.substring(0, Math.min(token.length(), 5));
                        Toast.makeText(LoginActivity.this, "Auth Key: " + debugToken + "...", Toast.LENGTH_SHORT).show();
                        
                        startActivity(new Intent(LoginActivity.this, DashboardActivity.class));
                        finish();
                    } else {
                        Toast.makeText(LoginActivity.this, "Server returned empty token", Toast.LENGTH_SHORT).show();
                    }
                } else {
                    Toast.makeText(LoginActivity.this, "Authentication Error: " + response.code(), Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<LoginResponse> call, Throwable t) {
                progressBar.setVisibility(View.GONE);
                btnLogin.setEnabled(true);
                Toast.makeText(LoginActivity.this, "Network error: " + t.getMessage(), Toast.LENGTH_LONG).show();
            }
        });
    }
}
