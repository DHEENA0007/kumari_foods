import { useEffect, useState } from 'react';
import { CompanyList } from '@/components/CompanyList';
import { CompanyDialog } from '@/components/CompanyDialog';
import { DeleteDialog } from '@/components/DeleteDialog';
import { WeeklySchedule } from '@/components/WeeklySchedule';
import { MongoDBSettings } from '@/components/MongoDBSettings';
import { useStore } from '@/store';
import type { Company, AccountDetails } from '@/types';

function App() {
  const { loadFromStorage, addCompany, updateCompany, deleteCompany } = useStore();
  const [companyDialogOpen, setCompanyDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [deletingCompany, setDeletingCompany] = useState<Company | null>(null);

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
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-bg-surface border-b border-border-light shadow-sm">
        <div className="px-3 sm:px-6 py-3 sm:py-4 flex items-center gap-2 sm:gap-3 justify-between">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <img src="/Logo.png" alt="Kumari Foods Logo" className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg" />
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-text-primary truncate">Kumari Foods</h1>
              <p className="text-xs text-text-secondary hidden sm:block">Daily Meal Management System</p>
            </div>
          </div>
          <div className="flex-shrink-0">
            <MongoDBSettings />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden flex-col lg:flex-row">
        {/* Sidebar */}
        <aside className="w-full lg:w-80 lg:flex-shrink-0 border-b lg:border-b-0 lg:border-r border-border-light overflow-y-auto lg:overflow-y-auto">
          <CompanyList
            onAddClick={handleAddCompany}
            onEditClick={handleEditCompany}
            onDeleteClick={handleDeleteCompany}
          />
        </aside>

        {/* Main Area */}
        <main className="flex-1 overflow-hidden bg-bg-primary">
          <WeeklySchedule />
        </main>
      </div>

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
    </div>
  );
}

export default App;