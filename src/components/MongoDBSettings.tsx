import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Cloud, Check } from 'lucide-react';

export function MongoDBSettings() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Cloud className="w-4 h-4" />
          Cloud
        </Button>
      </DialogTrigger>

      <DialogContent showCloseButton={true} className="max-w-md">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-bold">Firebase Cloud Status</h2>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
            <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-green-700 font-medium">
                ✅ Connected to Firebase
              </p>
              <p className="text-xs text-green-600 mt-1">
                All data is automatically synced to the cloud in real-time.
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-700">
              <strong>Firebase Features:</strong>
              <br />
              • Real-time synchronization
              <br />
              • Automatic backups
              <br />
              • Secure cloud storage
            </p>
          </div>

          <p className="text-xs text-gray-500 text-center">
            💡 Your data is securely stored in Firebase and syncs automatically.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
