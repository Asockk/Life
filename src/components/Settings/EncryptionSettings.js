// Encryption Settings Component
import React, { useState, useEffect } from 'react';
import { Shield, Lock, Unlock, Eye, EyeOff, AlertCircle, Check } from 'lucide-react';
import { encryptedStorage } from '../../services/cryptoService';

const EncryptionSettings = ({ darkMode, onClose }) => {
  const [status, setStatus] = useState(encryptedStorage.getStatus());
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setStatus(encryptedStorage.getStatus());
  }, []);

  const handleEnableEncryption = async () => {
    setError('');
    setSuccess('');

    if (!password || password.length < 8) {
      setError('Passwort muss mindestens 8 Zeichen lang sein');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein');
      return;
    }

    setLoading(true);
    try {
      await encryptedStorage.enableEncryption(password);
      setSuccess('Verschlüsselung erfolgreich aktiviert!');
      setStatus(encryptedStorage.getStatus());
      setPassword('');
      setConfirmPassword('');
      
      // Reload to apply encryption
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async () => {
    setError('');
    setLoading(true);

    try {
      await encryptedStorage.unlock(password);
      setSuccess('Erfolgreich entsperrt!');
      setStatus(encryptedStorage.getStatus());
      
      // Close dialog and reload
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDisableEncryption = async () => {
    if (!window.confirm('Möchten Sie die Verschlüsselung wirklich deaktivieren? Ihre Daten werden unverschlüsselt gespeichert.')) {
      return;
    }

    setError('');
    setLoading(true);

    try {
      await encryptedStorage.disableEncryption(password);
      setSuccess('Verschlüsselung deaktiviert');
      setStatus(encryptedStorage.getStatus());
      
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (!status.available) {
      return (
        <div className="text-center p-8">
          <AlertCircle size={48} className="mx-auto mb-4 text-yellow-500" />
          <h3 className="text-lg font-semibold mb-2">Verschlüsselung nicht verfügbar</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Ihr Browser unterstützt keine Web Crypto API. 
            Bitte verwenden Sie einen modernen Browser.
          </p>
        </div>
      );
    }

    if (status.enabled && !status.unlocked) {
      // Need to unlock
      return (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <Lock size={48} className="mx-auto mb-4 text-blue-500" />
            <h3 className="text-lg font-semibold">Daten sind verschlüsselt</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Bitte geben Sie Ihr Passwort ein, um fortzufahren
            </p>
          </div>

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
              placeholder="Passwort"
              className={`
                w-full px-4 py-3 pr-12 rounded-lg border
                ${darkMode 
                  ? 'bg-gray-800 border-gray-700 text-gray-200' 
                  : 'bg-white border-gray-300 text-gray-800'}
                focus:outline-none focus:ring-2 focus:ring-blue-500
              `}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3.5 text-gray-500"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button
            onClick={handleUnlock}
            disabled={loading || !password}
            className={`
              w-full py-3 rounded-lg font-medium transition-colors
              ${loading || !password
                ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white'}
            `}
          >
            {loading ? 'Entsperre...' : 'Entsperren'}
          </button>
        </div>
      );
    }

    if (status.enabled && status.unlocked) {
      // Encryption is active
      return (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <div className="relative inline-block">
              <Shield size={48} className="text-green-500" />
              <Check size={20} className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 rounded-full text-green-500" />
            </div>
            <h3 className="text-lg font-semibold mt-4">Verschlüsselung aktiv</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Ihre Gesundheitsdaten sind sicher verschlüsselt
            </p>
          </div>

          <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <div className="flex items-start gap-3">
              <Shield size={20} className="text-green-600 dark:text-green-400 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-green-800 dark:text-green-200">
                  Sicherheitsstatus
                </p>
                <ul className="mt-2 space-y-1 text-green-700 dark:text-green-300">
                  <li>• AES-256-GCM Verschlüsselung</li>
                  <li>• PBKDF2 Schlüsselableitung</li>
                  <li>• Lokale Verschlüsselung</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Geben Sie Ihr Passwort ein, um die Verschlüsselung zu deaktivieren:
            </p>
            
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Passwort"
              className={`
                w-full px-4 py-2 rounded-lg border mb-3
                ${darkMode 
                  ? 'bg-gray-800 border-gray-700 text-gray-200' 
                  : 'bg-white border-gray-300 text-gray-800'}
              `}
            />

            <button
              onClick={handleDisableEncryption}
              disabled={loading || !password}
              className={`
                w-full py-2 rounded-lg font-medium transition-colors
                ${loading || !password
                  ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
                  : 'bg-red-500 hover:bg-red-600 text-white'}
              `}
            >
              Verschlüsselung deaktivieren
            </button>
          </div>
        </div>
      );
    }

    // Not encrypted - offer to enable
    return (
      <div className="space-y-4">
        <div className="text-center mb-6">
          <Unlock size={48} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold">Verschlüsselung nicht aktiv</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Schützen Sie Ihre Gesundheitsdaten mit einem Passwort
          </p>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Neues Passwort"
              className={`
                w-full px-4 py-3 pr-12 rounded-lg border
                ${darkMode 
                  ? 'bg-gray-800 border-gray-700 text-gray-200' 
                  : 'bg-white border-gray-300 text-gray-800'}
                focus:outline-none focus:ring-2 focus:ring-blue-500
              `}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3.5 text-gray-500"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <input
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Passwort bestätigen"
            className={`
              w-full px-4 py-3 rounded-lg border
              ${darkMode 
                ? 'bg-gray-800 border-gray-700 text-gray-200' 
                : 'bg-white border-gray-300 text-gray-800'}
              focus:outline-none focus:ring-2 focus:ring-blue-500
            `}
          />
        </div>

        <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
          <p className="text-xs text-yellow-800 dark:text-yellow-200">
            <strong>Wichtig:</strong> Merken Sie sich Ihr Passwort gut! 
            Es kann nicht wiederhergestellt werden.
          </p>
        </div>

        <button
          onClick={handleEnableEncryption}
          disabled={loading || !password || !confirmPassword}
          className={`
            w-full py-3 rounded-lg font-medium transition-colors
            ${loading || !password || !confirmPassword
              ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600 text-white'}
          `}
        >
          {loading ? 'Aktiviere...' : 'Verschlüsselung aktivieren'}
        </button>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className={`
          w-full max-w-md rounded-xl shadow-lg
          ${darkMode ? 'bg-gray-900' : 'bg-white'}
        `}>
          <div className={`
            px-6 py-4 border-b
            ${darkMode ? 'border-gray-800' : 'border-gray-200'}
          `}>
            <h2 className="text-xl font-semibold">Datenverschlüsselung</h2>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
                  <AlertCircle size={16} />
                  {error}
                </p>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
                  <Check size={16} />
                  {success}
                </p>
              </div>
            )}

            {renderContent()}
          </div>

          <div className={`
            px-6 py-4 border-t
            ${darkMode ? 'border-gray-800' : 'border-gray-200'}
          `}>
            <button
              onClick={onClose}
              className={`
                w-full py-2 rounded-lg font-medium transition-colors
                ${darkMode 
                  ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}
              `}
            >
              Schließen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EncryptionSettings;