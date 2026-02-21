import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Company } from '@/types';

interface DeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  company: Company | null;
}

export function DeleteDialog({ open, onClose, onConfirm, company }: DeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="sm:max-w-md rounded-xl p-0 shadow-lg border-0 bg-white overflow-hidden">
        <AlertDialogHeader className="p-4 sm:p-6 pb-2 sm:pb-4 border-b border-rose-100 bg-rose-50/50">
          <AlertDialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Delete Company
          </AlertDialogTitle>
        </AlertDialogHeader>
        <div className="p-4 sm:p-6 text-slate-600 bg-white">
          <AlertDialogDescription className="text-sm sm:text-base leading-relaxed">
            This will permanently delete <strong className="text-slate-800 font-bold">{company?.name}</strong> and all its meal schedules.
            <span className="block mt-2 text-red-600 font-medium">This action cannot be undone.</span>
          </AlertDialogDescription>
        </div>
        <AlertDialogFooter className="px-4 py-3 sm:px-6 sm:py-4 bg-slate-50 border-t border-slate-100 flex-col sm:flex-row gap-2">
          <AlertDialogCancel className="w-full sm:w-auto order-1 sm:order-none bg-white font-medium border-slate-200 text-slate-700 hover:bg-slate-100 mt-0">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white shadow-sm transition-all font-medium">
            Delete Company
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}