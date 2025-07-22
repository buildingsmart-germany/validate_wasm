import React from 'react';
import {
  Paper,
  Box,
  Typography,
  LinearProgress,
  Chip,
  Grid,
  Fade,
  Card,
  CardContent
} from '@mui/material';
import {
  Speed as SpeedIcon,
  Check as CheckIcon,
  PlayArrow as PlayIcon,
  Schedule as ScheduleIcon,
  Description as FileIcon,
  Settings as GearIcon
} from '@mui/icons-material';

// Stage-zu-Anzeige Mapping
const stageInfo = {
  starting: {
    label: 'Initialisierung',
    description: 'Bereite Validierung vor...',
    icon: <PlayIcon />,
    color: 'primary'
  },
  syntax_validation: {
    label: 'STEP-Syntax',
    description: 'Prüfe STEP-Dateiformat und Syntax...',
    icon: <FileIcon />,
    color: 'info'
  },
  header_validation: {
    label: 'Header-Validierung',
    description: 'Validiere FILE_DESCRIPTION, FILE_NAME, FILE_SCHEMA...',
    icon: <FileIcon />,
    color: 'info'
  },
  schema_validation: {
    label: 'Schema-Validierung',
    description: 'Prüfe IFC-Entity-Typen und Strukturen...',
    icon: <GearIcon />,
    color: 'secondary'
  },
  normative_rules: {
    label: 'Normative Regeln',
    description: 'Gherkin-basierte buildingSMART Regeln (SPS, PSE, GEM)...',
    icon: <CheckIcon />,
    color: 'warning'
  },
  industry_practices: {
    label: 'Industry Practices',
    description: 'Best Practices für BIM-Workflows...',
    icon: <SpeedIcon />,
    color: 'success'
  },
  finalizing: {
    label: 'Finalisierung',
    description: 'Erstelle Validierungsbericht...',
    icon: <CheckIcon />,
    color: 'primary'
  },
  completed: {
    label: 'Abgeschlossen',
    description: 'Validierung erfolgreich beendet!',
    icon: <CheckIcon />,
    color: 'success'
  }
};

const ValidationProgress = ({ progress, currentFileName }) => {
  const currentStage = stageInfo[progress.stage] || stageInfo.starting;
  
  return (
    <Fade in={true}>
      <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {currentStage.icon}
            IFC-Validierung läuft...
          </Typography>
          
          {currentFileName && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Aktuell: <strong>{currentFileName}</strong>
              {progress.fileIndex && progress.totalFiles && (
                <span> ({progress.fileIndex} von {progress.totalFiles})</span>
              )}
            </Typography>
          )}
        </Box>

        {/* Current Stage Display */}
        <Card sx={{ mb: 3, boxShadow: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Chip
                icon={currentStage.icon}
                label={currentStage.label}
                color={currentStage.color}
                variant="filled"
                sx={{ mr: 2 }}
              />
              <Typography variant="body1" sx={{ flex: 1 }}>
                {currentStage.description}
              </Typography>
            </Box>
            
            <LinearProgress
              variant="determinate"
              value={progress.progress}
              sx={{
                height: 8,
                borderRadius: 4,
                mb: 1,
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                }
              }}
            />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {Math.round(progress.progress)}% abgeschlossen
              </Typography>
              
              {progress.formattedTimeLeft && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <ScheduleIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    noch {progress.formattedTimeLeft}
                  </Typography>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>

        {/* Validation Stages Overview */}
        <Typography variant="subtitle2" gutterBottom sx={{ mb: 2, fontWeight: 'bold' }}>
          Validierungsphasen:
        </Typography>
        
        <Grid container spacing={1}>
          {Object.entries(stageInfo).map(([stageKey, stage]) => {
            const isCompleted = progress.progress > getStageProgress(stageKey);
            const isCurrent = progress.stage === stageKey;
            const isUpcoming = progress.progress < getStageProgress(stageKey);
            
            return (
              <Grid item xs={12} sm={6} md={3} key={stageKey}>
                <Chip
                  icon={stage.icon}
                  label={stage.label}
                  size="small"
                  variant={isCurrent ? 'filled' : isCompleted ? 'outlined' : 'outlined'}
                  color={isCurrent ? stage.color : isCompleted ? 'success' : 'default'}
                  sx={{ 
                    width: '100%',
                    opacity: isUpcoming ? 0.6 : 1,
                    fontWeight: isCurrent ? 'bold' : 'normal'
                  }}
                />
              </Grid>
            );
          })}
        </Grid>

        {/* Multi-file Progress */}
        {progress.totalFiles > 1 && (
          <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(255,255,255,0.7)', borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Gesamtfortschritt: Datei {progress.fileIndex} von {progress.totalFiles}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={(progress.fileIndex - 1 + progress.progress / 100) / progress.totalFiles * 100}
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Box>
        )}
      </Paper>
    </Fade>
  );
};

// Helper function to map stages to progress percentages
function getStageProgress(stage) {
  const stageProgressMap = {
    starting: 0,
    syntax_validation: 12.5,
    header_validation: 32.5,
    schema_validation: 47.5,
    normative_rules: 62.5,
    industry_practices: 77.5,
    finalizing: 90,
    completed: 100
  };
  
  return stageProgressMap[stage] || 0;
}

export default ValidationProgress; 