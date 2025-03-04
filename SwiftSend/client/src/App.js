// App.js
import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import SimplePeer from 'simple-peer';
import { FiUpload, FiCopy, FiFile, FiDownload, FiX } from 'react-icons/fi';
import './App.css';

const socket = io('http://localhost:5000');

const App = () => {
  // State Management
  const [peer, setPeer] = useState(null);
  const [peerId, setPeerId] = useState('');
  const [targetPeerId, setTargetPeerId] = useState('');
  const [receivedFiles, setReceivedFiles] = useState([]);
  const [file, setFile] = useState(null);
  const [connected, setConnected] = useState(false);
  const [dragover, setDragover] = useState(false);
  const [showReceived, setShowReceived] = useState(false);

  // WebSocket Setup
  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to signaling server');
    });

    socket.on('peer-id', (id) => {
      setPeerId(id);
    });

    socket.on('signal', ({ signal, from }) => {
      if (peer) peer.signal(signal);
    });

    socket.on('connect_error', (err) => {
      console.error('Connection error:', err);
    });

    return () => {
      socket.off('peer-id');
      socket.off('signal');
      socket.off('connect_error');
    };
  }, [peer]);

  // Peer Connection Functions
  const createPeer = () => {
    if (!targetPeerId) return alert('Enter target Peer ID!');
    const newPeer = new SimplePeer({ initiator: true, trickle: false });
    
    newPeer.on('signal', signal => {
      socket.emit('signal', { signal, target: targetPeerId });
    });

    newPeer.on('connect', () => setConnected(true));
    newPeer.on('data', data => {
      setReceivedFiles(prev => [...prev, URL.createObjectURL(new Blob([data]))]);
    });
    
    newPeer.on('error', err => console.error('Peer error:', err));
    setPeer(newPeer);
  };

  const joinPeer = () => {
    if (!targetPeerId) return alert('Enter target Peer ID!');
    const newPeer = new SimplePeer({ initiator: false, trickle: false });
    
    newPeer.on('signal', signal => {
      socket.emit('signal', { signal, target: targetPeerId });
    });

    newPeer.on('connect', () => setConnected(true));
    newPeer.on('data', data => {
      setReceivedFiles(prev => [...prev, URL.createObjectURL(new Blob([data]))]);
    });
    
    newPeer.on('error', err => console.error('Peer error:', err));
    setPeer(newPeer);
    setShowReceived(true);
  };

  // File Handling
  const sendFile = () => {
    if (peer && file) peer.send(file);
    else alert('No connection or file selected!');
  };

  const handleFileChange = e => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = (event) => setFile(event.target.result);
      reader.readAsArrayBuffer(selectedFile);
    }
  };

  // Drag & Drop Handlers
  const handleDragOver = e => {
    e.preventDefault();
    setDragover(true);
  };

  const handleDragLeave = () => setDragover(false);

  const handleDrop = e => {
    e.preventDefault();
    setDragover(false);
    handleFileChange({ target: { files: e.dataTransfer.files } });
  };

  // Clipboard Function
  const copyPeerId = async () => {
    try {
      await navigator.clipboard.writeText(peerId);
      alert('Peer ID copied!');
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>SWIFTSEND</h1>
        <nav>
          <button className="nav-btn">ABOUT</button>
          <button className="nav-btn">CONTRIBUTE</button>
        </nav>
      </header>

      <main className="main-grid">
        {/* Left Column */}
        <div className="left-column">
          <div className="peer-id-box">
            <label>YOUR PEER ID:</label>
            <div className="peer-id-display">
              <span>{peerId || 'Generating...'}</span>
              <button onClick={copyPeerId} className="copy-btn">
                <FiCopy />
              </button>
            </div>
          </div>

          <div className="action-section">
            <h2>CREATE PEER</h2>
            <input
              type="text"
              placeholder="ENTER PEER ID"
              value={targetPeerId}
              onChange={(e) => setTargetPeerId(e.target.value)}
            />
            <button className="action-btn" onClick={createPeer}>
              Initialize
            </button>
          </div>

          <div className="action-section">
            <h2>JOIN PEER</h2>
            <input
              type="text"
              placeholder="ENTER PEER ID"
              value={targetPeerId}
              onChange={(e) => setTargetPeerId(e.target.value)}
            />
            <button className="action-btn" onClick={joinPeer}>
              Connect
            </button>
          </div>
        </div>

        {/* Right Column */}
        <div className="right-column">
          <div className="file-section">
            <div 
              className={`file-dropzone ${dragover ? 'active' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <FiUpload className="upload-icon" />
              <p>SELECTFILE</p>
              <input
                type="file"
                onChange={handleFileChange}
                id="fileInput"
                className="hidden-input"
              />
              <label htmlFor="fileInput" className="browse-btn">
                Choose File
              </label>
            </div>
            <button 
              className="send-btn"
              onClick={sendFile}
              disabled={!connected || !file}
            >
              SEND FILE
            </button>
          </div>

          {showReceived && (
            <div className="received-files">
              <div className="modal-header">
                <h3>RECEIVED FILE</h3>
                <button 
                  onClick={() => setShowReceived(false)} 
                  className="close-button"
                >
                  <FiX className="icon" />
                </button>
              </div>
              <div className="file-list">
                {receivedFiles.length === 0 ? (
                  <div className="empty-state">
                    <FiFile />
                    <p>No files received</p>
                  </div>
                ) : (
                  receivedFiles.map((fileUrl, index) => (
                    <div className="file-item" key={index}>
                      <span>File_{index + 1}</span>
                      <a href={fileUrl} download className="download-link">
                        <FiDownload />
                      </a>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;