import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Company, AccountDetails } from '@/types';

interface CompanyDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (name: string, accountDetails?: AccountDetails) => void;
  company?: Company | null;
}

export function CompanyDialog({ open, onClose, onSave, company }: CompanyDialogProps) {
  const [name, setName] = useState('');
  const [accountDetails, setAccountDetails] = useState<AccountDetails>({
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
  });
  const [showAccountForm, setShowAccountForm] = useState(false);

  useEffect(() => {
    if (company) {
      setName(company.name);
      if (company.accountDetails) {
        setAccountDetails(company.accountDetails);
        setShowAccountForm(true);
      } else {
        setAccountDetails({
          accountHolderName: '',
          bankName: '',
          accountNumber: '',
          ifscCode: '',
        });
        setShowAccountForm(false);
      }
    } else {
      setName('');
      setAccountDetails({
        accountHolderName: '',
        bankName: '',
        accountNumber: '',
        ifscCode: '',
      });
      setShowAccountForm(false);
    }
  }, [company, open]);

  const handleSave = () => {
    if (name.trim()) {
      const details = showAccountForm && accountDetails.accountHolderName.trim() ? accountDetails : undefined;
      onSave(name.trim(), details);
      setName('');
      setAccountDetails({
        accountHolderName: '',
        bankName: '',
        accountNumber: '',
        ifscCode: '',
      });
      setShowAccountForm(false);
      onClose();
    }
  };

  const handleAccountDetailsChange = (field: keyof AccountDetails, value: string) => {
    setAccountDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md rounded-xl p-0 shadow-lg border-0 bg-white">
        <DialogHeader className="p-4 sm:p-6 pb-2 sm:pb-4 border-b border-slate-100 bg-slate-50/50">
          <DialogTitle className="text-xl font-bold text-slate-800">{company ? 'Edit Company' : 'Add Company'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 p-4 sm:p-6">
          <div className="space-y-1.5 flex flex-col items-start w-full">
            <Label htmlFor="company-name" className="text-sm font-semibold text-slate-700">Company Name</Label>
            <Input
              id="company-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter company name"
              className="w-full bg-slate-50 border-slate-200 focus-visible:ring-blue-500 focus-visible:ring-offset-0 placeholder:text-slate-400"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSave();
                }
              }}
            />
          </div>

          {/* Account Details Toggle */}
          <div className="flex items-center gap-2 px-1">
            <input
              type="checkbox"
              id="add-account-details"
              checked={showAccountForm}
              onChange={(e) => setShowAccountForm(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 transition-colors"
            />
            <Label htmlFor="add-account-details" className="cursor-pointer text-sm font-medium text-slate-600 select-none">
              Add Account Details
            </Label>
          </div>

          {/* Account Details Form */}
          {showAccountForm && (
            <div className="space-y-4 p-4 sm:p-5 bg-slate-50/80 rounded-xl border border-slate-200/60 shadow-inner animate-in fade-in slide-in-from-top-2">
              <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2">Account Information</h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 flex flex-col items-start w-full">
                  <Label htmlFor="account-holder-name" className="text-xs font-semibold text-slate-600">Account Holder Name</Label>
                  <Input
                    id="account-holder-name"
                    value={accountDetails.accountHolderName}
                    onChange={(e) => handleAccountDetailsChange('accountHolderName', e.target.value)}
                    placeholder="e.g., Janaki M"
                    className="h-9 text-sm bg-white"
                  />
                </div>

                <div className="space-y-1.5 flex flex-col items-start w-full">
                  <Label htmlFor="bank-name" className="text-xs font-semibold text-slate-600">Bank Name</Label>
                  <Input
                    id="bank-name"
                    value={accountDetails.bankName}
                    onChange={(e) => handleAccountDetailsChange('bankName', e.target.value)}
                    placeholder="e.g., Bank of India"
                    className="h-9 text-sm bg-white"
                  />
                </div>

                <div className="space-y-1.5 flex flex-col items-start w-full sm:col-span-2">
                  <Label htmlFor="account-number" className="text-xs font-semibold text-slate-600">Account Number</Label>
                  <Input
                    id="account-number"
                    value={accountDetails.accountNumber}
                    onChange={(e) => handleAccountDetailsChange('accountNumber', e.target.value)}
                    placeholder="e.g., 806010110003712"
                    className="h-9 text-sm bg-white font-mono"
                  />
                </div>

                <div className="space-y-1.5 flex flex-col items-start w-full sm:col-span-2">
                  <Label htmlFor="ifsc-code" className="text-xs font-semibold text-slate-600">IFSC Code</Label>
                  <Input
                    id="ifsc-code"
                    value={accountDetails.ifscCode}
                    onChange={(e) => handleAccountDetailsChange('ifscCode', e.target.value)}
                    placeholder="e.g., BKID008040"
                    className="h-9 text-sm bg-white font-mono uppercase"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        <DialogFooter className="px-4 py-3 sm:px-6 sm:py-4 bg-slate-50 border-t border-slate-100 flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto order-1 sm:order-none bg-white">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all">
            {company ? 'Update Company' : 'Save Company'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}