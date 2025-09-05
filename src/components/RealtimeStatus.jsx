import { useState, useEffect } from 'react';
import { realtimeManager } from '../services/realtimeManager';

/**
 * Component để hiển thị trạng thái real-time connections (chỉ trong development)
 */
function RealtimeStatus() {
  const [status, setStatus] = useState({});
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Chỉ hiển thị trong development
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    const updateStatus = () => {
      setStatus(realtimeManager.getStatus());
    };

    // Update status mỗi 2 giây
    const interval = setInterval(updateStatus, 2000);
    updateStatus(); // Initial update

    return () => clearInterval(interval);
  }, []);

  // Không hiển thị trong production
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      zIndex: 9999,
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '8px',
      borderRadius: '4px',
      fontSize: '12px',
      cursor: 'pointer',
      maxWidth: isVisible ? '300px' : '120px',
      transition: 'all 0.3s ease'
    }} onClick={() => setIsVisible(!isVisible)}>
      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
        🔄 Real-time Status {isVisible ? '▼' : '▶'}
      </div>
      
      {isVisible && (
        <div>
          <div>Active Listeners: {status.activeListeners?.length || 0}</div>
          <div>Data Keys: {status.dataKeys?.length || 0}</div>
          <div>Callback Keys: {status.callbackKeys?.length || 0}</div>
          
          {status.activeListeners?.length > 0 && (
            <div style={{ marginTop: '8px' }}>
              <div style={{ fontWeight: 'bold' }}>Active:</div>
              {status.activeListeners.map((key, index) => (
                <div key={index} style={{ paddingLeft: '8px', fontSize: '10px' }}>
                  • {key}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default RealtimeStatus;
