import { useEffect, useState } from 'react';
import { Menu, X, Calendar } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { CompanyDialog } from '@/components/CompanyDialog';
import { DeleteDialog } from '@/components/DeleteDialog';
import { WeeklySchedule } from '@/components/WeeklySchedule';
import { SimpleWeeklyScheduleDialog } from '@/components/SimpleWeeklyScheduleDialog';
import { Button } from '@/components/ui/button';

import { useStore } from '@/store';
import type { Company, AccountDetails } from '@/types';

function App() {
  const { loadFromStorage, addCompany, updateCompany, deleteCompany } = useStore();
  const [companyDialogOpen, setCompanyDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [weeklyScheduleDialogOpen, setWeeklyScheduleDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [deletingCompany, setDeletingCompany] = useState<Company | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  const handleAddCompany = () => {
    setEditingCompany(null);
    setCompanyDialogOpen(true);
  };

  const handleEditCompany = (company: Company) => {
    setEditingCompany(company);
    setCompanyDialogOpen(true);
  };

  const handleDeleteCompany = (company: Company) => {
    setDeletingCompany(company);
    setDeleteDialogOpen(true);
  };

  const handleSaveCompany = (name: string, accountDetails?: AccountDetails) => {
    if (editingCompany) {
      updateCompany(editingCompany.id, name, accountDetails);
    } else {
      addCompany(name, accountDetails);
    }
  };

  const handleConfirmDelete = () => {
    if (deletingCompany) {
      deleteCompany(deletingCompany.id);
      setDeletingCompany(null);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-hidden">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-slate-200/60 shadow-sm flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-all duration-200 shadow-sm"
              >
                {sidebarOpen ? <X className="w-5 h-5 text-slate-600" /> : <Menu className="w-5 h-5 text-slate-600" />}
              </button>

              <div className="flex items-center gap-3">
                <img src="/Logo.png" alt="Kumari Foods Logo" className="w-12 h-12" />
                <div>
                  <h1 className="text-xl font-bold text-slate-800">Kumari Foods</h1>
                  <p className="text-xs text-slate-500 hidden sm:block">Daily Meal Management System</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button
                onClick={() => setWeeklyScheduleDialogOpen(true)}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">Week Schedule</span>
                <span className="sm:hidden">Week</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-80 bg-white/95 backdrop-blur-sm border-r border-slate-200/60 shadow-xl lg:shadow-none transition-all duration-300 ease-in-out overflow-hidden flex-shrink-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}>
          <div className="h-full overflow-hidden">
            <Sidebar
              onAddClick={handleAddCompany}
              onEditClick={handleEditCompany}
              onDeleteClick={handleDeleteCompany}
            />
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Area */}
        <main className="flex-1 w-full min-w-0 overflow-y-auto bg-slate-50/50">
          <div className="h-full p-2 sm:p-4 lg:p-6 lg:ml-6 flex flex-col items-center">
            <div className="w-full max-w-6xl mx-auto space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-2 px-2">
                <div>
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-800 tracking-tight">Dashboard</h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">Manage schedules and overview</p>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-200/50 overflow-hidden w-full transition-all duration-300">
                <WeeklySchedule />
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-sm border-t border-slate-200/60 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <p>&copy; 2024 Kumari Foods. All rights reserved.</p>
            <p>Daily Meal Management System v1.0</p>
          </div>
        </div>
      </footer>

      {/* Dialogs */}
      <CompanyDialog
        open={companyDialogOpen}
        onClose={() => setCompanyDialogOpen(false)}
        onSave={handleSaveCompany}
        company={editingCompany}
      />

      <DeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        company={deletingCompany}
      />

      <SimpleWeeklyScheduleDialog
        open={weeklyScheduleDialogOpen}
        onClose={() => setWeeklyScheduleDialogOpen(false)}
      />
    </div>
  );
}

export default App;