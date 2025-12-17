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
      <div className="p-4 border-b border-border-light">
        <h2 className="text-lg font-semibold text-text-primary mb-3">Companies</h2>
        <Button onClick={onAddClick} className="w-full bg-brand-orange hover:bg-brand-orange/90">
          <Plus className="w-4 h-4 mr-2" />
          Add Company
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {companies.length === 0 ? (
            <div className="text-center py-8 text-text-secondary text-sm">
              <p>No companies yet</p>
              <p className="text-xs mt-1">Add your first company to get started</p>
            </div>
          ) : (
            companies.map((company) => (
              <Card
                key={company.id}
                className={`p-3 cursor-pointer transition-all hover:shadow-md ${
                  selectedCompanyId === company.id
                    ? 'border-brand-orange bg-brand-orange/5'
                    : 'border-border-light'
                }`}
                onClick={() => selectCompany(company.id)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-text-primary truncate flex-1">
                    {company.name}
                  </span>
                  <div className="flex gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
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
                      className="h-7 w-7 text-destructive hover:text-destructive"
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