import React, { useState } from 'react';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { MicrophoneIcon, StopIcon } from '@heroicons/react/24/outline';

const VoiceCommands = ({ onCommand }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Voice recognition not supported in this browser');
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    recognition.onresult = (event) => {
      const command = event.results[0][0].transcript.toLowerCase();
      setTranscript(command);
      processCommand(command);
    };

    recognition.start();
  };

  const processCommand = (command) => {
    if (command.includes('add product')) {
      onCommand('add_product');
    } else if (command.includes('check stock')) {
      onCommand('check_stock');
    } else if (command.includes('new sale')) {
      onCommand('new_sale');
    } else if (command.includes('show dashboard')) {
      onCommand('dashboard');
    }
  };

  return (
    <Card className="border-2 border-dashed border-gray-200">
      <CardContent className="text-center">
        <h3 className="text-sm font-medium mb-3">Voice Commands</h3>
        
        <Button
          variant={isListening ? 'danger' : 'primary'}
          size="sm"
          onClick={startListening}
          className="mb-2"
        >
          {isListening ? (
            <>
              <StopIcon className="h-4 w-4 mr-1" />
              Listening...
            </>
          ) : (
            <>
              <MicrophoneIcon className="h-4 w-4 mr-1" />
              Start Voice
            </>
          )}
        </Button>
        
        {transcript && (
          <div className="text-xs text-gray-500 mt-2">
            "{transcript}"
          </div>
        )}
        
        <div className="text-xs text-gray-400 mt-2">
          Try: "Add product", "Check stock", "New sale"
        </div>
      </CardContent>
    </Card>
  );
};

export default VoiceCommands;