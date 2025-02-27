// contexts/DialogContext.js
import React, { createContext, useState, useContext } from 'react';
import ConfirmationDialog from '../components/UI/ConfirmationDialog';

const DialogContext = createContext();

export const useDialog = () => useContext(DialogContext);

export const DialogProvider = ({ children }) => {
  const [dialogConfig, setDialogConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: () => {}
  });

  const openConfirmDialog = (config) => {
    setDialogConfig({
      isOpen: true,
      ...config
    });
  };

  const closeDialog = () => {
    setDialogConfig({
      ...dialogConfig,
      isOpen: false
    });
  };

  return (
    <DialogContext.Provider value={{ openConfirmDialog }}>
      {children}
      <ConfirmationDialog
        isOpen={dialogConfig.isOpen}
        title={dialogConfig.title}
        message={dialogConfig.message}
        onConfirm={() => {
          dialogConfig.onConfirm();
          closeDialog();
        }}
        onCancel={() => {
          if (dialogConfig.onCancel) {
            dialogConfig.onCancel();
          }
          closeDialog();
        }}
      />
    </DialogContext.Provider>
  );
};