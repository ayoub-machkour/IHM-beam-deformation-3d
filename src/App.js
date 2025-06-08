import React, { useState, useEffect } from 'react';
import { Settings, Gauge, Database, ChevronUp, ChevronDown, RotateCcw, Download } from 'lucide-react';
import BeamModel3D from './components/BeamModel3D';
import ControlPanel from './components/ControlPanel';
import DataDisplay from './components/DataDisplay';
import socket from './models/socketInit';
import serialController from './controllers/serialController';
import { getVisibleWeights } from './utils/physicsCalculator';

function App() {
  // États principaux
  const [currentAngle, setCurrentAngle] = useState(180);
  const [mode, setMode] = useState("manual");
  const [masse, setMasse] = useState(0);
  const [deformation, setDeformation] = useState(0);
  const [force, setForce] = useState(0);
  const [voltage, setVoltage] = useState(0);
  const [realTimeData, setRealTimeData] = useState([]);
  const [hasConnection, setHasConnection] = useState(true);
  
  // États UI
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showDataPanel, setShowDataPanel] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [deformationSensitivity, setDeformationSensitivity] = useState(1);
  const [rotationSpeed, setRotationSpeed] = useState(1);
  
  // États des poids
  const [activeWeights, setActiveWeights] = useState([]);
  const availableWeights = [
    { id: 'weight-50g', value: 50 },
    { id: 'weight-20g-1', value: 20 },
    { id: 'weight-20g-2', value: 20 },
    { id: 'weight-10g', value: 10 }
  ];
  
  // Gestion des poids visibles
  useEffect(() => {
    const weightValues = getVisibleWeights(masse);
    const newActiveWeights = [];
    let remainingValues = [...weightValues];
    
    availableWeights.forEach(weight => {
      const valueIndex = remainingValues.indexOf(weight.value);
      if (valueIndex !== -1) {
        newActiveWeights.push(weight);
        remainingValues.splice(valueIndex, 1);
      }
    });
    
    setActiveWeights(newActiveWeights);
  }, [masse]);
  
  useEffect(() => {
  const fetchData = (data) => {
    try {
      if (typeof data !== 'string') return;
      
      const processed = serialController.processSerialData(data);
      
      switch (processed.type) {
        case 'voltage':
          setVoltage(processed.value);
          setRealTimeData(prev => [...prev.slice(-150), processed.value]);
          break;
        case 'mass':
          if (mode === 'automatic') {
            setMasse(processed.value);
            
            if (processed.isPredefined) {
              console.log(`⚖️ Balance: Poids prédéfini détecté - ${processed.value}g`);
            } else {
              console.log(`⚖️ Balance: Objet détecté - ${processed.value}g`);
            }
          } else if (mode === 'manual') {
            console.log(`🎮 Manuel: Masse simulée reçue - ${processed.value}g`);
          }
          break;
        case 'force':
          setForce(processed.value);
          break;
        case 'angle':
          setCurrentAngle(processed.value);
          
          if (mode === 'automatic') {
            // Calculer la déformation basée sur l'angle pour la balance
            const flexionAngle = 180 - processed.value;
            const deformationFromAngle = (flexionAngle / 40) * 0.002;
            setDeformation(deformationFromAngle);
          } else if (mode === 'manual') {
            const flexionAngle = 180 - processed.value;
            const deformationFromAngle = (flexionAngle / 40) * 0.001;
            setDeformation(deformationFromAngle);
            console.log(`🎮 Manuel: Servo positionné à ${processed.value}° (flexion: ${flexionAngle}°)`);
          }
          break;
        case 'ack':
          console.log('✅ ACK reçu:', processed);
          break;
      }
      
      if (!hasConnection) {
        setHasConnection(true);
      }
    } catch (error) {
      console.error("❌ Erreur traitement données:", error);
    }
  };
    
    const handleDisconnect = () => {
      console.log('🔌 Socket déconnecté');
      setHasConnection(false);
    };
    
    socket.on("serialData", fetchData);
    socket.on("disconnect", handleDisconnect);
    
    return () => {
      socket.off("serialData", fetchData);
      socket.off("disconnect", handleDisconnect);
    };
  }, [hasConnection, mode]);
  
  // Mode manuel - calculs locaux
  useEffect(() => {
  if (mode === 'manual') {
    console.log(`🎮 Mode manuel: Envoi poids ${masse}g au STM32`);
    
    serialController.sendManualCommand(masse);
    
  }
}, [masse, mode]);
  
  // Changement de mode
  const handleModeChange = (newMode) => {
    console.log(`🔄 Changement de mode: ${mode} -> ${newMode}`);
    setMode(newMode);
    
    if (newMode === "automatic") {
      console.log('⚖️ Activation du mode balance automatique');
      serialController.activateAutomaticMode();
      setMasse(0); 
    } else {
      console.log('🎮 Activation du mode manuel - Contrôle servo par poids');
      serialController.deactivateAutomaticMode();
      
      serialController.sendManualCommand(masse);
    }
};
  
 const handleMassChange = (newMass) => {
  if (mode === 'manual') {
    console.log(`⚖️ Changement poids en mode manuel: ${newMass}g`);
    setMasse(newMass);
  }
};
  
  // Export des données
  const exportData = () => {
    const exportObject = {
      timestamp: new Date().toISOString(),
      measurements: {
        tensionData: realTimeData,
        deformation: deformation,
        masse: masse,
        force: force,
        voltage: voltage,
        angle: currentAngle,
        activeWeights: activeWeights.map(w => w.value)
      },
      configuration: {
        mode: mode,
        settings: {
          deformationSensitivity,
          rotationSpeed
        }
      }
    };
    
    const jsonData = JSON.stringify(exportObject, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = `beam-measurements-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleReconnect = () => {
    console.log('🔄 Tentative de reconnexion...');
    socket.disconnect();
    setTimeout(() => {
      socket.connect();
    }, 500);
  };
  
  return (
    <div className={`${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'} min-h-screen transition-colors duration-300`}>
      {/* Header */}
      <header className={`${darkMode ? 'bg-gray-800' : 'bg-blue-600'} text-white p-4 shadow-md transition-colors duration-300`}>
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">IPS - Système de Déformation de Lame</h1>
          <div className="flex space-x-3">
            <button 
              onClick={() => setDarkMode(!darkMode)} 
              className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-blue-500 hover:bg-blue-400'} transition-colors`}
              title={darkMode ? "Mode clair" : "Mode sombre"}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
            <button 
              onClick={() => setShowAnalytics(!showAnalytics)} 
              className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-blue-500 hover:bg-blue-400'} transition-colors`}
              title="Analyse des données"
            >
              <Database size={20} />
            </button>
            <button 
              onClick={() => setShowSettings(!showSettings)} 
              className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-blue-500 hover:bg-blue-400'} transition-colors`}
              title="Paramètres"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Visualisation 3D */}
          <div className={`lg:col-span-2 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg overflow-hidden transition-colors duration-300`}>
            <div className={`p-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'} flex justify-between items-center transition-colors duration-300`}>
              <h2 className="text-lg font-semibold">Visualisation 3D de la Lame</h2>
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <RotateCcw size={18} className="text-gray-500 mr-2" />
                  <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{currentAngle}°</span>
                </div>
                
                <div className="flex items-center">
                  <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mr-2`}>Poids:</span>
                  <div className="flex">
                    {masse > 0 ? (
                      <div className="flex items-center space-x-2">
                        <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                          {masse}g
                        </span>
                        {activeWeights.length > 0 && (
                          <div className="flex">
                            {activeWeights.map((weight, index) => (
                              <span 
                                key={index} 
                                className={`inline-block px-2 py-1 text-xs rounded-full mr-1 ${darkMode ? 'bg-gray-700' : 'bg-blue-100'}`}
                              >
                                {weight.value}g
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-500">Aucun</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="h-[500px] lg:h-[600px]">
              <BeamModel3D 
                deformation={deformation * deformationSensitivity} 
                servoAngle={currentAngle}
                masse={masse}
                mode={mode}
              />
            </div>
          </div>
          
          {/* Panneau de contrôle */}
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg overflow-hidden transition-colors duration-300`}>
            <div className={`p-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'} transition-colors duration-300`}>
              <h2 className="text-lg font-semibold">Contrôles du Système</h2>
            </div>
            <div className="p-4">
              <ControlPanel 
                currentAngle={currentAngle} 
                onAngleChange={(angle) => console.log("Angle change:", angle)}
                mode={mode}
                onModeChange={handleModeChange}
                masse={masse}
                onMassChange={handleMassChange}
                darkMode={darkMode}
              />
            </div>
          </div>
        </div>
        
        {/* Panneau de données */}
        <div className={`mt-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg overflow-hidden transition-colors duration-300`}>
          <div 
            className={`p-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'} flex justify-between items-center cursor-pointer transition-colors duration-300`}
            onClick={() => setShowDataPanel(!showDataPanel)}
          >
            <h2 className="text-lg font-semibold flex items-center">
              <Gauge size={18} className="mr-2" />
              Données des Capteurs
            </h2>
            <button className="p-1">
              {showDataPanel ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>
          
          {showDataPanel && (
            <div className="p-4">
              <DataDisplay 
                tension={voltage}
                masse={masse}
                force={force}
                deformation={deformation}
                tensionData={realTimeData}
                darkMode={darkMode}
              />
            </div>
          )}
        </div>
        
        {/* Bouton d'export */}
        <div className="mt-6 flex justify-end">
          <button 
            onClick={exportData}
            className={`px-4 py-2 rounded-lg flex items-center ${darkMode ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-500 hover:bg-blue-400'} text-white transition-colors`}
          >
            <Download size={18} className="mr-2" />
            Exporter les Données
          </button>
        </div>
      </main>
      
      {/* Panneau d'analyse */}
      {showAnalytics && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-2xl p-6 w-3/4 max-w-4xl max-h-[80vh] overflow-auto transition-colors duration-300`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Analyse des Données</h2>
              <button 
                onClick={() => setShowAnalytics(false)}
                className={`${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} transition-colors duration-300`}>
                <h3 className="font-semibold mb-4">Statistiques</h3>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Nombre de mesures</p>
                    <p className="text-lg font-bold">{realTimeData.length}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Tension maximale</p>
                    <p className="text-lg font-bold">
                      {realTimeData.length > 0 ? Math.max(...realTimeData).toFixed(3) : 0} V
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Tension moyenne</p>
                    <p className="text-lg font-bold">
                      {realTimeData.length > 0 ? (realTimeData.reduce((a, b) => a + b, 0) / realTimeData.length).toFixed(3) : 0} V
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Déformation maximale</p>
                    <p className="text-lg font-bold">
                      {(deformation * 1000).toFixed(6)} mm
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Force appliquée</p>
                    <p className="text-lg font-bold">
                      {force.toFixed(3)} N
                    </p>
                  </div>
                </div>
              </div>
              
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} transition-colors duration-300`}>
                <h3 className="font-semibold mb-4">Relation Force-Déformation</h3>
                
                <div className="space-y-3">
                  <p>
                    La relation entre la force appliquée et la déformation suit la loi de Hooke 
                    dans la région élastique.
                  </p>
                  
                  <div className={`p-3 rounded ${darkMode ? 'bg-gray-800' : 'bg-white'} font-mono text-center transition-colors duration-300`}>
                    δ = F·L³ / (3·E·I)
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Ratio Force/Déformation</p>
                    <p className="text-lg font-bold">
                      {deformation > 0 ? (force / deformation).toFixed(2) : 0} N/mm
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Panneau des paramètres */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-2xl p-6 w-96 transition-colors duration-300`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Paramètres</h2>
              <button 
                onClick={() => setShowSettings(false)}
                className={`${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Paramètres d'affichage */}
              <div>
                <h3 className="font-semibold mb-3">Paramètres d'affichage</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Mode sombre</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={darkMode}
                        onChange={() => setDarkMode(!darkMode)}
                        className="sr-only peer" 
                      />
                      <div className={`w-11 h-6 rounded-full peer ${darkMode ? 'bg-blue-600' : 'bg-gray-300'} peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
                    </label>
                  </div>
                </div>
              </div>
              
              {/* Connexion */}
              <div>
                <h3 className="font-semibold mb-3">Connexion</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className={`h-3 w-3 rounded-full ${hasConnection ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span>État: {hasConnection ? 'Connecté' : 'Déconnecté'}</span>
                  </div>
                  
                  <button 
                    onClick={handleReconnect}
                    className={`px-4 py-2 rounded-md ${darkMode ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-500 hover:bg-blue-400'} text-white transition-colors w-full`}
                  >
                    Reconnecter
                  </button>
                </div>
              </div>
              
              {/* Paramètres du modèle */}
              <div>
                <h3 className="font-semibold mb-3">Paramètres du Modèle</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block mb-1 text-sm">Sensibilité de déformation</label>
                    <input
                      type="range"
                      min="0.1"
                      max="2"
                      step="0.1"
                      value={deformationSensitivity}
                      onChange={(e) => setDeformationSensitivity(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs mt-1">
                      <span>0.1x</span>
                      <span>{deformationSensitivity.toFixed(1)}x</span>
                      <span>2.0x</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Notification de perte de connexion */}
      {!hasConnection && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center">
          <div className="mr-3">⚠️</div>
          <div>
            <p className="font-semibold">Connexion Perdue</p>
            <p className="text-sm">Vérifiez la carte STM32</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;