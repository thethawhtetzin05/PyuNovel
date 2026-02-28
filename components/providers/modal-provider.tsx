"use client";

import { useEffect, useState } from "react";
import { useModalStore } from "@/lib/store/use-modal-store";
import { AlertModal, ConfirmModal } from "@/components/ui/Modals";

export const ModalProvider = () => {
  const [isMounted, setIsMounted] = useState(false);
  const { isOpen, modalType, data, closeModal } = useModalStore();

  // Next.js hydration error မဖြစ်အောင် Mounted ဖြစ်မှ ပြမယ်
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;
  if (!isOpen || !modalType) return null;

  if (modalType === "confirm") {
    return (
      <ConfirmModal
        isOpen={isOpen}
        title={data.title}
        message={data.message}
        confirmText={data.confirmText}
        cancelText={data.cancelText}
        isDestructive={data.isDestructive}
        onConfirm={async () => {
          if (data.onConfirm) {
            await data.onConfirm();
          }
          // Only close if it's still specifically the 'confirm' modal
          if (useModalStore.getState().modalType === "confirm") {
            closeModal();
          }
        }}
        onClose={closeModal}
      />
    );
  }

  if (modalType === "alert") {
    return (
      <AlertModal
        isOpen={isOpen}
        title={data.title}
        message={data.message}
        type={data.type || "info"}
        onClose={closeModal}
      />
    );
  }

  return null;
};
