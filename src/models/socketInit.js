import io from 'socket.io-client';

const connectionOptions = {
  "force new connection": true,
  reconnectionAttempts: "Infinity",
  timeout: 10000,
  transports: ["websocket"],
};

const socket = io.connect("http://localhost:5000", connectionOptions);

socket.on('connect', () => {
  console.log('Connecté au serveur Socket.io');
});

socket.on('connect_error', (error) => {
  console.error('Erreur de connexion Socket.io:', error);
});

socket.on('disconnect', () => {
  console.log('Déconnecté du serveur Socket.io');
});

export default socket;