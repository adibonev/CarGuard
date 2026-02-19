import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useDashboard } from '../context/DashboardContext';

const Settings = () => {
  const { user } = useAuth();
  const {
    reminderDays, reminderEnabled, reminderSettings,
    handleReminderDaysChange, handleReminderEnabledChange, handleReminderSettingChange,
  } = useDashboard();

  return (
    <div className="tab-content-staging">
      <h2 className="h3 mb-4">⚙️ Settings</h2>

      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">Profile Information</h5>
        </div>
        <div className="card-body">
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input type="email" className="form-control" value={user?.email || ''} disabled />
          </div>
          <div className="mb-3">
            <label className="form-label">Name</label>
            <input type="text" className="form-control" value={user?.name || ''} disabled />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">⏰ Reminder Settings</h5>
        </div>
        <div className="card-body">
          <p style={{ color: '#6c757d', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
            Set how many days before expiry you want to be reminded for each service type.
          </p>
          {[
            { key: 'civil_liability', label: '🛡️ Civil Liability Insurance' },
            { key: 'casco', label: '💎 Casco Insurance' },
            { key: 'vignette', label: '🛣️ Vignette' },
            { key: 'inspection', label: '🔧 Yearly Inspection' },
            { key: 'tax', label: '💰 Vehicle Tax' },
            { key: 'fire_extinguisher', label: '🔴 Fire Extinguisher' },
            { key: 'maintenance', label: '🛢️ Maintenance' },
          ].map(({ key, label }) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid #f0f0f0' }}>
              <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{label}</span>
              <select
                className="form-select"
                value={reminderSettings[key] || 30}
                onChange={e => handleReminderSettingChange(key, e.target.value)}
                style={{ width: '130px', fontSize: '0.9rem' }}
              >
                <option value="7">7 days</option>
                <option value="14">14 days</option>
                <option value="30">30 days</option>
                <option value="60">60 days</option>
                <option value="90">90 days</option>
              </select>
            </div>
          ))}
          <div className="form-check mt-3">
            <input className="form-check-input" type="checkbox" checked={reminderEnabled} onChange={(e) => handleReminderEnabledChange(e.target.checked)} />
            <label className="form-check-label">Enable email reminders</label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
