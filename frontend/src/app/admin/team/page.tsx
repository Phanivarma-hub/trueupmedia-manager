"use client";

import React, { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import { Plus, Search, Trash2, X, UserCheck, Shield, Key } from 'lucide-react';

interface TeamMember {
  user_id: string;
  name: string;
  email: string;
  role: 'TL1' | 'TL2';
  created_at: string;
}

export default function TeamManagement() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'TL1' as 'TL1' | 'TL2',
  });

  const fetchTeam = async () => {
    try {
      const res = await adminApi.getTeam();
      setTeam(res.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleAddClick = () => {
    setFormData({ name: '', email: '', password: '', role: 'TL1' });
    setShowModal(true);
  };

  const handleDeleteClick = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove ${name} from the team? They will no longer be able to log in.`)) {
      try {
        await adminApi.deleteTeamMember(id);
        fetchTeam();
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await adminApi.addTeamMember(formData);
      setShowModal(false);
      fetchTeam();
    } catch (err: any) {
      alert(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredTeam = team.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <header className="page-header">
        <div>
          <h1 className="page-title">Team Management</h1>
          <p className="page-subtitle">Manage Team Leads and access permissions</p>
        </div>
        <button className="btn-add" onClick={handleAddClick}>
          <Plus size={18} />
          Add Team Lead
        </button>
      </header>

      <div className="table-card">
        <div className="table-header">
          <div className="search-input-box">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading && team.length === 0 ? (
          <div className="loading-bar">Loading team data...</div>
        ) : error ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>{error}</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeam.map((member) => (
                <tr key={member.user_id}>
                  <td style={{ fontWeight: 700, color: '#0f172a' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="user-avatar" style={{ width: '32px', height: '32px', fontSize: '12px' }}>
                        {member.name.charAt(0)}
                      </div>
                      {member.name}
                    </div>
                  </td>
                  <td>{member.email}</td>
                  <td>
                    <span className={`type-badge ${member.role === 'TL1' ? 'post' : 'reel'}`} style={{ minWidth: '60px', textAlign: 'center' }}>
                      {member.role}
                    </span>
                  </td>
                  <td>{new Date(member.created_at).toLocaleDateString()}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn-icon delete" onClick={() => handleDeleteClick(member.user_id, member.name)}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredTeam.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontStyle: 'italic' }}>
                    No team members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Create Team Lead</h3>
              <button onClick={() => setShowModal(false)} className="modal-close"><X size={20}/></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    className="form-input" 
                    required 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Enter full name"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input 
                  type="email" 
                  className="form-input" 
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="tl@trueupmedia.com"
                  style={{ width: '100%' }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password *</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="password" 
                    className="form-input" 
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder="Minimum 6 characters"
                    style={{ width: '100%' }}
                  />
                  <Key size={14} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#cbd5e1' }} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Access Role *</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <label style={{ 
                    flex: 1, 
                    padding: '12px', 
                    borderRadius: '10px', 
                    border: `1px solid ${formData.role === 'TL1' ? '#4f46e5' : '#e2e8f0'}`,
                    background: formData.role === 'TL1' ? '#f5f3ff' : '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <input 
                      type="radio" 
                      name="role" 
                      value="TL1" 
                      checked={formData.role === 'TL1'}
                      onChange={() => setFormData({...formData, role: 'TL1'})}
                      style={{ accentColor: '#4f46e5' }}
                    />
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>Team Lead 1</p>
                      <p style={{ fontSize: '11px', color: '#64748b' }}>Post Content Specialist</p>
                    </div>
                  </label>
                  <label style={{ 
                    flex: 1, 
                    padding: '12px', 
                    borderRadius: '10px', 
                    border: `1px solid ${formData.role === 'TL2' ? '#4f46e5' : '#e2e8f0'}`,
                    background: formData.role === 'TL2' ? '#f5f3ff' : '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <input 
                      type="radio" 
                      name="role" 
                      value="TL2" 
                      checked={formData.role === 'TL2'}
                      onChange={() => setFormData({...formData, role: 'TL2'})}
                      style={{ accentColor: '#4f46e5' }}
                    />
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>Team Lead 2</p>
                      <p style={{ fontSize: '11px', color: '#64748b' }}>Reel Content Specialist</p>
                    </div>
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading} style={{ width: 'auto', padding: '10px 24px' }}>
                  {loading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
