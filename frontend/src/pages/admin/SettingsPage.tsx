import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Dialog } from '../../components/ui/Dialog';
import {
  Settings as SettingsIcon,
  Sparkles,
  Key,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Server,
  Database,
  Lock
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<any>(null);

  // Key update modal state
  const [isUpdateKeyOpen, setIsUpdateKeyOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [keyUpdateError, setKeyUpdateError] = useState<string | null>(null);

  // Test ping state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ status: string; message: string } | null>(null);

  const fetchSettings = () => {
    api.settings.getSettings()
      .then(res => {
        if (res.success && res.data) {
          setSettings(res.data);
        }
      });
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingKey(true);
    setKeyUpdateError(null);

    try {
      const res = await api.settings.updateSettings({
        geminiApiKey: apiKeyInput
      });

      if (res.success) {
        fetchSettings();
        setIsUpdateKeyOpen(false);
        setApiKeyInput('');
        setTestResult(null);
      } else {
        setKeyUpdateError(res.message || 'Failed to update API key.');
      }
    } catch (err: any) {
      setKeyUpdateError(err?.message || 'Error updating settings.');
    } finally {
      setIsSavingKey(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await api.settings.testConnection();
      if (res.success) {
        setTestResult({ status: 'SUCCESS', message: res.data.message });
      } else {
        setTestResult({ status: 'ERROR', message: res.message || 'Connection ping failed' });
      }
    } catch (err: any) {
      setTestResult({ status: 'ERROR', message: err?.message || 'Connection failed' });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-slate-600" />
          <span>System & AI Configuration</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage Google Gemini Vision OCR engine, API keys, and system diagnostics.
        </p>
      </div>

      {/* Google Gemini Vision Card */}
      <Card className="p-5">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm text-slate-900">
                    Google Gemini Vision OCR Engine
                  </h3>
                  {settings?.gemini?.configured ? (
                    <Badge variant="success">Configured</Badge>
                  ) : (
                    <Badge variant="outline">Demo Fallback Active</Badge>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Multimodal vision model for Certificate Type verification & Student Name extraction.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsUpdateKeyOpen(true);
                  setApiKeyInput('');
                  setKeyUpdateError(null);
                }}
                leftIcon={<Key className="w-3.5 h-3.5" />}
              >
                {settings?.gemini?.configured ? 'Change Key' : 'Configure Key'}
              </Button>

              <Button
                variant="secondary"
                size="sm"
                disabled={isTesting}
                isLoading={isTesting}
                onClick={handleTestConnection}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Test Ping
              </Button>
            </div>
          </div>

          <div className="p-3 rounded bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                Active Gemini API Key
              </span>
              <span className="font-mono text-slate-800 font-medium">
                {settings?.gemini?.maskedKey || 'No custom API key set (Running built-in fallback analyzer)'}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              Models: gemini-flash-latest, gemini-2.5-flash
            </span>
          </div>

          {testResult && (
            <div
              className={`p-3 rounded text-xs flex items-center gap-2 ${
                testResult.status === 'SUCCESS'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {testResult.status === 'SUCCESS' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}
        </div>
      </Card>

      {/* System Diagnostics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Server className="w-4 h-4 text-slate-600" />
            <span>Architecture Diagnostics</span>
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 rounded bg-slate-50 space-y-1">
              <span className="text-slate-500 font-semibold block flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-blue-500" />
                Database
              </span>
              <p className="font-semibold text-slate-800">
                SQLite (Prisma ORM)
              </p>
              <p className="text-[10px] text-slate-400">dev.db</p>
            </div>

            <div className="p-3 rounded bg-slate-50 space-y-1">
              <span className="text-slate-500 font-semibold block flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-emerald-500" />
                Server Stack
              </span>
              <p className="font-semibold text-slate-800">
                Express + TypeScript (Monolith)
              </p>
              <p className="text-[10px] text-slate-400">Node v24 ESM</p>
            </div>

            <div className="p-3 rounded bg-slate-50 space-y-1">
              <span className="text-slate-500 font-semibold block flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-purple-500" />
                Security
              </span>
              <p className="font-semibold text-slate-800">
                JWT + Masked Secret Vault
              </p>
              <p className="text-[10px] text-slate-400">Role-based Auth</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Configuration Modal */}
      <Dialog
        isOpen={isUpdateKeyOpen}
        onClose={() => setIsUpdateKeyOpen(false)}
        title="Configure Google Gemini API Key"
        description="Enter your Google Gemini API key to enable live OCR vision extraction."
      >
        <form onSubmit={handleSaveKey} className="space-y-4 text-xs">
          {keyUpdateError && (
            <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700">
              {keyUpdateError}
            </div>
          )}

          <Input
            label="Gemini API Key"
            placeholder="AIzaSy... or AQ..."
            type="password"
            value={apiKeyInput}
            onChange={e => setApiKeyInput(e.target.value)}
            helperText="The API key is securely encrypted on the backend and never exposed to clients."
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsUpdateKeyOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={isSavingKey}>
              Save Key
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
