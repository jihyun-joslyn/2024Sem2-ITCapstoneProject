import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography, styled } from '@mui/material';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import ModelContext from './ModelContext';

export type HotkeyDialogProps = {
  open: boolean;
  onClose: () => void;
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

export const HotkeyDialog: React.FC<HotkeyDialogProps> = ({ open, onClose }) => {
  const { hotkeys, setHotkeys } = useContext(ModelContext);
  const [tempHotkeys, setTempHotkeys] = useState<Hotkeys>(hotkeys);
  const [activeInput, setActiveInput] = useState<keyof Hotkeys | null>(null);
  const [modifierKey, setModifierKey] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showConflictDialog, setShowConflictDialog] = useState(false);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (activeInput) {
      event.preventDefault();
      const key = event.key.toLowerCase();
      
      if (['shift', 'control', 'alt'].includes(key)) {
        setModifierKey(key);
      } else if (modifierKey) {
        const newHotkey = formatHotkey(`${modifierKey}+${key}`);
        checkAndSetHotkey(activeInput, newHotkey);
      } else {
        const newHotkey = formatHotkey(key);
        checkAndSetHotkey(activeInput, newHotkey);
      }
    }
  }, [activeInput, modifierKey]);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    if (['shift', 'control', 'alt'].includes(event.key.toLowerCase())) {
      setModifierKey(null);
      if (activeInput && !tempHotkeys[activeInput].includes('+')) {
        const newHotkey = formatHotkey(event.key.toLowerCase());
        checkAndSetHotkey(activeInput, newHotkey);
      }
    }
  }, [activeInput, tempHotkeys]);

  const handleMouseEvent = useCallback((event: MouseEvent) => {
    if (activeInput) {
      event.preventDefault();
      let mouseKey = '';
      switch (event.button) {
        case 0: mouseKey = 'LeftClick'; break;
        case 2: mouseKey = 'RightClick'; break;
        default: return;
      }
      
      const newHotkey = modifierKey ? formatHotkey(`${modifierKey}+${mouseKey}`) : mouseKey;
      checkAndSetHotkey(activeInput, newHotkey);
    }
  }, [activeInput, modifierKey]);

  const handleWheelEvent = useCallback((event: WheelEvent) => {
    if (activeInput) {
      event.preventDefault();
      const wheelDirection = event.deltaY < 0 ? 'WheelUp' : 'WheelDown';
      
      const newHotkey = modifierKey ? formatHotkey(`${modifierKey}+${wheelDirection}`) : wheelDirection;
      checkAndSetHotkey(activeInput, newHotkey);
    }
  }, [activeInput, modifierKey]);

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
      setActiveInput(null);
      setModifierKey(null);
    }
  };

  const handleInputClick = (key: keyof Hotkeys) => {
    setActiveInput(key);
  };

  const handleSave = () => {
    setHotkeys(tempHotkeys);
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
    setActiveInput(null);
    setModifierKey(null);
  };

  const formatKeyName = (key: string) => {
    return key.split(/(?=[A-Z])/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const formatHotkey = (hotkey: string): string => {
    const parts = hotkey.split('+');
    return parts.map(part => {
      if (['shift', 'control', 'alt'].includes(part.toLowerCase())) {
        return part.charAt(0).toUpperCase() + part.slice(1);
      }
      if (part.length === 1 && /[a-z]/i.test(part)) {
        return part.toUpperCase();
      }
      return part.charAt(0).toUpperCase() + part.slice(1);
    }).join('+');
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
                value={tempHotkeys[key]}
                onClick={() => handleInputClick(key)}
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