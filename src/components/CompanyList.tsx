import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useStore } from '@/store';
import type { Company } from '@/types';

interface CompanyListProps {
  onAddClick: () => void;
  onEditClick: (company: Company) => void;
  onDeleteClick: (company: Company) => void;
}

export function CompanyList({ onAddClick, onEditClick, onDeleteClick }: CompanyListProps) {
  const { companies, selectedCompanyId, selectCompany } = useStore();

  return (
    <div className="h-full flex flex-col bg-bg-surface border-r border-border-light">
      <div className="px-3 py-2.5 border-b border-border-light">
        <h2 className="text-sm font-semibold text-text-primary mb-2">Companies</h2>
        <Button onClick={onAddClick} size="sm" className="w-full bg-brand-orange hover:bg-brand-orange/90 h-8 text-xs">
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Add Company
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1.5">
          {companies.length === 0 ? (
            <div className="text-center py-6 text-text-secondary text-xs">
              <p>No companies yet</p>
              <p className="text-[10px] mt-1 opacity-70">Add your first company</p>
            </div>
          ) : (
            companies.map((company) => (
              <Card
                key={company.id}
                className={`p-2 cursor-pointer transition-all hover:shadow-sm ${
                  selectedCompanyId === company.id
                    ? 'border-brand-orange bg-brand-orange/5'
                    : 'border-border-light'
                }`}
                onClick={() => selectCompany(company.id)}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-sm font-medium text-text-primary truncate flex-1">
                    {company.name}
                  </span>
                  <div className="flex gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
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
                      className="h-6 w-6 text-destructive hover:text-destructive"
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