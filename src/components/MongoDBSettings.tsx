import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { mongoDBService } from '@/services/mongoDBDataAPI';
import { useStore } from '@/store';
import { Cloud, Settings, Check, AlertCircle } from 'lucide-react';

export function MongoDBSettings() {
  const [open, setOpen] = useState(false);
  const [mongoUri, setMongoUri] = useState(localStorage.getItem('mongodb_uri') || '');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const { syncFromCloud } = useStore();

  const handleSaveUri = async () => {
    try {
      setLoading(true);
      mongoDBService.setMongoUri(mongoUri);
      
      // Test connection
      const isConnected = await mongoDBService.testConnection();
      
      if (isConnected) {
        setStatus('success');
        setMessage('✅ Connected to MongoDB! Click Sync to pull data from cloud.');
        localStorage.setItem('mongodb_uri', mongoUri);
      } else {
        setStatus('error');
        setMessage('❌ Connection failed. Check your MongoDB URI.');
      }
    } catch (error) {
      setStatus('error');
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setLoading(true);
      await syncFromCloud();
      setStatus('success');
      setMessage('✅ Data synced from cloud successfully!');
      // Close dialog after successful sync
      setTimeout(() => setOpen(false), 1500);
    } catch (error) {
      setStatus('error');
      setMessage(`❌ Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

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
            <Settings className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-bold">MongoDB Cloud Sync</h2>
          </div>

          <p className="text-sm text-gray-600">
            Connect your MongoDB Atlas account to sync data to the cloud.
          </p>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-900 mb-2 block">
                MongoDB Connection URI
              </label>
              <Select value={mongoUri} onValueChange={setMongoUri}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select MongoDB URI" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mongodb+srv://kumari:EUttGtfVazqgq23T@cluster0.iyjdmai.mongodb.net/kumari_foods">
                    Kumari Foods Database
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-2">
                Select your MongoDB connection URI
              </p>
            </div>

            {status !== 'idle' && (
              <div className={`flex items-start gap-2 p-3 rounded-lg ${
                status === 'success' 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                {status === 'success' ? (
                  <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                )}
                <p className={`text-sm ${
                  status === 'success' ? 'text-green-700' : 'text-red-700'
                }`}>
                  {message}
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleSaveUri}
              disabled={!mongoUri || loading}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
            >
              {loading ? 'Testing...' : 'Test Connection'}
            </Button>
            
            {mongoDBService.isConfigured() && (
              <Button
                onClick={handleSync}
                disabled={loading}
                variant="outline"
                className="flex-1"
              >
                {loading ? 'Syncing...' : 'Sync Data'}
              </Button>
            )}
          </div>

          <p className="text-xs text-gray-500 text-center">
            💡 Your data is always saved locally. Cloud sync is optional.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
