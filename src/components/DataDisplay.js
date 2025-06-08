import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const DataDisplay = ({ 
  tension, 
  masse, 
  force, 
  deformation, 
  tensionData = [],
  darkMode = false
}) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  
  useEffect(() => {
    if (!chartRef.current || !tensionData || tensionData.length === 0) return;
    
    if (chartInstance.current) {
      chartInstance.current.data.labels = tensionData.map((_, i) => i);
      chartInstance.current.data.datasets[0].data = tensionData;
      chartInstance.current.update();
    } else {
      const ctx = chartRef.current.getContext('2d');
      
      chartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: tensionData.map((_, i) => i),
          datasets: [{
            label: 'Tension (V)',
            data: tensionData,
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            tension: 0.2,
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 3
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              display: true,
              title: {
                display: true,
                text: 'Échantillons',
                color: darkMode ? '#e5e7eb' : '#1f2937'
              },
              ticks: {
                maxTicksLimit: 10,
                color: darkMode ? '#9ca3af' : '#6b7280'
              },
              grid: {
                color: darkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(209, 213, 219, 0.5)'
              }
            },
            y: {
              display: true,
              title: {
                display: true,
                text: 'Tension (V)',
                color: darkMode ? '#e5e7eb' : '#1f2937'
              },
              min: 0,
              max: 2,
              suggestedMax: 2,
              ticks: {
                color: darkMode ? '#9ca3af' : '#6b7280'
              },
              grid: {
                color: darkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(209, 213, 219, 0.5)'
              }
            }
          },
          animation: {
            duration: 0
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              mode: 'index',
              intersect: false,
              backgroundColor: darkMode ? 'rgba(17, 24, 39, 0.8)' : 'rgba(255, 255, 255, 0.8)',
              titleColor: darkMode ? '#e5e7eb' : '#1f2937',
              bodyColor: darkMode ? '#e5e7eb' : '#1f2937',
              borderColor: darkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(209, 213, 219, 0.5)',
              borderWidth: 1
            }
          }
        }
      });
    }
  }, [tensionData, darkMode]);
  
  const formatValue = (value, decimals = 2, unit = '') => {
    if (value === null || value === undefined) return 'N/A';
    return `${value.toFixed(decimals)} ${unit}`;
  };
  
  const cardClass = darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200';
  const iconBgClass = darkMode ? 'bg-gray-600' : 'bg-blue-100';
  const textColorClass = darkMode ? 'text-white' : 'text-gray-800';
  const subTextColorClass = darkMode ? 'text-gray-300' : 'text-gray-600';
  
  return (
    <div className="flex flex-col space-y-4">
      <div className={`rounded-lg p-4 border ${cardClass}`}>
        <h3 className={`text-lg font-semibold mb-2 ${textColorClass}`}>Tension en temps réel</h3>
        <div className="h-40">
          <canvas ref={chartRef} />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className={`rounded-lg p-4 border ${cardClass} flex items-center`}>
          <div className={`p-2 ${iconBgClass} rounded-full mr-3`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
              <circle cx="12" cy="12" r="8"></circle>
              <path d="M12 2v2"></path>
              <path d="M12 20v2"></path>
              <path d="M20 12h2"></path>
              <path d="M2 12h2"></path>
              <path d="M15 15l2 2"></path>
              <path d="M7 7l2 2"></path>
              <path d="M15 9l2-2"></path>
              <path d="M7 17l2-2"></path>
            </svg>
          </div>
          <div>
            <p className={`text-sm ${subTextColorClass}`}>Tension</p>
            <p className={`text-xl font-bold ${textColorClass}`}>{formatValue(tension, 3, 'V')}</p>
          </div>
        </div>
        
        <div className={`rounded-lg p-4 border ${cardClass} flex items-center`}>
          <div className={`p-2 bg-green-100 rounded-full mr-3`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
              <circle cx="12" cy="12" r="8"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12" y2="16"></line>
            </svg>
          </div>
          <div>
            <p className={`text-sm ${subTextColorClass}`}>Masse</p>
            <p className={`text-xl font-bold ${textColorClass}`}>{formatValue(masse, 1, 'g')}</p>
          </div>
        </div>
        
        <div className={`rounded-lg p-4 border ${cardClass} flex items-center`}>
          <div className={`p-2 bg-purple-100 rounded-full mr-3`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600">
              <path d="M12 2v7"></path>
              <path d="M12 22v-7"></path>
              <path d="M5 12H2"></path>
              <path d="M22 12h-3"></path>
              <path d="m4.93 4.93 2.83 2.83"></path>
              <path d="m16.24 16.24 2.83 2.83"></path>
              <path d="m4.93 19.07 2.83-2.83"></path>
              <path d="m16.24 7.76 2.83-2.83"></path>
            </svg>
          </div>
          <div>
            <p className={`text-sm ${subTextColorClass}`}>Force</p>
            <p className={`text-xl font-bold ${textColorClass}`}>{formatValue(force, 3, 'N')}</p>
          </div>
        </div>
        
        <div className={`rounded-lg p-4 border ${cardClass} flex items-center`}>
          <div className={`p-2 bg-amber-100 rounded-full mr-3`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600">
              <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2"></path>
            </svg>
          </div>
          <div>
            <p className={`text-sm ${subTextColorClass}`}>Déformation</p>
            <p className={`text-xl font-bold ${textColorClass}`}>{formatValue(deformation * 1000, 6, 'mm')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataDisplay;