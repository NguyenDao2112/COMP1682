package com.example.managementdriver.models;

import com.google.gson.annotations.SerializedName;
import java.util.List;

public class RouteResponse {
    @SerializedName("route_id")
    private String routeId;
    
    @SerializedName("route_name")
    private String routeName;
    
    @SerializedName("district")
    private String district;
    
    @SerializedName("status")
    private String status;
    
    @SerializedName("total_stops")
    private int totalStops;
    
    @SerializedName("completed_stops")
    private int completedStops;
    
    @SerializedName("bins")
    private List<BinCollection> bins;
    
    @SerializedName("route")
    private List<BinCollection> route;

    public String getRouteId() { return routeId; }
    public String getRouteName() { return routeName; }
    public String getDistrict() { return district; }
    public String getStatus() { return status; }
    public int getTotalStops() { return totalStops; }
    public int getCompletedStops() { return completedStops; }
    
    public List<BinCollection> getRoute() { 
        return bins != null ? bins : route; 
    }
}
