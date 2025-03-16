import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Box
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import PaymentForm from './PaymentForm';

const PaymentDialog = ({ open, onClose, payrollId, onPaymentComplete }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          Process Payment
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <PaymentForm
          payrollId={payrollId}
          onPaymentComplete={(paymentData) => {
            if (onPaymentComplete) {
              onPaymentComplete(paymentData);
            }
            onClose();
          }}
        />
      </DialogContent>
    </Dialog>
  );
};

export default PaymentDialog; 