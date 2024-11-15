import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography, styled } from '@mui/material';
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import ModelContext from './ModelContext';

export type HotkeyDialogProps = {
  /**
   * Whether the dialog shown in UI
   */
  open: boolean;
  /**
   * To close the dialog on UI
   */
  onClose: () => void;
  /**
   * Update the new hotkey combinations
   * @param newHotkeys the new hotkey combinations
   */
  onSave: (newHotkeys: Hotkeys) => void;
  /**
    * Check whether there are any data in local storage that are under the given key
    * @param storageKey the key to be checked
    * @returns whether there are no data under the key in local storage
    */
  checkIfLocalStorageIsEmpty: (storageKey: string) => boolean;
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
  keypoint: string;
  path: string;
  switchClass: string;
};

export const HotkeyDialog: React.FC<HotkeyDialogProps> = ({ open, onClose, onSave, checkIfLocalStorageIsEmpty }) => {
  const { hotkeys, setHotkeys, setHotkeysEnabled } = useContext(ModelContext);
  const [tempHotkeys, setTempHotkeys] = useState<Hotkeys>(hotkeys);
  const [activeInput, setActiveInput] = useState<keyof Hotkeys | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [currentHotkey, setCurrentHotkey] = useState<string[]>([]);
  const isRecordingRef = useRef(false);

  /**
   * Local storage ID for the hotkey preferences for users
   */
  const HotKeyLocalStorageID: string = "hotkey";

  //triggered when the value of open or setHotKeysEnabled change
  useEffect(() => {
    //if local storage stored the user preferences for hotkey
    if (!checkIfLocalStorageIsEmpty(HotKeyLocalStorageID)) {
      //get the Hotkey preference from local storage
      var hotkey: Hotkeys = JSON.parse(localStorage.getItem(HotKeyLocalStorageID));

      setTempHotkeys(hotkey)
      setHotkeys(hotkey);
    }

    //if the hotkey settings menu is displayed
    if (open) {
      setHotkeysEnabled(false);
    }

    return () => {
      setHotkeysEnabled(true);
    };
  }, [open, setHotkeysEnabled]);

  /**
   * Record the key combination for the hotkey
   */
  const startRecording = useCallback((key: keyof Hotkeys) => {
    setActiveInput(key);
    setCurrentHotkey([]);
    isRecordingRef.current = true;
  }, []);

  /**
   * Stop recording the key combination for hotkey.
   * 
   * Triggered when the value of activeInput or currentHotKey changed
   */
  const stopRecording = useCallback(() => {
    //when there are already recorded key combinaions
    if (activeInput && currentHotkey.length > 0) {
      const newHotkey = currentHotkey.join('+');
      checkAndSetHotkey(activeInput, newHotkey);
    }

    //reset input
    setActiveInput(null);
    setCurrentHotkey([]);
    isRecordingRef.current = false;
  }, [activeInput, currentHotkey]);

  /**
   * Triggered when press any keys when recording new hotkey combination and when the value of currentHotKey changes
   */
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    //when it is not recording
    if (!isRecordingRef.current) return;

    event.preventDefault();

    const key = event.key.toUpperCase();

    //when the current hotkeys do not have the combination
    if (!currentHotkey.includes(key)) {
      //if the combination includes keys like Control, Alt and Shift
      if (['CONTROL', 'ALT', 'SHIFT'].includes(key)) {
        //put the keys like Control, Alt and Shift at the start of the combination
        setCurrentHotkey(prev => [key, ...prev]);
      } else {
        //set the combination with the alphabets key at the end
        setCurrentHotkey(prev => [...prev, key]);
      }
    }
  }, [currentHotkey]);

  /**
   * Triggered when users release the keys after pressing the keys and when the value of currentHotKey or stopRecording changes 
   */
  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    //when it is not recording
    if (!isRecordingRef.current) return;

    const key = event.key.toUpperCase();

    //when the combination includes keys like Control, Alt and Shift and the last key released is the first key in the combination
    if (['CONTROL', 'ALT', 'SHIFT'].includes(key) && currentHotkey[0] === key) {
      stopRecording();
    }
  }, [currentHotkey, stopRecording]);

  /**
   * Trigger when users click the mouse 
   */
  const handleMouseEvent = useCallback((event: MouseEvent) => {
    //when it is not recording 
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

  /**
   * Trigger when users srcoll
   */
  const handleWheelEvent = useCallback((event: WheelEvent) => {
    //when it is not recording
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

  /**
   * Validate the new hotkey combination and save the new combination
   * @param key the function that the hotkey trigger
   * @param value the new key combination
   */
  const checkAndSetHotkey = (key: keyof Hotkeys, value: string) => {
    const conflictingKey = Object.entries(tempHotkeys).find(
      ([k, v]) => k !== key && v === value
    );

    //if there are existing hotkey using the combination
    if (conflictingKey) {
      setShowConflictDialog(true);
    } else {
      setTempHotkeys(prev => ({ ...prev, [key]: value }));
    }
  };

  /**
   * Save the key combinations of the hotkeys and save the preference to local storage
   */
  const handleSave = () => {
    setHotkeys(tempHotkeys);
    onSave(tempHotkeys);
    onClose();

    localStorage.setItem(HotKeyLocalStorageID, JSON.stringify(tempHotkeys));
  };

  /**
   * Trigger if users click the cancel button in the dialog
   */
  const handleCancel = () => {
    //if users have unsaved changes
    if (JSON.stringify(tempHotkeys) !== JSON.stringify(hotkeys)) {
      setShowCancelConfirm(true);
    } else {
      onClose();
    }
  };

  /**
   * Trigger when users confirmed to not save the changes
   */
  const handleConfirmCancel = () => {
    setShowCancelConfirm(false);
    setTempHotkeys(hotkeys);
    onClose();

    localStorage.setItem(HotKeyLocalStorageID, JSON.stringify(hotkeys));
  };

  /**
   * Close the alert showing there are conflicting key combinations
   */
  const handleConflictDialogClose = () => {
    setShowConflictDialog(false);
  };

  /**
   * Format the hotkey functions to uppercase
   * @param key the string of the hotkey function
   * @returns the formmated string
   */
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
                // inputProps={{ readOnly: true }}
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