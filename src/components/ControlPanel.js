import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Weight, Scale } from 'lucide-react';

const ControlPanel = ({ 
  currentAngle, 
  onAngleChange, 
  mode, 
  onModeChange,
  masse,
  onMassChange,
  darkMode = false
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const canvasRef = useRef(null);
  
  const handleModeChange = (e) => {
    const newMode = e.target.value;
    onModeChange(newMode);
    
    if (newMode === 'automatic') {
      setIsRunning(true);
    } else {
      setIsRunning(false);
    }
  };
  
  const handleMassChange = (e) => {
    const newMass = parseFloat(e.target.value);
    onMassChange(newMass);
  };
  
  const toggleAutoMode = () => {
    if (mode === 'automatic') {
      setIsRunning(!isRunning);
    }
  };
  
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height - 10;
    const radius = height - 30;
    
    ctx.clearRect(0, 0, width, height);
    
    ctx.fillStyle = darkMode ? '#1a202c' : '#111';
    ctx.fillRect(0, 0, width, height);
    
    ctx.strokeStyle = '#3f3';
    ctx.lineWidth = 1;
    
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, (radius / 3) * i, Math.PI, 2 * Math.PI);
      ctx.stroke();
    }
    
    for (let angle = 0; angle <= 180; angle += 15) {
      const rad = (Math.PI / 180) * angle;
      const x = centerX + Math.cos(rad) * radius;
      const y = centerY - Math.sin(rad) * radius;
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.stroke();
      
      const labelX = centerX + Math.cos(rad) * (radius + 15);
      const labelY = centerY - Math.sin(rad) * (radius + 15);
      
      ctx.fillStyle = '#3f3';
      ctx.font = '10px Arial';
      ctx.fillText(`${angle}°`, labelX - 8, labelY);
    }
    
    const rad = (Math.PI / 180) * currentAngle;
    const x = centerX + Math.cos(rad) * radius;
    const y = centerY - Math.sin(rad) * radius;
    
    ctx.strokeStyle = '#f33';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(x, y);
    ctx.stroke();
    
    ctx.fillStyle = '#f33';
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, 2 * Math.PI);
    ctx.fill();
    
  }, [currentAngle, darkMode]);
  
  const getWeightInfo = () => {
    const predefinedWeights = [20, 40, 50, 70, 90, 100];
    const isPredefined = predefinedWeights.includes(masse);
    
    if (masse === 0) {
      return { 
        weights: [], 
        type: 'none',
        display: '0g'
      };
    }
    
    if (isPredefined) {
      if (masse === 20) {
        return { 
          weights: [{ type: '20g', value: 20 }], 
          type: 'predefined',
          display: '20g'
        };
      } 
      else if (masse === 40) {
        return { 
          weights: [
            { type: '20g', value: 20 },
            { type: '20g', value: 20 }
          ], 
          type: 'predefined',
          display: '40g (20g+20g)'
        };
      }
      else if (masse === 50) {
        return { 
          weights: [{ type: '50g', value: 50 }], 
          type: 'predefined',
          display: '50g'
        };
      }
      else if (masse === 70) {
        return { 
          weights: [
            { type: '50g', value: 50 },
            { type: '20g', value: 20 }
          ], 
          type: 'predefined',
          display: '70g (50g+20g)'
        };
      }
      else if (masse === 90) {
        return { 
          weights: [
            { type: '50g', value: 50 },
            { type: '20g', value: 20 },
            { type: '20g', value: 20 }
          ], 
          type: 'predefined',
          display: '90g (50g+20g+20g)'
        };
      }
      else if (masse === 100) {
        return { 
          weights: [
            { type: '50g', value: 50 },
            { type: '20g', value: 20 },
            { type: '20g', value: 20 },
            { type: '10g', value: 10 }
          ], 
          type: 'predefined',
          display: '100g (50g+20g+20g+10g)'
        };
      }
    }
    
    return {
      weights: [],
      type: 'automatic',
      display: `${Math.floor(masse)}g (détecté)`
    };
  };
  
  const weightInfo = getWeightInfo();
  
  const getLoadPercentage = () => {
    const maxWeight = 500; // 500g maximum
    return Math.min((masse / maxWeight) * 100, 100);
  };
  
  return (
    <div className={`flex flex-col space-y-6 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Angle actuel:</h3>
        <span className="text-2xl font-bold">{currentAngle}°</span>
      </div>
      
      <div className="mb-4">
        <label className="block mb-2 font-medium">
          Mode de fonctionnement:
        </label>
        <div className="flex items-center space-x-4">
          <select
            value={mode}
            onChange={handleModeChange}
            className={`border rounded-md p-2 flex-1 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
          >
            <option value="manual">Manuel</option>
            <option value="automatic">Automatique (Balance)</option>
          </select>
          
          {mode === 'automatic' && (
            <button
              onClick={toggleAutoMode}
              className={`p-2 rounded-md ${isRunning ? 'bg-red-500' : 'bg-green-500'} text-white`}
              title={isRunning ? 'Arrêter la balance' : 'Démarrer la balance'}
            >
              {isRunning ? <Pause size={20} /> : <Play size={20} />}
            </button>
          )}
        </div>
      </div>
      
      {mode === 'manual' && (
        <div className="mt-4">
          <label className="block mb-2 font-medium flex items-center">
            <Weight size={18} className="mr-2" />
            Masse appliquée (g):
          </label>
          <div className="flex items-center">
            <input
              type="range"
              min="0"
              max="500"
              step="10"
              value={masse}
              onChange={handleMassChange}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <span className="ml-4 text-xl font-bold min-w-16 text-center">
              {masse.toFixed(0)}
            </span>
          </div>
          <div className="flex justify-between mt-1 text-sm text-gray-600">
            <span>0g</span>
            <span>125g</span>
            <span>250g</span>
            <span>500g</span>
          </div>
        </div>
      )}

      {mode === 'automatic' && (
        <div className="mt-4 p-4 border border-blue-300 rounded-lg bg-blue-50 dark:bg-blue-900">
          <div className="flex items-center mb-3">
            <Scale size={20} className="mr-2 text-blue-600" />
            <h4 className="font-semibold text-blue-800 dark:text-blue-200">Mode Balance Automatique</h4>
          </div>
          
          <div className="space-y-3">
            <div>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Placez un objet sur la balance. Détection automatique jusqu'à 500g.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-3 rounded-md">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Masse détectée:</span>
                <span className="text-lg font-bold text-blue-600">{weightInfo.display}</span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getLoadPercentage()}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0g</span>
                <span>{getLoadPercentage().toFixed(1)}%</span>
                <span>500g</span>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-3 rounded-md">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Flexion de la lame:</span>
                <span className="text-sm font-bold">
                  {((masse / 500) * 40).toFixed(1)}° / 40° max
                </span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(masse / 500) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-4">
        <h4 className="text-lg font-medium mb-2">Visualisation de l'angle</h4>
        <canvas
          ref={canvasRef}
          width="400"
          height="180"
          className="w-full border border-gray-300 rounded-lg"
        />
      </div>
      
      <div className="mt-3 p-3 border border-gray-300 rounded-md">
        <div className="flex justify-between mb-2">
          <p className="text-sm font-medium">
            {weightInfo.type === 'automatic' ? 'Objet détecté:' : 'Poids actifs:'}
          </p>
          {weightInfo.type !== 'none' && (
            <p className="text-sm font-medium">
              {weightInfo.type === 'automatic' 
                ? `${Math.floor(masse)}g` 
                : `Total: ${masse}g`
              }
            </p>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2">
          {weightInfo.weights.length === 0 ? (
            <div className="flex items-center">
              {weightInfo.type === 'automatic' && masse > 0 ? (
                <div className="flex items-center space-x-2">
                  <Scale size={16} className="text-green-600" />
                  <span className="text-sm text-green-700 dark:text-green-400">
                    {weightInfo.display}
                  </span>
                </div>
              ) : (
                <span className="text-sm text-gray-500">
                  {mode === 'automatic' ? 'Aucun objet détecté' : 'Aucun poids'}
                </span>
              )}
            </div>
          ) : (
            weightInfo.weights.map((weight, idx) => (
              <div 
                key={idx} 
                className={`px-2 py-1 rounded-full text-xs ${
                  weight.type === '50g' 
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200' 
                    : 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200'
                }`}
              >
                {weight.type}
              </div>
            ))
          )}
        </div>
        
        {mode === 'automatic' && (
          <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-600 dark:text-gray-400">
            <p>
              🎯 Poids prédéfinis (affichage des poids): 20g, 40g, 50g, 70g, 90g, 100g
            </p>
            <p>
              ⚖️ Autres masses: détection automatique (partie entière)
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ControlPanel;