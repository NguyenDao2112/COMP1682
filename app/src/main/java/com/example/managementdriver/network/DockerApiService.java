package com.example.managementdriver.network;

import com.example.managementdriver.models.BinCollection;
import com.example.managementdriver.models.LoginRequest;
import com.example.managementdriver.models.LoginResponse;
import com.example.managementdriver.models.RouteResponse;

import java.util.List;

import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.GET;
import retrofit2.http.Header;
import retrofit2.http.POST;
import retrofit2.http.PUT;
import retrofit2.http.Path;
import retrofit2.http.Multipart;
import retrofit2.http.Part;
import okhttp3.MultipartBody;
import okhttp3.ResponseBody;

public interface DockerApiService {
    
    @POST("api/driver/login")
    Call<LoginResponse> login(@Body LoginRequest loginRequest);

    @PUT("api/driver/status/{status}")
    Call<Void> updateDriverStatus(@Header("Authorization") String token, @Path("status") String status);

    @GET("api/driver/route/sequence")
    Call<RouteResponse> getCollectionSequence(@Header("Authorization") String token);

    @POST("api/driver/route/complete")
    Call<Void> completeRoute(@Header("Authorization") String token);

    @GET("api/driver/route/{route_id}/details")
    Call<RouteResponse> getRouteDetails(@Header("Authorization") String token, @Path("route_id") String routeId);

    @POST("api/driver/bin/{bin_id}/collect")
    Call<Void> collectBin(@Header("Authorization") String token, @Path("bin_id") String binId);

    @PUT("api/bins/{id}")
    Call<Void> markBinCollected(@Header("Authorization") String token, @Path("id") String binId, @Body BinUpdateBody body);

    @Multipart
    @POST("api/driver/media/upload")
    Call<ResponseBody> uploadImage(@Header("Authorization") String token, @Part MultipartBody.Part file);

    class BinUpdateBody {
        public double current_fill_level;
        public String status;

        public BinUpdateBody(double current_fill_level, String status) {
            this.current_fill_level = current_fill_level;
            this.status = status;
        }
    }
}
