import React, { useState, useEffect } from "react";
import { usersAPI } from "../../services/api";

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ username: '', email: '', password: '', role: 'driver', full_name: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await usersAPI.getAll();
        setUsers(data);
      } catch (err) {
        console.error("Failed to load users", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await usersAPI.create(formData);
      setIsModalOpen(false);
      setFormData({ username: '', email: '', password: '', role: 'driver', full_name: '' });
      // Refresh list
      setLoading(true);
      const data = await usersAPI.getAll();
      setUsers(data);
    } catch (err) {
      setError(err.message || 'Failed to grant clearance');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to permanently revoke this clearance?")) {
      try {
        await usersAPI.delete(id);
        setUsers(users.filter(u => u.id !== id));
      } catch (err) {
        alert(err.message || "Failed to revoke access");
      }
    }
  };

  return (
    <div>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px'}}>
        <h1 className="cmd-panel-title" style={{fontSize: '28px', margin: 0}}>
          <i className="fas fa-user-shield" style={{color: 'var(--admin-cyan)'}}></i> ACCESS CONTROL MATRIX
        </h1>
        <button className="cyber-btn primary" onClick={() => setIsModalOpen(true)}>
          <i className="fas fa-user-plus"></i> Grant Clearance
        </button>
      </div>

      <div className="cmd-panel">
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
          <div style={{display: 'flex', gap: '16px'}}>
            <input type="text" placeholder="Search identities..." 
              style={{background: 'rgba(0,0,0,0.5)', border: '1px solid var(--admin-border)', color: '#fff', padding: '10px 16px', borderRadius: '8px', minWidth: '300px'}} />
          </div>
          <div style={{display: 'flex', gap: '8px'}}>
            <button className="cyber-btn">All Clearances</button>
            <button className="cyber-btn">Admins</button>
            <button className="cyber-btn">Managers</button>
            <button className="cyber-btn">Drivers</button>
          </div>
        </div>

        <div style={{overflowX: 'auto'}}>
          <table className="cyber-table">
            <thead>
              <tr>
                <th>Identity</th>
                <th>Security Clearance (Role)</th>
                <th>Network Status</th>
                <th>Last Active</th>
                <th>Override Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{textAlign: 'center', color: 'var(--admin-cyan)'}}>Accessing Neural Database...</td></tr>
              ) : users.length > 0 ? (
                users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                        <div className="admin-avatar" style={{width: '32px', height: '32px', fontSize: '12px'}}>
                          {u.full_name?.charAt(0) || u.username.charAt(0)}
                        </div>
                        <div>
                          <div style={{fontWeight: 600, color: '#fff'}}>{u.full_name || u.username}</div>
                          <div style={{fontSize: '12px', color: 'var(--admin-text-muted)'}}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {u.role === 'admin' ? <span className="cyber-badge badge-rose">Level 5 (ADMIN)</span> :
                       u.role === 'manager' ? <span className="cyber-badge badge-cyan">Level 3 (MANAGER)</span> :
                       <span className="cyber-badge badge-emerald">Level 1 (DRIVER)</span>}
                    </td>
                    <td>
                      {u.is_active ? 
                        <span style={{color: 'var(--admin-emerald)'}}><i className="fas fa-circle" style={{fontSize: '10px'}}></i> Active</span> : 
                        <span style={{color: 'var(--admin-rose)'}}><i className="fas fa-circle" style={{fontSize: '10px'}}></i> Revoked</span>}
                    </td>
                    <td style={{fontFamily: 'monospace', color: 'var(--admin-text-muted)'}}>
                      {new Date().toISOString().split('T')[0]}
                    </td>
                    <td>
                      <div style={{display: 'flex', gap: '8px'}}>
                        <button className="cyber-btn" style={{padding: '6px 10px', fontSize: '12px'}} title="Modify Clearance"><i className="fas fa-fingerprint"></i></button>
                        {u.role !== 'admin' && (
                          <button onClick={() => handleDelete(u.id)} className="cyber-btn" style={{padding: '6px 10px', fontSize: '12px', color: 'var(--admin-rose)'}} title="Revoke Access"><i className="fas fa-ban"></i></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5" style={{textAlign: 'center', color: 'var(--admin-text-muted)'}}>No identities found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grant Clearance Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="cmd-panel" style={{width: '400px', border: '1px solid var(--admin-cyan)'}}>
            <h3 style={{color: 'var(--admin-cyan)', marginTop: 0, borderBottom: '1px solid rgba(0, 255, 204, 0.2)', paddingBottom: '12px'}}>
              <i className="fas fa-shield-alt"></i> ISSUE NEW CLEARANCE
            </h3>
            
            {error && <div style={{color: 'var(--admin-rose)', background: 'rgba(255,51,102,0.1)', padding: '10px', borderRadius: '4px', marginBottom: '16px', fontSize: '14px'}}>{error}</div>}
            
            <form onSubmit={handleCreate} style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
              <div>
                <label style={{display: 'block', color: 'var(--admin-text-muted)', fontSize: '12px', marginBottom: '4px'}}>USERNAME</label>
                <input required type="text" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})}
                  style={{width: '100%', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--admin-border)', color: '#fff', padding: '10px', borderRadius: '4px'}} />
              </div>
              <div>
                <label style={{display: 'block', color: 'var(--admin-text-muted)', fontSize: '12px', marginBottom: '4px'}}>FULL NAME</label>
                <input type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})}
                  style={{width: '100%', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--admin-border)', color: '#fff', padding: '10px', borderRadius: '4px'}} />
              </div>
              <div>
                <label style={{display: 'block', color: 'var(--admin-text-muted)', fontSize: '12px', marginBottom: '4px'}}>EMAIL (OPTIONAL)</label>
                <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                  style={{width: '100%', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--admin-border)', color: '#fff', padding: '10px', borderRadius: '4px'}} />
              </div>
              <div>
                <label style={{display: 'block', color: 'var(--admin-text-muted)', fontSize: '12px', marginBottom: '4px'}}>TEMPORARY PASSWORD</label>
                <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                  style={{width: '100%', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--admin-border)', color: '#fff', padding: '10px', borderRadius: '4px'}} />
              </div>
              <div>
                <label style={{display: 'block', color: 'var(--admin-text-muted)', fontSize: '12px', marginBottom: '4px'}}>SECURITY LEVEL (ROLE)</label>
                <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}
                  style={{width: '100%', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--admin-border)', color: '#fff', padding: '10px', borderRadius: '4px'}}>
                  <option value="driver">Level 1 (DRIVER)</option>
                  <option value="manager">Level 3 (MANAGER)</option>
                  <option value="admin">Level 5 (ADMIN)</option>
                </select>
              </div>
              
              <div style={{display: 'flex', gap: '12px', marginTop: '12px', justifyContent: 'flex-end'}}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="cyber-btn" style={{borderColor: 'var(--admin-border)'}}>CANCEL</button>
                <button type="submit" className="cyber-btn primary">AUTHORIZE</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Users;