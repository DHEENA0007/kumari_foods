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
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{company ? 'Edit Company' : 'Add Company'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="company-name">Company Name</Label>
            <Input
              id="company-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter company name"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSave();
                }
              }}
            />
          </div>

          {/* Account Details Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="add-account-details"
              checked={showAccountForm}
              onChange={(e) => setShowAccountForm(e.target.checked)}
              className="w-4 h-4 rounded border-border-light"
            />
            <Label htmlFor="add-account-details" className="cursor-pointer">
              Add Account Details
            </Label>
          </div>

          {/* Account Details Form */}
          {showAccountForm && (
            <div className="space-y-3 p-4 bg-bg-surface rounded-lg border border-border-light">
              <h3 className="font-semibold text-text-primary">Account Details</h3>
              
              <div className="space-y-2">
                <Label htmlFor="account-holder-name">Account Holder Name</Label>
                <Input
                  id="account-holder-name"
                  value={accountDetails.accountHolderName}
                  onChange={(e) => handleAccountDetailsChange('accountHolderName', e.target.value)}
                  placeholder="e.g., Janaki M"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank-name">Bank Name</Label>
                <Input
                  id="bank-name"
                  value={accountDetails.bankName}
                  onChange={(e) => handleAccountDetailsChange('bankName', e.target.value)}
                  placeholder="e.g., Bank of India"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="account-number">Account Number</Label>
                <Input
                  id="account-number"
                  value={accountDetails.accountNumber}
                  onChange={(e) => handleAccountDetailsChange('accountNumber', e.target.value)}
                  placeholder="e.g., 806010110003712"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ifsc-code">IFSC Code</Label>
                <Input
                  id="ifsc-code"
                  value={accountDetails.ifscCode}
                  onChange={(e) => handleAccountDetailsChange('ifscCode', e.target.value)}
                  placeholder="e.g., BKID008040"
                />
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()} className="bg-brand-orange hover:bg-brand-orange/90">
            {company ? 'Update' : 'Add'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}