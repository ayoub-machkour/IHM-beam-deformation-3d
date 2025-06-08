const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

let serialPort;
let parser;
const PORT = 'COM7'; 
const BAUD_RATE = 115200;

let messageCount = 0;
let dataReceivedCount = 0;
let isSerialConnected = false;

function initializeSerialPort() {
  try {
    serialPort = new SerialPort({
      path: PORT,
      baudRate: BAUD_RATE,
    });

    parser = serialPort.pipe(new ReadlineParser({ delimiter: '\r\n' }));

    serialPort.on('open', () => {
      console.log(`✅ Port série ${PORT} ouvert avec succès`);
      console.log(`📊 Configuration: ${BAUD_RATE} bauds`);
      isSerialConnected = true;
    });

    serialPort.on('error', (err) => {
      console.error('❌ Erreur du port série:', err.message);
      isSerialConnected = false;
    });

    serialPort.on('close', () => {
      console.log('🔌 Port série fermé');
      isSerialConnected = false;
    });

    parser.on('data', (data) => {
      dataReceivedCount++;
      
      if (data.includes('RX_CB') || data.includes('CHAR') || data.includes('CMD_COMPLETE')) {
        console.log(`📡 [STM32] DEBUG:`, data);
      } else if (data.startsWith('V:') || data.startsWith('M:') || data.startsWith('F:') || data.startsWith('A:')) {
        console.log(`📊 [STM32] DATA:`, data);
      }
      
      io.emit('serialData', data);
    });

  } catch (error) {
    console.error('❌ Impossible d\'ouvrir le port série:', error);
    isSerialConnected = false;
  }
}

initializeSerialPort();

io.on('connection', (socket) => {
  console.log('🔌 Client connecté:', socket.id);
  
  socket.emit('serialStatus', { connected: isSerialConnected });
  
  socket.on('message', (message) => {
    messageCount++;
    
    console.log(`📥 [REÇU #${messageCount}] Message du client:`, message);
    
    if (!message || typeof message !== 'string') {
      console.error('❌ Message invalide:', typeof message, message);
      socket.emit('error', { message: 'Format de message invalide' });
      return;
    }
    
    if (!isSerialConnected || !serialPort || !serialPort.isOpen) {
      console.error('❌ Port série non connecté');
      socket.emit('error', { 
        message: 'Carte STM32 non connectée', 
        details: 'Vérifiez la connexion USB et redémarrez le serveur' 
      });
      return;
    }
    
    serialPort.write(message, (err) => {
      if (err) {
        console.error('❌ Erreur d\'écriture sur le port série:', err.message);
        socket.emit('error', { message: 'Erreur d\'envoi au STM32' });
      } else {
        console.log('✅ Message envoyé au STM32:', message);
      }
    });
  });
  
  socket.on('test-connection', () => {
    console.log('🧪 Test de connexion reçu');
    socket.emit('test-response', { 
      status: 'ok', 
      serialPortOpen: isSerialConnected,
      messageCount: messageCount,
      dataReceivedCount: dataReceivedCount,
      timestamp: new Date().toISOString()
    });
  });
  
  socket.on('disconnect', () => {
    console.log('🔌 Client déconnecté:', socket.id);
  });
});

function testSerialConnection() {
  if (isSerialConnected && serialPort && serialPort.isOpen) {
    console.log('✅ Port série actif');
  } else {
    console.log('⚠️ Port série non disponible - tentative de reconnexion...');
    setTimeout(() => {
      initializeSerialPort();
    }, 5000);
  }
}

setInterval(testSerialConnection, 30000);

setInterval(() => {
  if (messageCount > 0 || dataReceivedCount > 0) {
    console.log(`📊 Stats - Messages envoyés: ${messageCount}, Données reçues: ${dataReceivedCount}, Port série: ${isSerialConnected ? 'OK' : 'ERREUR'}`);
  }
}, 60000);

app.get('/status', (req, res) => {
  res.json({
    server: 'running',
    serialPort: {
      connected: isSerialConnected,
      port: PORT,
      baudRate: BAUD_RATE
    },
    stats: {
      messagesSent: messageCount,
      dataReceived: dataReceivedCount
    },
    timestamp: new Date().toISOString()
  });
});

process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt du serveur...');
  
  if (serialPort && serialPort.isOpen) {
    serialPort.close((err) => {
      if (err) {
        console.error('❌ Erreur fermeture port série:', err);
      } else {
        console.log('✅ Port série fermé');
      }
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

const PORT_SERVER = 5000;
server.listen(PORT_SERVER, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT_SERVER}`);
  console.log(`📡 Port série: ${PORT} @ ${BAUD_RATE} bauds`);
  console.log(`🔧 Connexion série: ${isSerialConnected ? 'OK' : 'EN ATTENTE'}`);
  console.log('📊 Endpoint status: http://localhost:5000/status');
});