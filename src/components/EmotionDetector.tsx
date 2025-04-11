import { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import Webcam from 'react-webcam';
import { toast } from 'sonner';

interface EmotionDetectorProps {
  onEmotionDetected: (emotions: {
    [key: string]: number;
  }) => void;
}

export const EmotionDetector = ({ onEmotionDetected }: EmotionDetectorProps) => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  useEffect(() => {
    const loadModels = async () => {
      try {
        setLoadingError(null);
        
        // Use CDN URLs for models
        const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
        
        // Load required models
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        
        setIsModelLoaded(true);
        toast.success('Face detection models loaded successfully');
      } catch (error) {
        console.error('Error loading face-api models:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error loading models';
        setLoadingError(errorMessage);
        toast.error('Failed to load face detection models. Please refresh the page.');
      }
    };

    loadModels();
  }, []);

  useEffect(() => {
    if (!isModelLoaded) return;

    let frameId: number;
    const detectEmotions = async () => {
      if (!webcamRef.current?.video || !canvasRef.current) return;

      try {
        const video = webcamRef.current.video;
        const canvas = canvasRef.current;
        
        // Set canvas size to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Detect faces and expressions
        const detections = await faceapi
          .detectAllFaces(
            video,
            new faceapi.TinyFaceDetectorOptions({
              inputSize: 224,
              scoreThreshold: 0.3
            })
          )
          .withFaceLandmarks()
          .withFaceExpressions();

        if (detections && detections.length > 0) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw face detection box and landmarks
            faceapi.draw.drawDetections(canvas, detections);
            faceapi.draw.drawFaceLandmarks(canvas, detections);

            // Get emotions with percentages
            const emotions = detections[0].expressions;
            const emotionPercentages = Object.entries(emotions).reduce((acc, [emotion, value]) => {
              acc[emotion] = Math.round(value * 100);
              return acc;
            }, {} as {[key: string]: number});

            onEmotionDetected(emotionPercentages);
          }
        }
      } catch (error) {
        console.error('Error detecting emotions:', error);
      }

      frameId = requestAnimationFrame(detectEmotions);
    };

    // Start detection loop
    detectEmotions();

    // Cleanup
    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [isModelLoaded, onEmotionDetected]);



  return (
    <div className="relative aspect-video bg-muted rounded-lg overflow-hidden w-full">
      <Webcam
        ref={webcamRef}
        mirrored
        className="w-full h-full object-cover"
        videoConstraints={{
          width: 640,
          height: 480,
          facingMode: "user",
          frameRate: 30
        }}
      />
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full"
        style={{ transform: 'scaleX(-1)' }}
      />
      {!isModelLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white p-4 text-center">
          {loadingError ? (
            <>
              <p className="text-red-400 mb-2">Error loading face detection models</p>
              <p className="text-sm opacity-75">{loadingError}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-primary/20 hover:bg-primary/30 rounded-md transition-colors"
              >
                Retry
              </button>
            </>
          ) : (
            <>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-2"></div>
              <p>Loading face detection models...</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}; 