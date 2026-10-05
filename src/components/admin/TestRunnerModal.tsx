import React, { useState, useEffect } from 'react';
import { AppTestSuite, TestResult } from '../../services/tests';
import { DB } from '../../services/db';
import {
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  ShieldCheck,
  Clock,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';

interface TestRunnerProps {
  onDatabaseReset: () => void;
}

export const TestRunnerModal: React.FC<TestRunnerProps> = ({ onDatabaseReset }) => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [lastRunTime, setLastRunTime] = useState<string | null>(null);

  const runTests = () => {
    setIsRunning(true);
    setTimeout(() => {
      const suiteResults = AppTestSuite.runAllTests();
      setResults(suiteResults);
      setIsRunning(false);
      setLastRunTime(new Date().toLocaleTimeString('id-ID'));
      onDatabaseReset();
    }, 200);
  };

  useEffect(() => {
    // Run tests automatically on mount
    runTests();
  }, []);

  const totalPassed = results.filter((r) => r.status === 'passed').length;
  const isAllPassed = results.length > 0 && totalPassed === results.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">
              Pengujian & Validasi Kriteria PRD (Fase 5)
            </h2>
            {isAllPassed && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                100% Lulus (Hijau)
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Eksekusi pengujian otomatis untuk memverifikasi logika transaksional SQLite, privasi, dan aturan bisnis.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={runTests}
            disabled={isRunning}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            {isRunning ? 'Menjalankan...' : 'Jalankan Ulang Semua Test'}
          </button>
        </div>
      </div>

      {/* Summary Box */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isAllPassed
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-amber-50 text-amber-600'
            }`}
          >
            {isAllPassed ? (
              <CheckCircle2 className="w-7 h-7" />
            ) : (
              <AlertTriangle className="w-7 h-7" />
            )}
          </div>
          <div>
            <div className="font-bold text-base text-slate-900">
              {totalPassed} dari {results.length} Test Unit & Feature Lulus
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <Clock className="w-3 h-3" />
              <span>Terakhir dijalankan: {lastRunTime || 'Baru saja'}</span>
              <span>·</span>
              <span>Seluruh kriteria penerimaan PRD bagian 12 tervalidasi</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            DB.resetToSeed();
            onDatabaseReset();
            alert('Database telah dikembalikan ke data awal contoh!');
          }}
          className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Database ke Data Seed Awal
        </button>
      </div>

      {/* Test Results Table / Cards */}
      <div className="space-y-3">
        {results.map((test) => (
          <div
            key={test.id}
            className={`p-4 rounded-xl border transition-all ${
              test.status === 'passed'
                ? 'bg-white border-emerald-200 shadow-2xs'
                : 'bg-red-50 border-red-300'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {test.status === 'passed' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                      {test.id}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 rounded">
                      {test.category} Test
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm">{test.name}</h3>
                  </div>

                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {test.message}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span
                  className={`inline-block font-bold text-xs px-2.5 py-1 rounded-full ${
                    test.status === 'passed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {test.status === 'passed' ? 'PASSED (LULUS)' : 'FAILED'}
                </span>
                <span className="block text-[11px] text-slate-400 font-mono mt-1">
                  {test.durationMs}ms
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
