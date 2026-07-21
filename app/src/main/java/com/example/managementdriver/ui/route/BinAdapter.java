package com.example.managementdriver.ui.route;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.example.managementdriver.R;
import com.example.managementdriver.models.BinCollection;
import com.google.android.material.card.MaterialCardView;

import java.util.List;
import java.util.Locale;

public class BinAdapter extends RecyclerView.Adapter<BinAdapter.ViewHolder> {

    public interface OnBinClickListener {
        void onBinClick(BinCollection bin);
    }

    private List<BinCollection> bins;
    private OnBinClickListener listener;

    public BinAdapter(List<BinCollection> bins, OnBinClickListener listener) {
        this.bins = bins;
        this.listener = listener;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_bin, parent, false);
        return new ViewHolder(view);
    }

    private int getFirstIncompleteIndex() {
        for (int i = 0; i < bins.size(); i++) {
            String s = bins.get(i).getCollectionStatus();
            if (s == null || !(s.equalsIgnoreCase("collected") || s.equalsIgnoreCase("done") || s.equalsIgnoreCase("completed"))) {
                return i;
            }
        }
        return -1;
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        BinCollection bin = bins.get(position);
        int firstIncomplete = getFirstIncompleteIndex();
        
        int stopNum = bin.getStopNumber() > 0 ? bin.getStopNumber() : position + 1;
        holder.tvStopNumber.setText(String.format(Locale.getDefault(), "%02d", stopNum));
        holder.tvLocation.setText(bin.getLocation_name());
        
        String zoneText = String.format("%s • %s", 
                bin.getBinType() != null ? bin.getBinType() : "General", 
                bin.getZone() != null ? bin.getZone() : "Area");
        holder.tvAreaSubtitle.setText(zoneText);

        double dist = 0.4 + (position * 0.3);
        holder.tvDistance.setText(String.format(Locale.getDefault(), "%.1f mi", dist));
        
        String status = bin.getCollectionStatus();
        double fill = bin.getFill_level();

        float density = holder.itemView.getContext().getResources().getDisplayMetrics().density;
        
        // UI Logic based on Status and Fill
        if (status != null && (status.equalsIgnoreCase("collected") || status.equalsIgnoreCase("done") || status.equalsIgnoreCase("completed"))) {
            holder.binCard.setCardBackgroundColor(android.graphics.Color.parseColor("#F1F5F9")); // Slate 100
            holder.binCard.setStrokeWidth(0); // Flat, no stroke
            holder.binCard.setCardElevation(0); // Flat, no shadow
            
            holder.statusCard.setCardBackgroundColor(android.graphics.Color.parseColor("#CBD5E1")); // Slate 300
            holder.tvStatusBadge.setTextColor(android.graphics.Color.parseColor("#475569")); // Slate 600
            holder.tvStatusBadge.setText("COLLECTED");
            holder.tvUrgentBadge.setVisibility(View.GONE);
            holder.itemView.setAlpha(0.5f);
            
            holder.tvFillLevel.setText("Empty");
            holder.tvFillLevel.setTextColor(android.graphics.Color.parseColor("#64748B"));
            
            if (holder.pbFillLevel != null) {
                holder.pbFillLevel.setProgress(0);
                holder.pbFillLevel.setProgressTintList(android.content.res.ColorStateList.valueOf(android.graphics.Color.parseColor("#CBD5E1")));
            }
        } else {
            holder.itemView.setAlpha(1.0f);
            holder.tvFillLevel.setText(String.format(Locale.getDefault(), "%.1f%% Full", fill));
            
            // Text color based on fill level
            int colorVal = android.graphics.Color.parseColor("#10B981"); // Soft Emerald
            if (fill >= 80.0) {
                colorVal = android.graphics.Color.parseColor("#EF4444"); // Red 500
            } else if (fill >= 50.0) {
                colorVal = android.graphics.Color.parseColor("#F59E0B"); // Amber 500
            }
            holder.tvFillLevel.setTextColor(colorVal);

            if (holder.pbFillLevel != null) {
                holder.pbFillLevel.setProgress((int) fill);
                holder.pbFillLevel.setProgressTintList(android.content.res.ColorStateList.valueOf(colorVal));
            }

            boolean isNext = (position == firstIncomplete);
            holder.binCard.setCardElevation(isNext ? (int) (6 * density) : (int) (2 * density)); // More elevation for active stop
            
            if (fill > 90) {
                holder.binCard.setCardBackgroundColor(android.graphics.Color.parseColor("#FEF2F2")); // Red 50
                holder.binCard.setStrokeWidth((int) (1.5 * density));
                holder.binCard.setStrokeColor(android.graphics.Color.parseColor("#EF4444")); // Red border
                
                holder.statusCard.setCardBackgroundColor(android.graphics.Color.parseColor("#FEE2E2")); // Red 100
                holder.tvStatusBadge.setTextColor(android.graphics.Color.parseColor("#B91C1C")); // Red 700
                holder.tvStatusBadge.setText("OVERFLOW");
                holder.tvUrgentBadge.setVisibility(View.VISIBLE);
                holder.tvUrgentBadge.setText("Bio-Hazard + Overflow Risk");
            } else {
                holder.binCard.setCardBackgroundColor(android.graphics.Color.WHITE);
                holder.binCard.setStrokeWidth(isNext ? (int) (1.5 * density) : (int) (1 * density));
                holder.binCard.setStrokeColor(android.graphics.Color.parseColor(isNext ? "#FF9100" : "#E2E8F0")); // Orange for next stop, slate border for other stops
                
                holder.statusCard.setCardBackgroundColor(android.graphics.Color.parseColor(isNext ? "#FFF3E0" : "#E8F5E9"));
                holder.tvStatusBadge.setTextColor(android.graphics.Color.parseColor(isNext ? "#FF9D42" : "#10B981"));
                holder.tvStatusBadge.setText(isNext ? "NEXT UP" : "SCHEDULED");
                holder.tvUrgentBadge.setVisibility(View.GONE);
            }
        }

        holder.itemView.setOnClickListener(v -> listener.onBinClick(bin));
    }

    @Override
    public int getItemCount() {
        return bins.size();
    }

    public static class ViewHolder extends RecyclerView.ViewHolder {
        TextView tvLocation, tvStatusBadge, tvStopNumber, tvDistance, tvAreaSubtitle, tvUrgentBadge, tvFillLevel;
        MaterialCardView statusCard, binCard;
        android.widget.ProgressBar pbFillLevel;

        public ViewHolder(@NonNull View itemView) {
            super(itemView);
            binCard = (MaterialCardView) itemView;
            tvStopNumber = itemView.findViewById(R.id.tvStopNumber);
            tvLocation = itemView.findViewById(R.id.tvBinLocation);
            tvAreaSubtitle = itemView.findViewById(R.id.tvAreaSubtitle);
            tvUrgentBadge = itemView.findViewById(R.id.tvUrgentBadge);
            tvDistance = itemView.findViewById(R.id.tvDistance);
            tvStatusBadge = itemView.findViewById(R.id.tvStatusBadge);
            statusCard = itemView.findViewById(R.id.cvStatusBadge);
            tvFillLevel = itemView.findViewById(R.id.tvFillLevel);
            pbFillLevel = itemView.findViewById(R.id.pbFillLevel);
        }
    }
}
