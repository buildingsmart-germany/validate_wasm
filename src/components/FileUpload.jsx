import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Paper,
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  LinearProgress,
  Chip
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  InsertDriveFile as FileIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';

function FileUpload({ onFilesSelected, disabled, isValidating }) {
  const [selectedFiles, setSelectedFiles] = useState([]);

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      console.warn('Abgelehnte Dateien:', rejectedFiles);
    }
    
    setSelectedFiles(prevFiles => [
      ...prevFiles,
      ...acceptedFiles.map(file => ({
        file,
        id: Date.now() + Math.random(),
        name: file.name,
        size: file.size,
        type: file.type
      }))
    ]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/octet-stream': ['.ifc'],
      'text/plain': ['.ifc']
    },
    disabled: disabled || isValidating
  });

  const removeFile = useCallback((fileId) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== fileId));
  }, []);

  const clearAllFiles = useCallback(() => {
    setSelectedFiles([]);
  }, []);

  const handleValidate = useCallback(() => {
    if (selectedFiles.length > 0) {
      const files = selectedFiles.map(f => f.file);
      onFilesSelected(files);
    }
  }, [selectedFiles, onFilesSelected]);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        IFC-Dateien hochladen
      </Typography>
      
      {/* Dropzone */}
      <Box
        {...getRootProps()}
        sx={{
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'grey.300',
          borderRadius: 2,
          p: 4,
          textAlign: 'center',
          bgcolor: isDragActive ? 'action.hover' : 'background.paper',
          cursor: disabled || isValidating ? 'not-allowed' : 'pointer',
          opacity: disabled || isValidating ? 0.5 : 1,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            borderColor: disabled || isValidating ? 'grey.300' : 'primary.main',
            bgcolor: disabled || isValidating ? 'background.paper' : 'action.hover'
          }
        }}
      >
        <input {...getInputProps()} />
        <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          {isDragActive
            ? 'Dateien hier ablegen...'
            : 'IFC-Dateien hier ablegen oder klicken zum Auswählen'
          }
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Unterstützte Formate: .ifc
        </Typography>
        {isValidating && (
          <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
            Validierung läuft...
          </Typography>
        )}
      </Box>

      {/* File List */}
      {selectedFiles.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1">
              Ausgewählte Dateien ({selectedFiles.length})
            </Typography>
            <Button 
              size="small" 
              onClick={clearAllFiles}
              disabled={disabled || isValidating}
            >
              Alle entfernen
            </Button>
          </Box>
          
          <List dense>
            {selectedFiles.map((fileInfo) => (
              <ListItem 
                key={fileInfo.id}
                sx={{ 
                  border: 1, 
                  borderColor: 'divider', 
                  borderRadius: 1, 
                  mb: 1,
                  bgcolor: 'background.paper'
                }}
              >
                <ListItemIcon>
                  <FileIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary={fileInfo.name}
                  secondary={
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5 }}>
                      <Chip 
                        label={formatFileSize(fileInfo.size)} 
                        size="small" 
                        variant="outlined" 
                      />
                      <Chip 
                        label="IFC" 
                        size="small" 
                        color="primary" 
                        variant="outlined" 
                      />
                    </Box>
                  }
                />
                <IconButton
                  edge="end"
                  onClick={() => removeFile(fileInfo.id)}
                  disabled={disabled || isValidating}
                >
                  <DeleteIcon />
                </IconButton>
              </ListItem>
            ))}
          </List>

          {/* Validation Progress */}
          {isValidating && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                Validierung läuft...
              </Typography>
              <LinearProgress />
            </Box>
          )}

          {/* Validate Button */}
          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              onClick={handleValidate}
              disabled={disabled || isValidating || selectedFiles.length === 0}
              startIcon={isValidating ? <LinearProgress size={16} /> : <CheckIcon />}
              size="large"
            >
              {isValidating ? 'Validierung läuft...' : `${selectedFiles.length} Datei(en) validieren`}
            </Button>
          </Box>
        </Box>
      )}
    </Paper>
  );
}

export default FileUpload; 