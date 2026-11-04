const API_BASE = '/api';

export function getMediaUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:')) {
    return path;
  }
  // When running on Vite development port (5173), direct media directly to FastAPI port 8000
  if (typeof window !== 'undefined' && window.location.port === '5173') {
    return `http://${window.location.hostname}:8000${path}`;
  }
  return path;
}

export function getApiBaseUrl() {
  if (typeof window !== 'undefined' && window.location.port === '5173') {
    return `http://${window.location.hostname}:8000/api`;
  }
  return API_BASE;
}

export const api = {
  // Session list and management
  async getSessions() {
    const res = await fetch(`${getApiBaseUrl()}/sessions`);
    if (!res.ok) throw new Error('Failed to fetch sessions');
    return res.json();
  },

  async getSession(sessionId) {
    const res = await fetch(`${getApiBaseUrl()}/sessions/${sessionId}`);
    if (!res.ok) throw new Error(`Failed to fetch session ${sessionId}`);
    return res.json();
  },

  // Upload video - connects directly to FastAPI to bypass Vite proxy buffering
  async uploadVideo(file, onProgress) {
    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();
    return new Promise((resolve, reject) => {
      const uploadUrl = `${getApiBaseUrl()}/videos/upload`;
      xhr.open('POST', uploadUrl);

      if (onProgress && xhr.upload) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch (e) {
            resolve({ message: 'Success', response: xhr.responseText });
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.statusText}`));
        }
      };

      xhr.onerror = () => reject(new Error('Network error during upload'));
      xhr.send(formData);
    });
  },

  // Polling processing status
  async getStatus(sessionId) {
    const res = await fetch(`${getApiBaseUrl()}/analysis/${sessionId}/status`);
    if (!res.ok) throw new Error('Failed to fetch status');
    return res.json();
  },

  // Customers & timeline
  async getCustomers(sessionId) {
    const res = await fetch(`${getApiBaseUrl()}/analysis/${sessionId}/customers`);
    if (!res.ok) throw new Error('Failed to fetch customers');
    return res.json();
  },

  // Shelves & traffic
  async getShelves(sessionId) {
    const res = await fetch(`${getApiBaseUrl()}/analysis/${sessionId}/shelves`);
    if (!res.ok) throw new Error('Failed to fetch shelves');
    return res.json();
  },

  // Interaction events
  async getEvents(sessionId) {
    const res = await fetch(`${getApiBaseUrl()}/analysis/${sessionId}/events`);
    if (!res.ok) throw new Error('Failed to fetch events');
    return res.json();
  },

  // AI Recommendations
  async getRecommendations(sessionId, category = 'all', priority = 'all') {
    const params = new URLSearchParams();
    if (category && category !== 'all') params.append('category', category);
    if (priority && priority !== 'all') params.append('priority', priority);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${getApiBaseUrl()}/analysis/${sessionId}/recommendations${qs}`);
    if (!res.ok) throw new Error('Failed to fetch recommendations');
    return res.json();
  },

  // Session comparison
  async compareSessions(session1Id, session2Id) {
    const res = await fetch(`${getApiBaseUrl()}/sessions/compare?session1=${session1Id}&session2=${session2Id}`);
    if (!res.ok) throw new Error('Failed to compare sessions');
    return res.json();
  },

  // Generate synthetic / test CCTV video for instant verification
  async generateSampleVideo(type = 'retail_store') {
    const res = await fetch(`${getApiBaseUrl()}/videos/generate-sample?type=${type}`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to generate sample CCTV footage');
    return res.json();
  },

  // Export URLs
  getPdfReportUrl(sessionId) {
    return getMediaUrl(`/api/reports/${sessionId}/pdf`);
  },

  getCsvReportUrl(sessionId) {
    return getMediaUrl(`/api/reports/${sessionId}/csv`);
  }
};
