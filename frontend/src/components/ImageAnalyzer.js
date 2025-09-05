import React, { useState } from 'react';
import { PhotoIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { inventoryAPI } from '../utils/api';

const ImageAnalyzer = ({ onAnalysisComplete, onDuplicateFound }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const handleImageUpload = async (file) => {
    if (!file) return;

    setAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      // Analyze image for category suggestion
      const analysisResponse = await fetch('/api/inventory/analyze-image/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: formData
      });

      if (analysisResponse.ok) {
        const analysisData = await analysisResponse.json();
        setAnalysis(analysisData);

        // Check for duplicates
        const duplicateResponse = await fetch('/api/inventory/check-duplicates/', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          },
          body: formData
        });

        if (duplicateResponse.ok) {
          const duplicateData = await duplicateResponse.json();
          
          if (duplicateData.duplicates_found) {
            onDuplicateFound && onDuplicateFound(duplicateData.duplicates);
          }
        }

        onAnalysisComplete && onAnalysisComplete(analysisData);
      }
    } catch (error) {
      console.error('Image analysis failed:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-4">
      {analysis && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <SparklesIcon className="h-5 w-5 text-blue-600" />
            <h4 className="font-medium text-blue-900">AI Analysis Results</h4>
          </div>
          
          <div className="space-y-2 text-sm">
            <p><strong>Suggested Category:</strong> {analysis.suggested_category}</p>
            
            {analysis.labels && analysis.labels.length > 0 && (
              <div>
                <strong>Detected Items:</strong>
                <div className="flex flex-wrap gap-1 mt-1">
                  {analysis.labels.slice(0, 5).map((label, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {analysis.detected_text && analysis.detected_text.length > 0 && (
              <div>
                <strong>Text Found:</strong>
                <div className="text-gray-600 mt-1">
                  {analysis.detected_text.slice(0, 3).join(', ')}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {analyzing && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-gray-600">Analyzing image...</span>
        </div>
      )}
    </div>
  );
};

export default ImageAnalyzer;