import { useState, useCallback, useRef } from 'react';
import * as Comlink from 'comlink';

export function useValidationWorker() {
  const [isWorkerReady, setIsWorkerReady] = useState(false);
  const [workerError, setWorkerError] = useState(null);
  const [initializationProgress, setInitializationProgress] = useState(null);
  
  const workerRef = useRef(null);
  const comlinkWorkerRef = useRef(null);
  const isInitializing = useRef(false);

  const initializeWorker = useCallback(async () => {
    if (isInitializing.current || isWorkerReady) {
      return comlinkWorkerRef.current;
    }

    isInitializing.current = true;
    setWorkerError(null);
    setInitializationProgress({ stage: 'starting', progress: 0 });

    try {
      // Erstelle neuen Worker (IIFE format)
      workerRef.current = new Worker(
        new URL('../workers/ifcValidationWorker.js', import.meta.url)
        // Kein { type: 'module' } für IIFE Worker
      );

      // Wrapp Worker mit Comlink
      comlinkWorkerRef.current = Comlink.wrap(workerRef.current);

      // Initialisiere Worker ohne Callback (wegen postMessage Problemen)
      // Setze manuell Fortschritt da kein Callback
      setInitializationProgress({ stage: 'loading_pyodide', progress: 0 });
      
      await comlinkWorkerRef.current.initialize();

      setIsWorkerReady(true);
      setInitializationProgress({ stage: 'ready', progress: 100 });
      
      console.log('Worker erfolgreich initialisiert');
      return comlinkWorkerRef.current;

    } catch (error) {
      console.error('Worker-Initialisierung fehlgeschlagen:', error);
      setWorkerError(error.message);
      setIsWorkerReady(false);
      
      // Cleanup bei Fehler
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      comlinkWorkerRef.current = null;
      
      throw error;
    } finally {
      isInitializing.current = false;
    }
  }, [isWorkerReady]);

  const terminateWorker = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    comlinkWorkerRef.current = null;
    setIsWorkerReady(false);
    setWorkerError(null);
    setInitializationProgress(null);
    isInitializing.current = false;
  }, []);

  const restartWorker = useCallback(async () => {
    terminateWorker();
    return await initializeWorker();
  }, [terminateWorker, initializeWorker]);

  return {
    worker: comlinkWorkerRef.current,
    isWorkerReady,
    workerError,
    initializationProgress,
    initializeWorker,
    terminateWorker,
    restartWorker
  };
} 