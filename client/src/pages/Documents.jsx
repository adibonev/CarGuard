import React from 'react';
import { useDashboard } from '../context/DashboardContext';

const Documents = () => {
  const {
    cars, allServices,
    docFilterCar, setDocFilterCar,
    showDocUpload, setShowDocUpload,
    docUploadCar, setDocUploadCar,
    docUploadFile, setDocUploadFile,
    docUploadNote, setDocUploadNote,
    docUploading, handleDocUpload,
    getServiceIcon, getServiceName,
  } = useDashboard();

  const docs = allServices.filter(s => s.fileUrl);
  const filtered = docFilterCar === 'all' ? docs : docs.filter(s => s.carId === docFilterCar);

  const getFileName = (url) => {
    try { return decodeURIComponent(url.split('/').pop().split('?')[0]); } catch { return 'document'; }
  };
  const getFileExt = (url) => getFileName(url).split('.').pop().toLowerCase();
  const extIcon = (ext) => {
    if (ext === 'pdf') return '📄';
    if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) return '🖼️';
    return '📎';
  };

  return (
    <div className="tab-content-staging">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="h3 mb-0">📁 Documents</h2>
        <button onClick={() => { setDocUploadCar(cars[0] || null); setShowDocUpload(true); }} style={{
          background: 'linear-gradient(135deg,#dc3545,#c82333)', color: '#fff', border: 'none',
          borderRadius: '50px', padding: '0.6rem 1.5rem', fontWeight: 700, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem',
          boxShadow: '0 4px 12px rgba(220,53,69,0.3)',
        }}>
          <i className="bi bi-upload"></i> Upload Document
        </button>
      </div>

      {/* Car filter pills */}
      {cars.length > 1 && (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          {[{ id: 'all', label: 'All vehicles' }, ...cars.map(c => ({ id: c.id, label: `${c.brand} ${c.model}` }))].map(item => (
            <button key={item.id} onClick={() => setDocFilterCar(item.id)} style={{
              padding: '0.35rem 1rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600,
              border: `2px solid ${docFilterCar === item.id ? '#dc3545' : '#e9ecef'}`,
              background: docFilterCar === item.id ? '#dc3545' : '#f8f9fa',
              color: docFilterCar === item.id ? '#fff' : '#495057', cursor: 'pointer',
            }}>{item.label}</button>
          ))}
        </div>
      )}

      {/* Upload form */}
      {showDocUpload && (
        <div style={{ background: '#fff', border: '2px solid #e9ecef', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
          <h5 style={{ fontWeight: 800, marginBottom: '1rem' }}>📎 Upload Document</h5>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontWeight: 600, fontSize: '0.85rem', color: '#6c757d', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>Vehicle</label>
            <select value={docUploadCar?.id || ''} onChange={e => setDocUploadCar(cars.find(c => c.id === parseInt(e.target.value)))}
              style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '10px', border: '2px solid #e9ecef', fontSize: '0.95rem', outline: 'none' }}>
              {cars.map(car => <option key={car.id} value={car.id}>{car.brand} {car.model} ({car.year})</option>)}
            </select>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontWeight: 600, fontSize: '0.85rem', color: '#6c757d', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>Document name / note</label>
            <input type="text" value={docUploadNote} onChange={e => setDocUploadNote(e.target.value)} placeholder="e.g. Insurance contract 2026"
              style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '10px', border: '2px solid #e9ecef', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontWeight: 600, fontSize: '0.85rem', color: '#6c757d', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>File</label>
            <label style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '10px',
              border: `2px dashed ${docUploadFile ? '#dc3545' : '#ced4da'}`,
              background: docUploadFile ? '#fff5f5' : '#f8f9fa', cursor: 'pointer',
              fontWeight: 600, color: docUploadFile ? '#dc3545' : '#6c757d',
            }}>
              <i className="bi bi-file-earmark-arrow-up" style={{ fontSize: '1.3rem' }}></i>
              {docUploadFile ? docUploadFile.name : 'Click to select a file (PDF, JPG, PNG)'}
              <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" style={{ display: 'none' }}
                onChange={e => setDocUploadFile(e.target.files[0] || null)} />
            </label>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button onClick={() => { setShowDocUpload(false); setDocUploadFile(null); setDocUploadNote(''); }}
              style={{ padding: '0.55rem 1.4rem', borderRadius: '50px', border: '2px solid #e9ecef', background: '#fff', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleDocUpload} disabled={!docUploadFile || !docUploadCar || docUploading} style={{
              padding: '0.55rem 1.4rem', borderRadius: '50px', border: 'none',
              background: (!docUploadFile || !docUploadCar || docUploading) ? '#adb5bd' : 'linear-gradient(135deg,#dc3545,#c82333)',
              color: '#fff', fontWeight: 700, cursor: (!docUploadFile || !docUploadCar || docUploading) ? 'not-allowed' : 'pointer',
            }}>{docUploading ? 'Uploading…' : '⬆ Upload'}</button>
          </div>
        </div>
      )}

      {/* Documents grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#adb5bd' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📂</div>
          <p style={{ fontWeight: 600, fontSize: '1.1rem', margin: 0 }}>No documents yet</p>
          <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Attach files when adding a service or use Upload Document above.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1rem' }}>
          {filtered.map(svc => {
            const car = cars.find(c => c.id === svc.carId);
            const ext = getFileExt(svc.fileUrl);
            const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext);
            return (
              <div key={svc.id} style={{ background: '#fff', border: '2px solid #e9ecef', borderRadius: '16px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#dc3545'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e9ecef'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                {isImage
                  ? <img src={svc.fileUrl} alt="doc" style={{ width: '100%', height: '130px', objectFit: 'cover', borderRadius: '10px' }} />
                  : <div style={{ width: '100%', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff5f5', borderRadius: '10px', fontSize: '2.5rem' }}>{extIcon(ext)}</div>
                }
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1a1a1a', marginBottom: '0.25rem' }}>{getServiceIcon(svc.serviceType)} {getServiceName(svc.serviceType)}</div>
                  {svc.notes && <div style={{ fontSize: '0.82rem', color: '#6c757d', marginBottom: '0.25rem' }}>{svc.notes}</div>}
                  {car && <div style={{ fontSize: '0.82rem', color: '#dc3545', fontWeight: 700 }}>🚗 {car.brand} {car.model}</div>}
                  <div style={{ fontSize: '0.8rem', color: '#adb5bd', marginTop: '0.2rem' }}>{svc.expiryDate ? new Date(svc.expiryDate).toLocaleDateString('en-US') : ''}</div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                  <a href={svc.fileUrl} target="_blank" rel="noreferrer" style={{ flex: 1, textAlign: 'center', padding: '0.45rem 0', borderRadius: '50px', border: '2px solid #dc3545', color: '#dc3545', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none' }}>👁 View</a>
                  <a href={svc.fileUrl} download style={{ flex: 1, textAlign: 'center', padding: '0.45rem 0', borderRadius: '50px', border: 'none', background: 'linear-gradient(135deg,#dc3545,#c82333)', color: '#fff', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none' }}>⬇ Download</a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Documents;
