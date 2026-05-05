import { useToastManager } from "@/hooks/useToast";
import Toast from "./Toast";

export default function ToastContainer() {
  const { toasts, dismiss } = useToastManager();

  return (
    <div className="fixed bottom-0 left-0 right-0 pointer-events-none z-50">
      <div className="flex flex-col gap-2 p-4 items-center max-w-md mx-auto pointer-events-auto">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            id={toast.id}
            onDismiss={() => dismiss(toast.id)}
          />
        ))}
      </div>
    </div>
  );
}