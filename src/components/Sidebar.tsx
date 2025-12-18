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
      <div className="p-6 border-b border-slate-200/60">
        <h2 className="text-lg font-semibold text-slate-800">Companies</h2>
        <p className="text-sm text-slate-500">Manage your meal schedules</p>
      </div>

      {/* Add Company Button */}
      <div className="p-4 border-b border-slate-200/60">
        <Button onClick={onAddClick} size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Add Company
        </Button>
      </div>

      {/* Companies List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {companies.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              <p>No companies yet</p>
              <p className="text-xs mt-1 opacity-70">Add your first company</p>
            </div>
          ) : (
            companies.map((company) => (
              <Card
                key={company.id}
                className={`p-3 cursor-pointer transition-all hover:shadow-md ${
                  selectedCompanyId === company.id
                    ? 'border-blue-500 bg-blue-50 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
                onClick={() => selectCompany(company.id)}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-800 truncate flex-1">
                    {company.name}
                  </span>
                  <div className="flex gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 hover:bg-slate-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditClick(company);
                      }}
                    >
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteClick(company);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
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
