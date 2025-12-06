import React, { useState, useEffect } from 'react';
import {
  Heart,
  Target,
  TrendingUp,
  Plus,
  Settings,
  History,
  Users,
  Banknote,
  Droplets,
  Loader2,
  Lock,
  LogOut,
  Edit3
} from 'lucide-react';

import Card from './components/Card';
import Button from './components/Button';
import ProgressBar from './components/ProgressBar';
import Notification from './components/Notification';
import { AppData, ViewState, NotificationState } from './types';
import { 
  subscribeToData,
  addDeposit, 
  updateGoal, 
  manualOverrideTotal, 
  mockLogin 
} from './services/dataService';

export default function App() {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // App State
  const [view, setView] = useState<ViewState>('public');
  const [pin, setPin] = useState('');
  const [notification, setNotification] = useState<NotificationState | null>(null);

  // Form States
  const [depositAmount, setDepositAmount] = useState('');
  const [depositorName, setDepositorName] = useState('');
  const [newGoal, setNewGoal] = useState('');
  const [manualTotal, setManualTotal] = useState('');

  // --- Real-time Data Sync ---
  useEffect(() => {
    // subscribeToData handles the connection to Firebase (or fallback)
    // and calls this callback whenever data changes on the server.
    const unsubscribe = subscribeToData((newData) => {
      setData(newData);
      setLoading(false);
    });

    // Cleanup listener when component unmounts
    return () => unsubscribe();
  }, []);

  // --- Actions ---
  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const formatCurrency = (amount: number | undefined) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await mockLogin(pin);
    if (success) {
      setView('admin');
      setPin('');
    } else {
      showNotification("Incorrect PIN", "error");
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositAmount || isNaN(Number(depositAmount)) || parseFloat(depositAmount) <= 0) return;

    try {
      const amount = parseFloat(depositAmount);
      await addDeposit(amount, depositorName);
      
      setDepositAmount('');
      setDepositorName('');
      showNotification(`Added LKR ${amount}`);
    } catch (e) {
      console.error(e);
      showNotification("Failed to add deposit. Check console.", "error");
    }
  };

  const handleUpdateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal) return;
    try {
      await updateGoal(parseFloat(newGoal));
      setNewGoal('');
      showNotification("Goal updated successfully");
    } catch (e) {
      console.error(e);
      showNotification("Failed to update goal.", "error");
    }
  };

  const handleManualOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTotal) return;
    try {
      await manualOverrideTotal(parseFloat(manualTotal));
      setManualTotal('');
      showNotification("Total amount updated manually");
    } catch (e) {
      console.error(e);
      showNotification("Failed to update total.", "error");
    }
  };

  // --- Render Loading ---
  if (loading || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-500">
        <Loader2 size={32} className="animate-spin text-emerald-600 mb-4" />
        <p>Loading Hands For Hope...</p>
        <p className="text-xs text-slate-400 mt-2">Waiting for data connection...</p>
      </div>
    );
  }

  // --- View: Login ---
  if (view === 'login') {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <Notification notification={notification} />
        <Card className="w-full max-w-md p-8">
          <div className="text-center mb-6">
            <div className="bg-emerald-100 text-emerald-600 p-3 rounded-full inline-block mb-3">
              <Lock size={24} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Admin Access</h2>
            <p className="text-sm text-slate-500">Enter PIN to manage funds</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full text-center text-2xl tracking-widest px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="••••"
              autoFocus
            />
            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={() => setView('public')} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Unlock
              </Button>
            </div>
          </form>
        </Card>
      </div>
    );
  }

  // --- View: Admin Panel ---
  if (view === 'admin') {
    return (
      <div className="min-h-screen bg-slate-100 p-4 pb-20">
        <Notification notification={notification} />
        <div className="max-w-xl mx-auto space-y-6">
          {/* Admin Header */}
          <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-slate-800 text-white p-2 rounded-lg">
                <Settings size={20} />
              </div>
              <div>
                <h1 className="font-bold text-slate-800">Admin Dashboard</h1>
                <p className="text-xs text-slate-500">Managing Hands For Hope</p>
              </div>
            </div>
            <Button variant="secondary" onClick={() => setView('public')} className="!px-3">
              <LogOut size={16} /> Exit
            </Button>
          </div>

          {/* Current Status Card */}
          <Card className="p-6 bg-slate-800 text-white border-none">
            <h2 className="text-slate-400 text-sm font-bold uppercase mb-4">Current Status</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-slate-400 text-xs mb-1">Total Collected</p>
                <p className="text-2xl font-bold text-emerald-400">{formatCurrency(data.currentAmount)}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs mb-1">Target Goal</p>
                <p className="text-2xl font-bold text-blue-400">{formatCurrency(data.goalAmount)}</p>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <div className="grid gap-6">
            {/* 1. Add Donation */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4 text-emerald-700 font-bold border-b border-emerald-50 pb-2">
                <Plus size={18} /> Add New Donation
              </div>
              <form onSubmit={handleDeposit} className="space-y-3">
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="Amount (LKR)"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <input
                  type="text"
                  value={depositorName}
                  onChange={(e) => setDepositorName(e.target.value)}
                  placeholder="Donor Name (Optional)"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <Button className="w-full">Confirm Deposit</Button>
              </form>
            </Card>

            {/* 2. Update Goal */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4 text-blue-700 font-bold border-b border-blue-50 pb-2">
                <Target size={18} /> Change Target Goal
              </div>
              <form onSubmit={handleUpdateGoal} className="flex gap-