"use client";

import React, { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import { Users, Calendar, Activity } from 'lucide-react';

interface Stats {
  totalClients: number;
  totalItemsThisMonth: number;
  statusSummary: Record<string, number>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await adminApi.getStats();
        setStats(res.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="loading-bar">Loading statistics...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div>
      <header className="page-header">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">Overview of system activity and client pipelines</p>
        </div>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-box">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <h3>Total Clients</h3>
            <p className="stat-value">{stats?.totalClients || 0}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-box" style={{ background: '#ecfdf5', color: '#059669' }}>
            <Calendar size={24} />
          </div>
          <div className="stat-info">
            <h3>Scheduled (Month)</h3>
            <p className="stat-value">{stats?.totalItemsThisMonth || 0}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-box" style={{ background: '#fffbeb', color: '#d97706' }}>
            <Activity size={24} />
          </div>
          <div className="stat-info">
            <h3>Active Pipelines</h3>
            <p className="stat-value">
              {Object.values(stats?.statusSummary || {}).reduce((a, b) => a + b, 0)}
            </p>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>Pipeline Distribution</h2>
        <p style={{ color: '#94a3b8', fontSize: '14px' }}>Current status of all content items across the platform</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {Object.entries(stats?.statusSummary || {}).map(([status, count]) => (
          <div key={status} style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="type-badge post">{status}</span>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontWeight: 800, fontSize: '20px', color: '#4f46e5' }}>{count}</span>
                <span style={{ color: '#94a3b8', fontSize: '14px', fontWeight: 700 }}> / {stats?.totalItemsThisMonth || 0}</span>
              </div>
            </div>
          </div>
        ))}
        {Object.keys(stats?.statusSummary || {}).length === 0 && (
          <p style={{ color: '#94a3b8', fontStyle: 'italic', gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
            No active content items found for this month.
          </p>
        )}
      </div>
    </div>
  );
}
