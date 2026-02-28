import { create } from 'zustand';

type ModalType = 'alert' | 'confirm';

interface ModalData {
  title: string;
  message: string;
  type?: 'info' | 'success' | 'error'; // AlertModal အတွက်
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void | Promise<void>;
  isDestructive?: boolean;
}

interface ModalStore {
  isOpen: boolean;
  modalType: ModalType | null;
  data: ModalData;
  // Modal ဖွင့်ရန် Action
  openModal: (type: ModalType, data: ModalData) => void;
  // Modal ပိတ်ရန် Action
  closeModal: () => void;
}

export const useModalStore = create<ModalStore>((set) => ({
  isOpen: false,
  modalType: null,
  data: {
    title: '',
    message: '',
  },
  openModal: (type, data) => set({ 
    isOpen: true, 
    modalType: type, 
    data 
  }),
  closeModal: () => set({ 
    isOpen: false, 
    modalType: null,
    data: { title: '', message: '' } 
  }),
}));
