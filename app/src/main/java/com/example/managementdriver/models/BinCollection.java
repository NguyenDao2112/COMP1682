package com.example.managementdriver.models;

import com.google.gson.annotations.SerializedName;

public class BinCollection {
    @SerializedName("id")
    private String id;
    
    @SerializedName("bin_id")
    private String binId;
    
    @SerializedName("location_name")
    private String locationName;
    
    @SerializedName("address")
    private String address;
    
    @SerializedName("latitude")
    private double latitude;
    
    @SerializedName("longitude")
    private double longitude;
    
    @SerializedName("current_fill_level")
    private double currentFillLevel;
    
    @SerializedName("bin_type")
    private String binType;
    
    @SerializedName("zone")
    private String zone;
    
    @SerializedName("stop_number")
    private int stopNumber;
    
    @SerializedName(value="collection_status", alternate={"collectionStatus", "status"})
    private String collectionStatus;

    public BinCollection() {}

    // Constructor for Offline Mapping
    public BinCollection(String binId, String locationName, double latitude, double longitude, double fillLevel, String binType, String zone, int stopNumber, String status) {
        this.binId = binId;
        this.locationName = locationName;
        this.latitude = latitude;
        this.longitude = longitude;
        this.currentFillLevel = fillLevel;
        this.binType = binType;
        this.zone = zone;
        this.stopNumber = stopNumber;
        this.collectionStatus = status;
    }

    public void setId(String id) { this.id = id; }

    public String getId() { return id; }
    public String getBin_id() { return binId != null ? binId : id; }
    public String getLocation_name() { return locationName != null ? locationName : address; }
    public double getLatitude() { return latitude; }
    public double getLongitude() { return longitude; }
    public double getFill_level() { return currentFillLevel; }
    public String getBinType() { return binType != null ? binType : "General"; }
    public String getZone() { return zone; }
    public int getStopNumber() { return stopNumber; }
    
    public String getCollectionStatus() { 
        if (collectionStatus == null) return "pending";
        return collectionStatus;
    }
}
