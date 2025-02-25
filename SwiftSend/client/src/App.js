import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import SimplePeer from "simple-peer";
import "./App.css";

const socket = io("http://localhost:5000"); 

const App = () => {
  const [peer, setPeer] = useState(null); 
  const [peerId, setPeerId] = useState(""); 
  const [targetPeerId, setTargetPeerId] = useState(""); 
  const [receivedFiles, setReceivedFiles] = useState([]); 
  const [file, setFile] = useState(null); 
  const [connected, setConnected] = useState(false); 

  
  useEffect(() => {
    
    socket.on("connect", () => {
      console.log("Connected to signaling server. Socket ID:", socket.id);
    });

    
    socket.on("peer-id", (id) => {
      console.log("Your Peer ID:", id);
      setPeerId(id);
    });

    
    socket.on("signal", ({ signal, from }) => {
      console.log(`Signal received from Peer ${from}`);
      if (peer) {
        peer.signal(signal); 
      }
    });

    
    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
    });

    socket.on("disconnect", () => {
      console.warn("Disconnected from signaling server.");
    });

    return () => {
      socket.off("peer-id");
      socket.off("signal");
      socket.off("connect_error");
      socket.off("disconnect");
    };
  }, [peer]);

  const createPeer = () => {
    if (!targetPeerId) {
      alert("Please enter a target peer ID!");
      return;
    }

    const newPeer = new SimplePeer({ initiator: true, trickle: false });
    setPeer(newPeer);

    newPeer.on("signal", (signal) => {
      console.log("Sending signal to signaling server...");
      socket.emit("signal", { signal, target: targetPeerId });
    });

    newPeer.on("connect", () => {
      console.log("Connected to Peer!");
      setConnected(true);
    });

    newPeer.on("data", (data) => {
      console.log("File received");
      const receivedFile = new Blob([data]);
      setReceivedFiles((prevFiles) => [
        ...prevFiles,
        URL.createObjectURL(receivedFile),
      ]);
    });

    newPeer.on("error", (err) => {
      console.error("Peer error:", err);
    });
  };

  const joinPeer = () => {
    if (!targetPeerId) {
      alert("Please enter a target peer ID!");
      return;
    }

    const newPeer = new SimplePeer({ initiator: false, trickle: false });
    setPeer(newPeer);

    newPeer.on("signal", (signal) => {
      console.log("Sending signal to signaling server...");
      socket.emit("signal", { signal, target: targetPeerId });
    });

    newPeer.on("connect", () => {
      console.log("Connected to Peer!");
      setConnected(true);
    });

    newPeer.on("data", (data) => {
      console.log("File received");
      const receivedFile = new Blob([data]);
      setReceivedFiles((prevFiles) => [
        ...prevFiles,
        URL.createObjectURL(receivedFile),
      ]);
    });

    newPeer.on("error", (err) => {
      console.error("Peer error:", err);
    });
  };

  const sendFile = () => {
    if (peer && file) {
      console.log("Sending file...");
      peer.send(file);
    } else {
      alert("No peer connected or file selected!");
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFile(event.target.result); 
      };
      reader.readAsArrayBuffer(selectedFile);
    }
  };

  return (
    <div className="app-container">
      <div className="left-panel">
        <h1>SwiftSend - File Sharing</h1>
        <p>
          Your Peer ID: <strong>{peerId || "Loading..."}</strong>
        </p>
        <input
          type="text"
          placeholder="Enter Target Peer ID"
          value={targetPeerId}
          onChange={(e) => setTargetPeerId(e.target.value)}
          className="peer-input"
        />
        <button onClick={createPeer} className="action-button">
          Create Peer
        </button>
        <button onClick={joinPeer} className="action-button">
          Join Peer
        </button>
        <input
          type="file"
          onChange={handleFileChange}
          className="file-input"
          disabled={!connected}
        />
        <button onClick={sendFile} className="action-button" disabled={!connected}>
          Send File
        </button>
      </div>
      <div className="right-panel">
        <h2>Received Files</h2>
        <ul>
          {receivedFiles.length === 0 ? (
            <li>No files received yet.</li>
          ) : (
            receivedFiles.map((fileUrl, index) => (
              <li key={index}>
                <a href={fileUrl} download={`file-${index + 1}`}>
                  Download File {index + 1}
                </a>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
};

export default App;
