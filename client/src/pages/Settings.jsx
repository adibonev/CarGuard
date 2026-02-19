import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDashboard } from '../context/DashboardContext';
import { uploadAvatar } from '../lib/supabaseAuth';

const Settings = () => {
  const { user, setUser } = useAuth();
  const {
    reminderDays, reminderEnabled, reminderSettings,
    handleReminderDaysChange, handleReminderEnabledChange, handleReminderSettingChange,
  } = useDashboard();

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [avatarSuccess, setAvatarSuccess] = useState('');
  const fileInputRef = useRef(null);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setAvatarError('Only JPG, PNG, GIF, and WebP images are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('Image must be smaller than 5MB.');
      return;
    }

    setAvatarUploading(true);
    setAvatarError('');
    setAvatarSuccess('');

    try {
      const publicUrl = await uploadAvatar(file, user.auth_user_id);
      setUser(prev => ({ ...prev, avatar_url: publicUrl }));
      setAvatarSuccess('Profile photo updated successfully!');
    } catch (err) {
      console.error('Avatar upload error:', err);
      setAvatarError('Failed to upload photo. Please try again.');
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="tab-content-staging">
      <h2 className="h3 mb-4">⚙️ Settings</h2>

      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">Profile Information</h5>
        </div>
        <div className="card-body">
          {/* Avatar section */}
          <div className="mb-4 d-flex align-items-center gap-4">
            <div style={{ position: 'relative' }}>
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt="Profile"
                  style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid #e9ecef' }}
                />
              ) : (
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#e9ecef', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
                  👤
                </div>
              )}
            </div>
            <div>
              <div className="mb-1" style={{ fontWeight: 600 }}>Profile Photo</div>
              <div style={{ fontSize: '0.85rem', color: '#6c757d', marginBottom: 8 }}>JPG, PNG, GIF or WebP. Max 5MB.</div>
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
              >
                {avatarUploading ? 'Uploading...' : '📷 Change Photo'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                style={{ display: 'none' }}
                onChange={handleAvatarChange}
              />
              {avatarError && <div className="text-danger mt-1" style={{ fontSize: '0.85rem' }}>{avatarError}</div>}
              {avatarSuccess && <div className="text-success mt-1" style={{ fontSize: '0.85rem' }}>{avatarSuccess}</div>}
            </div>
          </div>

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
