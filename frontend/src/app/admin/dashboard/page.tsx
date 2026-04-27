"use client";

import React, { useEffect, useState } from 'react';
import { adminApi, emergencyApi } from '@/lib/api';
import { Users, Calendar, Activity, ShieldAlert, FileText, Video, ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format, isSameDay, parseISO } from 'date-fns';

interface Stats {
  totalClients: number;
  totalItemsThisMonth: number;
  statusSummary: Record<string, number>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [todayStats, setTodayStats] = useState({ total: 0, completed: 0, percentage: 0, remaining: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [emergencyTasks, setEmergencyTasks] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await adminApi.getStats();
        setStats(res.data);
      } catch (err: any) {
        console.error('Failed to load stats:', err.message);
        setError(err.message);
      }

      // Fetch master calendar separately so stats still show if this fails
      try {
        const calendarRes = await adminApi.getMasterCalendar(format(new Date(), 'yyyy-MM'));
        const data = calendarRes.data;
        const today = new Date();
        const todayItems = data.filter((item: any) => isSameDay(parseISO(item.scheduled_datetime), today));
        const totalToday = todayItems.length;
        const completedToday = todayItems.filter((item: any) => item.status === 'POSTED').length;
        
        setTodayStats({
          total: totalToday,
          completed: completedToday,
          remaining: totalToday - completedToday,
          percentage: totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0
        });

        // Fetch all emergency tasks
        const emergencyRes = await emergencyApi.getAll();
        setEmergencyTasks(emergencyRes.data);

      } catch (err: any) {
        console.error('Failed to load calendar:', err.message);
      }

      setLoading(false);
    };
    fetchStats();
  }, []);

  return (
    <div className="dashboard-view">
      <header className="page-header" style={{ marginBottom: '32px' }}>
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">Overview of system activity and client pipelines</p>
        </div>
      </header>

      <div className="daily-stats-banner">
        <div className="progress-meter-card">
          <div className="progress-info">
            <div className="progress-main">
              <div className="progress-count">
                <span className="current">{todayStats.completed}</span>
                <span className="total">/{todayStats.total}</span>
              </div>
              <div className="progress-label">Tasks Completed</div>
            </div>
            <div className="meter-wrapper" style={{ flex: 1 }}>
              <div className="meter-bar">
                <div className="meter-fill" style={{ width: `${todayStats.percentage}%` }}>
                  <div className="meter-glow"></div>
                </div>
              </div>
              <div className="meter-stats" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                <span className="percentage" style={{ fontSize: '14px', fontWeight: 800, color: 'var(--accent)' }}>{todayStats.percentage}% Complete</span>
                <span className="remaining" style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>{todayStats.remaining} remaining today</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {emergencyTasks.length > 0 && (
        <div className="emergency-panel">
          <div className="emergency-panel-header">
            <ShieldAlert size={24} color="#ef4444" />
            <h2 className="emergency-panel-title">All Emergency Tasks</h2>
          </div>
          <div className="emergency-list">
            {emergencyTasks.map((task: any) => (
              <div
                key={task.id}
                className="emergency-card"
                onClick={() => {
                  // Admin dashboard doesn't have an item detail modal on this page
                  // Usually we'd redirect or show a modal, but for now just highlight
                }}
              >
                <div className="emergency-card-icon">
                  {task.content_type === 'Post' ? <FileText size={20} /> : <Video size={20} />}
                </div>
                <div className="emergency-card-info">
                  <p className="emergency-card-client">{task.clients?.company_name}</p>
                  <p className="emergency-card-type">{task.content_type} • {format(parseISO(task.scheduled_datetime), 'p')}</p>
                </div>
                <ArrowRight size={18} color="var(--text-muted)" />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="stats-grid">
        {loading ? (
          <>
            {[1, 2, 3].map((i) => (
              <div key={i} className="stat-card">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-12" />
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            <div className="stat-card">
              <div className="stat-icon-box" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent)' }}>
                <Users size={28} />
              </div>
              <div className="stat-info">
                <h3>Total Clients</h3>
                <p className="stat-value">{stats?.totalClients || 0}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon-box" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)' }}>
                <Calendar size={28} />
              </div>
              <div className="stat-info">
                <h3>Scheduled (Month)</h3>
                <p className="stat-value">{stats?.totalItemsThisMonth || 0}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon-box" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)' }}>
                <Activity size={28} />
              </div>
              <div className="stat-info">
                <h3>Active Pipelines</h3>
                <p className="stat-value">
                  {Object.values(stats?.statusSummary || {}).reduce((a, b) => a + b, 0)}
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      <div style={{ margin: '48px 0 24px 0' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Pipeline Distribution</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>Current status of all content items across the platform</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        {loading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-2xl" />
            ))}
          </>
        ) : (
          <>
            {Object.entries(stats?.statusSummary || {}).map(([status, count]) => (
              <div key={status} style={{ 
                background: 'var(--bg-surface)', 
                padding: '24px', 
                borderRadius: '20px', 
                border: '1px solid var(--border)', 
                boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = 'var(--accent)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'var(--border)';
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="type-badge post" style={{ fontSize: '11px', fontWeight: 800 }}>{status}</span>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: 900, fontSize: '24px', color: 'var(--accent)', textShadow: '0 0 15px var(--accent-glow)' }}>{count}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: 700 }}> / {stats?.totalItemsThisMonth || 0}</span>
                  </div>
                </div>
              </div>
            ))}
            {Object.keys(stats?.statusSummary || {}).length === 0 && (
              <div style={{ 
                background: 'var(--bg-surface)', 
                padding: '60px', 
                borderRadius: '20px', 
                border: '1px dashed var(--border)',
                gridColumn: '1 / -1',
                textAlign: 'center'
              }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '15px', fontWeight: 600 }}>No active content items found for this month.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
