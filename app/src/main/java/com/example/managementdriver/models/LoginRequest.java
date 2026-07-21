package com.example.managementdriver.models;

import com.google.gson.annotations.SerializedName;

public class LoginRequest {
    @SerializedName("driver_id")
    private String driverId;
    
    private String password;

    public LoginRequest(String driverId, String password) {
        this.driverId = driverId;
        this.password = password;
    }

    public String getDriverId() {
        return driverId;
    }

    public void setDriverId(String driverId) {
        this.driverId = driverId;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
