import React, { useState, useEffect } from "react";
import { configAPI } from "../../services/api";

function Settings() {
  const [aiConfig, setAiConfig] = useState({
    fuelPriority: 70,
    speedPriority: 30,
    co2Penalty: 15,
    maxWaitTime: 45
  });

  const [globalVars, setGlobalVars] = useState({
    fuelCost: 1.25,
    carbonCreditPrice: 45.0,
    maxTruckLoad: 10000
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const config = await configAPI.get();
        setAiConfig({
          fuelPriority: config.fuelPriority,
          speedPriority: config.speedPriority,
          co2Penalty: config.co2Penalty,
          maxWaitTime: config.maxWaitTime
        });
        setGlobalVars({
          fuelCost: config.fuelCost,
          carbonCreditPrice: config.carbonCreditPrice,
          maxTruckLoad: config.maxTruckLoad
        });
      } catch (err) {
        console.error("Failed to load config", err);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleSliderChange = (e, key) => {
    setAiConfig(prev => ({ ...prev, [key]: parseInt(e.target.value) }));
  };

  const handleGlobalChange = (e, key) => {
    setGlobalVars(prev => ({ ...prev, [key]: parseFloat(e.target.value) }));
  };

  const handleSave = async () => {
    try {
      await configAPI.update({ ...aiConfig, ...globalVars });
      alert("AI Configuration synchronized to Global Cluster!");
    } catch (err) {
      alert("Failed to save config: " + err.message);
    }
  };

  return (
    <div>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px'}}>
        <h1 className="cmd-panel-title" style={{fontSize: '28px', margin: 0}}>
          <i className="fas fa-microchip" style={{color: 'var(--admin-purple)'}}></i> AI CORE CONFIGURATION
        </h1>
        <button className="cyber-btn primary" onClick={handleSave}>
          <i className="fas fa-satellite-transmit"></i> Deploy Config
        </button>
      </div>

      <div className="cmd-grid-main">
        {/* Left: AI Heuristics */}
        <div className="cmd-panel">
          <h3 className="cmd-panel-title"><i className="fas fa-brain"></i> Routing Heuristics (Neural Net)</h3>
          <p style={{color: 'var(--admin-text-muted)', fontSize: '14px', marginBottom: '32px'}}>
            Adjust the weight matrices for the global pathfinding algorithm. Changes take effect on next dispatch cycle.
          </p>

          <div className="cyber-slider-group">
            <div className="cyber-slider-header">
              <span className="cyber-slider-label">Fuel Optimization Bias</span>
              <span className="cyber-slider-value">{aiConfig.fuelPriority}%</span>
            </div>
            <input type="range" className="cyber-range" min="0" max="100" 
              value={aiConfig.fuelPriority} onChange={(e) => handleSliderChange(e, 'fuelPriority')} />
          </div>

          <div className="cyber-slider-group">
            <div className="cyber-slider-header">
              <span className="cyber-slider-label">Time/Speed Priority</span>
              <span className="cyber-slider-value">{aiConfig.speedPriority}%</span>
            </div>
            <input type="range" className="cyber-range" min="0" max="100" 
              value={aiConfig.speedPriority} onChange={(e) => handleSliderChange(e, 'speedPriority')} />
          </div>

          <div className="cyber-slider-group">
            <div className="cyber-slider-header">
              <span className="cyber-slider-label">CO2 Emission Penalty Factor</span>
              <span className="cyber-slider-value">x{aiConfig.co2Penalty / 10}</span>
            </div>
            <input type="range" className="cyber-range" min="0" max="50" 
              value={aiConfig.co2Penalty} onChange={(e) => handleSliderChange(e, 'co2Penalty')} />
          </div>

          <div className="cyber-slider-group" style={{marginBottom: 0}}>
            <div className="cyber-slider-header">
              <span className="cyber-slider-label">Max Bin Wait Time (hours)</span>
              <span className="cyber-slider-value">{aiConfig.maxWaitTime}h</span>
            </div>
            <input type="range" className="cyber-range" min="12" max="72" 
              value={aiConfig.maxWaitTime} onChange={(e) => handleSliderChange(e, 'maxWaitTime')} />
          </div>
        </div>

        {/* Right: Environment Variables */}
        <div className="cmd-panel">
          <h3 className="cmd-panel-title"><i className="fas fa-globe-americas"></i> Environment Variables</h3>
          
          <div style={{display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '24px'}}>
            <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
              <label style={{fontSize: '12px', color: 'var(--admin-text-muted)', textTransform: 'uppercase', fontWeight: 600}}>
                Fuel Cost ($/Liter)
              </label>
              <input type="number" 
                style={{background: 'rgba(0,0,0,0.5)', border: '1px solid var(--admin-border)', color: '#fff', padding: '12px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '16px'}}
                value={globalVars.fuelCost}
                onChange={(e) => handleGlobalChange(e, 'fuelCost')}
              />
            </div>

            <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
              <label style={{fontSize: '12px', color: 'var(--admin-text-muted)', textTransform: 'uppercase', fontWeight: 600}}>
                Carbon Credit Market Price ($/Ton)
              </label>
              <input type="number" 
                style={{background: 'rgba(0,0,0,0.5)', border: '1px solid var(--admin-border)', color: '#fff', padding: '12px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '16px'}}
                value={globalVars.carbonCreditPrice}
                onChange={e => setGlobalVars({...globalVars, carbonCreditPrice: e.target.value})}
              />
            </div>

            <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
              <label style={{fontSize: '12px', color: 'var(--admin-text-muted)', textTransform: 'uppercase', fontWeight: 600}}>
                Max Fleet Payload (KG)
              </label>
              <input type="number" 
                style={{background: 'rgba(0,0,0,0.5)', border: '1px solid var(--admin-border)', color: '#fff', padding: '12px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '16px'}}
                value={globalVars.maxTruckLoad}
                onChange={e => setGlobalVars({...globalVars, maxTruckLoad: e.target.value})}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
