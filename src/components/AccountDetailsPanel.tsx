import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { AccountDetails } from '@/types';

interface AccountDetailsPanelProps {
  accountDetails?: AccountDetails;
}

export function AccountDetailsPanel({ accountDetails }: AccountDetailsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!accountDetails || !accountDetails.accountHolderName.trim()) {
    return null;
  }

  return (
    <div className="p-3 sm:p-6 border-b border-border-light bg-bg-surface">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between hover:opacity-80 transition-opacity"
      >
        <h3 className="text-sm sm:text-base font-semibold text-text-primary">Account Details</h3>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-text-secondary" />
        ) : (
          <ChevronDown className="w-5 h-5 text-text-secondary" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-3">
          <Card className="p-3 sm:p-4 bg-bg-primary border-border-light">
            <div className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">
                    Account Holder Name
                  </p>
                  <p className="text-sm font-semibold text-text-primary mt-1">
                    {accountDetails.accountHolderName}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">
                    Bank Name
                  </p>
                  <p className="text-sm font-semibold text-text-primary mt-1">
                    {accountDetails.bankName}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">
                    Account Number
                  </p>
                  <p className="text-sm font-semibold text-text-primary mt-1 font-mono">
                    {accountDetails.accountNumber}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">
                    IFSC Code
                  </p>
                  <p className="text-sm font-semibold text-text-primary mt-1 font-mono">
                    {accountDetails.ifscCode}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
