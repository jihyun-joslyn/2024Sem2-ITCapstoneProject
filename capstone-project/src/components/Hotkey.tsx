import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography, styled } from '@mui/material';
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import ModelContext from './ModelContext';

export type HotkeyDialogProps = {
  open: boolean;
  onClose: () => void;
  onSave: (newHotkeys: Hotkeys) => void;
};

export type Hotkeys = {
  zoomIn: string;
  zoomOut: string;
  rotateLeft: string;
  rotateRight: string;
  rotateUp: string;
  rotateDown: string;
  prevStep: string;
  nextStep: string;
  brush: string;
  spray: string;
};

export const HotkeyDialog: React.FC<HotkeyDialogProps> = ({ open, onClose, onSave }) => {
  const { hotkeys, setHotkeys } = useContext(ModelContext);
  const [tempHotkeys, setTempHotkeys] = useState<Hotkeys>(hotkeys);
  const [activeInput, setActiveInput] = useState<keyof Hotkeys | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [currentHotkey, setCurrentHotkey] = useState<string[]>([]);
  const isRecordingRef = useRef(false);

  const startRecording = useCallback((key: keyof Hotkeys) => {
    setActiveInput(key);
    setCurrentHotkey([]);
    isRecordingRef.current = true;
  }, []);

  const stopRecording = useCallback(() => {
    if (activeInput && currentHotkey.length > 0) {
      const newHotkey = currentHotkey.join('+');
      checkAndSetHotkey(activeInput, newHotkey);
    }
    setActiveInput(null);
    setCurrentHotkey([]);
    isRecordingRef.current = false;
  }, [activeInput, currentHotkey]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isRecordingRef.current) return;
    event.preventDefault();

    const key = event.key.toUpperCase();
    if (!currentHotkey.includes(key)) {
      if (['CONTROL', 'ALT', 'SHIFT'].includes(key)) {
        setCurrentHotkey(prev => [key, ...prev]);
      } else {
        setCurrentHotkey(prev => [...prev, key]);
      }
    }
  }, [currentHotkey]);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    if (!isRecordingRef.current) return;
    const key = event.key.toUpperCase();
    if (['CONTROL', 'ALT', 'SHIFT'].includes(key) && currentHotkey[0] === key) {
      stopRecording();
    }
  }, [currentHotkey, stopRecording]);

  const handleMouseEvent = useCallback((event: MouseEvent) => {
    if (!isRecordingRef.current) return;
    event.preventDefault();

    let mouseKey = '';
    switch (event.button) {
      case 0: mouseKey = 'LeftClick'; break;
      case 2: mouseKey = 'RightClick'; break;
      default: return;
    }
    
    setCurrentHotkey(prev => [...prev, mouseKey]);
    stopRecording();
  }, [stopRecording]);

  const handleWheelEvent = useCallback((event: WheelEvent) => {
    if (!isRecordingRef.current) return;
    event.preventDefault();

    const wheelDirection = event.deltaY < 0 ? 'WheelUp' : 'WheelDown';
    setCurrentHotkey(prev => [...prev, wheelDirection]);
    stopRecording();
  }, [stopRecording]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseEvent);
    window.addEventListener('wheel', handleWheelEvent);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseEvent);
      window.removeEventListener('wheel', handleWheelEvent);
    };
  }, [handleKeyDown, handleKeyUp, handleMouseEvent, handleWheelEvent]);

  const checkAndSetHotkey = (key: keyof Hotkeys, value: string) => {
    const conflictingKey = Object.entries(tempHotkeys).find(
      ([k, v]) => k !== key && v === value
    );

    if (conflictingKey) {
      setShowConflictDialog(true);
    } else {
      setTempHotkeys(prev => ({ ...prev, [key]: value }));
    }
  };

  const handleSave = () => {
    setHotkeys(tempHotkeys);
    onSave(tempHotkeys);
    onClose();
  };

  const handleCancel = () => {
    if (JSON.stringify(tempHotkeys) !== JSON.stringify(hotkeys)) {
      setShowCancelConfirm(true);
    } else {
      onClose();
    }
  };

  const handleConfirmCancel = () => {
    setShowCancelConfirm(false);
    setTempHotkeys(hotkeys);
    onClose();
  };

  const handleConflictDialogClose = () => {
    setShowConflictDialog(false);
  };

  const formatKeyName = (key: string) => {
    return key.split(/(?=[A-Z])/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <>
      <StyledDialog open={open} onClose={handleCancel}>
        <StyledDialogTitle>Set Hotkeys</StyledDialogTitle>
        <StyledDialogContent>
          {(Object.keys(tempHotkeys) as Array<keyof Hotkeys>).map((key) => (
            <KeyRow key={key}>
              <KeyLabel>{formatKeyName(key)}</KeyLabel>
              <StyledTextField
                value={activeInput === key ? currentHotkey.join('+') : tempHotkeys[key]}
                onClick={() => startRecording(key)}
                inputProps={{ readOnly: true }}
              />
            </KeyRow>
          ))}
        </StyledDialogContent>
        <DialogActions>
          <StyledButton onClick={handleCancel}>Cancel</StyledButton>
          <StyledButton onClick={handleSave}>Save</StyledButton>
        </DialogActions>
      </StyledDialog>

      <StyledDialog open={showCancelConfirm} onClose={() => setShowCancelConfirm(false)}>
        <StyledDialogTitle>Confirm Cancel</StyledDialogTitle>
        <StyledDialogContent>
          <Typography>Are you sure you want to cancel? Your changes will be lost.</Typography>
        </StyledDialogContent>
        <DialogActions>
          <StyledButton onClick={() => setShowCancelConfirm(false)}>No</StyledButton>
          <StyledButton onClick={handleConfirmCancel}>Yes</StyledButton>
        </DialogActions>
      </StyledDialog>

      <StyledDialog open={showConflictDialog} onClose={handleConflictDialogClose}>
        <StyledDialogTitle>Hotkey Conflict</StyledDialogTitle>
        <StyledDialogContent>
          <Typography>This key has already been assigned.</Typography>
        </StyledDialogContent>
        <DialogActions>
          <StyledButton onClick={handleConflictDialogClose}>OK</StyledButton>
        </DialogActions>
      </StyledDialog>
    </>
  );
};

// Styled components remain unchanged
const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    backgroundColor: '#E8D7C6',
    color: '#824D28',
  },
}));

const StyledDialogTitle = styled(DialogTitle)({
  backgroundColor: '#DDC5B0',
  color: '#824D28',
  fontSize: '1.25em',
  fontWeight: 600,
  padding: '8px 16px',
});

const StyledDialogContent = styled(DialogContent)({
  backgroundColor: '#E8D7C6',
  padding: '16px',
});

const StyledTextField = styled(TextField)({
  width: '150px',
  '& .MuiInputBase-root': {
    backgroundColor: 'white',
    height: '36px',
  },
  '& .MuiOutlinedInput-root': {
    '& fieldset': {
      borderColor: '#A48569',
    },
    '&:hover fieldset': {
      borderColor: '#824D28',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#824D28',
    },
  },
  '& .MuiOutlinedInput-input': {
    padding: '8px',
    textAlign: 'center',
  },
});

const StyledButton = styled(Button)({
  color: '#824D28',
  '&:hover': {
    backgroundColor: '#DDC5B0',
  },
});

const KeyRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '12px',
});

const KeyLabel = styled(Typography)({
  color: '#824D28',
  fontWeight: 500,
  width: '120px',
});

export default HotkeyDialog;