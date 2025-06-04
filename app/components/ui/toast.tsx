import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { CheckCircledIcon, Cross2Icon, InfoCircledIcon } from "@radix-ui/react-icons";
import { cn } from "~/lib/utils";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
  duration?: number;
  category?: string;
}

interface ToastContextType {
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  clearToastsByCategory: (category: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const MAX_TOASTS = 3; // Limit to 3 toasts maximum

  const addToast = (toast: Omit<Toast, "id">) => {
    const id = Date.now().toString();
    const newToast = { ...toast, id };
    
    setToasts((prev) => {
      let updatedToasts = [...prev];
      
      // If there's a category, remove existing toasts in the same category
      if (toast.category) {
        updatedToasts = updatedToasts.filter((t) => t.category !== toast.category);
      }
      
      // Add the new toast
      updatedToasts.push(newToast);
      
      // Keep only the most recent toasts (limit to MAX_TOASTS)
      if (updatedToasts.length > MAX_TOASTS) {
        updatedToasts = updatedToasts.slice(-MAX_TOASTS);
      }
      
      return updatedToasts;
    });

    // Auto remove after duration (default 3 seconds)
    setTimeout(() => {
      removeToast(id);
    }, toast.duration || 3000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const clearToastsByCategory = (category: string) => {
    setToasts((prev) => prev.filter((toast) => toast.category !== category));
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast, clearToastsByCategory }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts: Toast[];
  onRemove: (id: string) => void;
}) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {toasts.map((toast) => (
        <ToastComponent key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastComponent({
  toast,
  onRemove,
}: {
  toast: Toast;
  onRemove: (id: string) => void;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleRemove = () => {
    setIsLeaving(true);
    setTimeout(() => onRemove(toast.id), 150); // Wait for exit animation
  };

  const getIcon = () => {
    switch (toast.type) {
      case "success":
        return <CheckCircledIcon className="h-5 w-5 text-green-500" />;
      case "error":
        return <Cross2Icon className="h-5 w-5 text-red-500" />;
      default:
        return <InfoCircledIcon className="h-5 w-5 text-blue-500" />;
    }
  };

  const getBackgroundColor = () => {
    switch (toast.type) {
      case "success":
        return "bg-green-50 border-green-200 shadow-green-100";
      case "error":
        return "bg-red-50 border-red-200 shadow-red-100";
      default:
        return "bg-blue-50 border-blue-200 shadow-blue-100";
    }
  };

  const isSpecialSuccess = toast.type === "success" && toast.message.includes("✨");

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-4 rounded-lg border shadow-lg transition-all duration-300 transform backdrop-blur-sm",
        getBackgroundColor(),
        isVisible && !isLeaving
          ? "translate-x-0 opacity-100 scale-100"
          : "translate-x-full opacity-0 scale-95",
        isSpecialSuccess && "animate-bounce"
      )}
      style={{
        animation: isSpecialSuccess && isVisible 
          ? "bounceIn 0.6s ease-out, glow 2s ease-in-out" 
          : undefined
      }}
    >
      {getIcon()}
      <p className={cn(
        "text-sm font-medium flex-1",
        toast.type === "success" ? "text-green-800" : "text-gray-900"
      )}>
        {toast.message}
      </p>
      <button
        onClick={handleRemove}
        className="text-gray-400 hover:text-gray-600 transition-colors rounded-full p-1 hover:bg-white/50"
      >
        <Cross2Icon className="h-4 w-4" />
      </button>
    </div>
  );
} 