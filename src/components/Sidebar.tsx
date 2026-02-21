import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useStore } from '@/store';
import type { Company } from '@/types';

interface SidebarProps {
  onAddClick: () => void;
  onEditClick: (company: Company) => void;
  onDeleteClick: (company: Company) => void;
}

export function Sidebar({ onAddClick, onEditClick, onDeleteClick }: SidebarProps) {
  const { companies, selectedCompanyId, selectCompany } = useStore();

  return (
    <div className="flex flex-col h-full">
      {/* Sidebar Header */}
      <div className="p-4 lg:p-6 border-b border-slate-200/60 flex flex-col gap-1 hidden lg:flex">
        <h2 className="text-lg font-bold text-slate-800">Companies</h2>
        <p className="text-xs text-slate-500">Manage your meal schedules</p>
      </div>

      {/* Add Company Button */}
      <div className="p-3 lg:p-4 border-b border-slate-200/60 bg-slate-50/50">
        <Button
          onClick={onAddClick}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm h-10 transition-all duration-300"
        >
          <Plus className="w-4 h-4 mr-2" />
          <span className="font-semibold">Add Company</span>
        </Button>
      </div>

      {/* Companies List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {companies.length === 0 ? (
            <div className="text-center py-10 px-4 text-slate-500 text-sm flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                <Plus className="w-5 h-5 text-slate-400" />
              </div>
              <p className="font-medium text-slate-700">No companies yet</p>
              <p className="text-xs mt-1 text-slate-500">Add your first company to get started</p>
            </div>
          ) : (
            companies.map((company) => (
              <Card
                key={company.id}
                className={`group p-3 cursor-pointer transition-all duration-200 border-transparent hover:shadow-md ${selectedCompanyId === company.id
                    ? 'bg-blue-50/80 shadow-sm border-blue-200 ring-1 ring-blue-500/20'
                    : 'bg-white hover:border-slate-300 shadow-sm border-slate-200/60'
                  }`}
                onClick={() => selectCompany(company.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 text-xs font-bold transition-colors ${selectedCompanyId === company.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                      }`}>
                      {company.name.charAt(0).toUpperCase()}
                    </div>
                    <span className={`text-sm font-semibold truncate transition-colors ${selectedCompanyId === company.id ? 'text-blue-900' : 'text-slate-700'
                      }`}>
                      {company.name}
                    </span>
                  </div>
                  <div className="flex gap-0.5 ml-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-blue-100 hover:text-blue-700 rounded-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditClick(company);
                      }}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteClick(company);
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
