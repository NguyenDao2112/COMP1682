import React from "react";

function Reports() {
  return (
    <div>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px'}}>
        <h1 className="cmd-panel-title" style={{fontSize: '28px', margin: 0}}>
          <i className="fas fa-file-invoice-dollar" style={{color: 'var(--admin-warning)'}}></i> GLOBAL AUDIT & REPORTS
        </h1>
        <button className="cyber-btn primary">
          <i className="fas fa-print"></i> Generate PDF
        </button>
      </div>

      <div className="cmd-panel" style={{textAlign: 'center', padding: '64px'}}>
        <i className="fas fa-chart-pie" style={{fontSize: '64px', color: 'var(--admin-text-muted)', marginBottom: '16px'}}></i>
        <h3 style={{color: '#fff'}}>Audit Module Ready</h3>
        <p style={{color: 'var(--admin-text-muted)', maxWidth: '500px', margin: '0 auto'}}>
          The global reporting module is synchronizing with the blockchain audit trail. Financial impact and CO2 reduction metrics will be available in the next cycle.
        </p>
      </div>
    </div>
  );
}

export default Reports;
