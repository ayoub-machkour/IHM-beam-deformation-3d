import socket from '../models/socketInit';

const serialController = {
  sendManualCommand: (masse) => {
    if (!socket.connected) {
      console.error('❌ Socket non connecté');
      return;
    }
    
    const command = `1,${Math.floor(masse)}e`;
    console.log('📤 [DEBUG] Envoi commande manuel:', {
      masse_input: masse,
      masse_envoyee: Math.floor(masse),
      command_complet: command,
      longueur: command.length
    });
    
    socket.emit('message', command);
  },
  
  activateAutomaticMode: () => {
    if (!socket.connected) {
      console.error('❌ Socket non connecté');
      return;
    }
    
    const command = `2,1e`;
    console.log('🤖 [DEBUG] Activation mode automatique:', command);
    socket.emit('message', command);
  },
  
  deactivateAutomaticMode: () => {
    if (!socket.connected) {
      console.error('❌ Socket non connecté');
      return;
    }
    
    const command = `2,0e`;
    console.log('🔧 [DEBUG] Passage en mode manuel:', command);
    socket.emit('message', command);
  },
  
  processSerialData: (data) => {
    const processed = {};
    
    console.log('📡 [DEBUG] Données brutes reçues:', {
      data: data,
      type: typeof data,
      length: data ? data.length : 0
    });
    
    if (data.startsWith('V:')) {
      const value = parseFloat(data.substring(2));
      processed.type = 'voltage';
      processed.value = value;
    } else if (data.startsWith('M:')) {
      let value = parseFloat(data.substring(2));
      processed.type = 'mass';
      
      const predefinedWeights = [20, 40, 50, 70, 90, 100];
      if (predefinedWeights.includes(value)) {
        processed.value = value;
        processed.isPredefined = true;
      } else {
        processed.value = Math.floor(value);
        processed.isPredefined = false;
      }
      
      if (processed.value > 500) {
        processed.value = 500;
      }
      
    } else if (data.startsWith('F:')) {
      const value = parseFloat(data.substring(2));
      processed.type = 'force';
      processed.value = value;
    } else if (data.startsWith('A:')) {
      const value = parseInt(data.substring(2));
      processed.type = 'angle';
      processed.value = value;
    } else if (data.startsWith('ACK:')) {
      const ack = data.substring(4);
      const parts = ack.split(',');
      processed.type = 'ack';
      processed.mode = parts[0];
      processed.angle = parts[1];
      
      console.log('✅ [DEBUG] ACK reçu du STM32:', {
        ack_complet: ack,
        mode: processed.mode,
        angle: processed.angle
      });
    } else if (data.includes('RX_CB') || data.includes('COMMAND') || data.includes('MANUAL')) {
      console.log('🔧 [STM32-DEBUG]:', data);
      processed.type = 'debug';
      processed.message = data;
    }
    
    return processed;
  }
};

socket.on('connect', () => {
  console.log('🔌 [DEBUG] Socket connecté - ID:', socket.id);
});

socket.on('disconnect', () => {
  console.error('🔌 [DEBUG] Socket déconnecté');
});

socket.on('connect_error', (error) => {
  console.error('🔌 [DEBUG] Erreur de connexion:', error.message);
});

socket.on('error', (error) => {
  console.error('❌ [DEBUG] Erreur socket:', error);
});

export default serialController;