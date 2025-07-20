import React from 'react';
import CanvasEditor from './CanvasEditor'; // Make sure this path is correct
import { IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export default function CanvasEditorOverlay({ open, onClose }) {
  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '95vw',
          height: '95vh',
          backgroundColor: '#fff',
          borderRadius: '8px',
          overflow: 'hidden',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 1,
            right: 1,
            zIndex: 10000,
            backgroundColor: 'white',
          }}
        >
          <CloseIcon />
        </IconButton>
        <CanvasEditor />
      </div>
    </div>
  );
}
