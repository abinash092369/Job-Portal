import { useToastStore, type ToastType } from '../context/toastStore';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          border: 'border-l-4 border-success',
          text: 'text-success',
          bg: 'bg-white',
          icon: <CheckCircle className="w-5 h-5 text-success" />,
        };
      case 'error':
        return {
          border: 'border-l-4 border-error',
          text: 'text-error',
          bg: 'bg-white',
          icon: <AlertCircle className="w-5 h-5 text-error" />,
        };
      case 'info':
        return {
          border: 'border-l-4 border-primary',
          text: 'text-primary',
          bg: 'bg-white',
          icon: <Info className="w-5 h-5 text-primary" />,
        };
    }
  };

  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-3 max-w-md w-full pointer-events-none">
      {toasts.map((toast) => {
        const styles = getToastStyles(toast.type);
        return (
          <div
            key={toast.id}
            className={`flex items-start justify-between p-4 rounded-xl shadow-premium border border-slate-100 ${styles.bg} ${styles.border} animate-fade-in pointer-events-auto w-auto min-w-[300px] ml-auto`}
            role="alert"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">{styles.icon}</div>
              <p className="text-sm font-medium text-slate-800 leading-relaxed pr-4">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded-lg hover:bg-slate-50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
