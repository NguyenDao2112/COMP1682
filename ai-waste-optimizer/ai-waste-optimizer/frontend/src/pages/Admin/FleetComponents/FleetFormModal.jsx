import React from "react";

function FleetFormModal({ show, vehicle, formData, onChange, onSubmit, onClose, darkMode = true }) {
  if (!show) return null;
  const isEditing = !!vehicle;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <i className={`fas ${isEditing ? "fa-edit" : "fa-plus"}`}></i>
            {isEditing ? "Edit Vehicle" : "Add New Vehicle"}
          </h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <form onSubmit={onSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Vehicle ID</label>
                <input
                  type="text"
                  name="vehicle_id"
                  value={formData.vehicle_id}
                  onChange={onChange}
                  placeholder="TRK-001"
                  disabled={isEditing}
                />
              </div>

              <div className="form-group">
                <label>Vehicle Type</label>
                <select name="type" value={formData.type} onChange={onChange}>
                  <option value="Compactor">Compactor</option>
                  <option value="Garbage Truck">Garbage Truck</option>
                  <option value="Recycling Truck">Recycling Truck</option>
                  <option value="Container Truck">Container Truck</option>
                </select>
              </div>

              <div className="form-group">
                <label>Capacity (kg)</label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={onChange}
                  min="0"
                />
              </div>

              <div className="form-group">
                <label>Driver Name</label>
                <input
                  type="text"
                  name="driver_name"
                  value={formData.driver_name}
                  onChange={onChange}
                  placeholder="Enter driver name"
                />
              </div>

              <div className="form-group">
                <label>District</label>
                <select name="district" value={formData.district} onChange={onChange}>
                  <option value="">Select District</option>
                  <option value="Hai Chau">Hai Chau</option>
                  <option value="Thanh Khe">Thanh Khe</option>
                  <option value="Lien Chieu">Lien Chieu</option>
                  <option value="Son Tra">Son Tra</option>
                  <option value="Ngu Hanh Son">Ngu Hanh Son</option>
                </select>
              </div>

              <div className="form-group">
                <label>Location</label>
                <select name="location" value={formData.location} onChange={onChange}>
                  <option value="Depot">Depot</option>
                  <option value="Hai Chau Depot">Hai Chau Depot</option>
                  <option value="Thanh Khe Depot">Thanh Khe Depot</option>
                  <option value="Lien Chieu Depot">Lien Chieu Depot</option>
                  <option value="Son Tra Depot">Son Tra Depot</option>
                  <option value="Ngu Hanh Son Depot">Ngu Hanh Son Depot</option>
                </select>
              </div>

              <div className="form-group">
                <label>Fuel Level (%)</label>
                <input
                  type="number"
                  name="fuel"
                  value={formData.fuel}
                  onChange={onChange}
                  min="0"
                  max="100"
                />
              </div>

              <div className="form-group">
                <label>Status</label>
                <select name="status" value={formData.status} onChange={onChange}>
                  <option value="idle">Idle</option>
                  <option value="active">Active</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                {isEditing ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default FleetFormModal;
