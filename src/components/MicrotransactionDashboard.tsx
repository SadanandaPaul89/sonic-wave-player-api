// Microtransaction Dashboard Component

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CreditCard,
    TrendingUp,
    Clock,
    DollarSign,
    Activity,
    Settings,
    RefreshCw,
    ArrowUpRight,
    ArrowDownRight,
    Calendar,
    Filter,
    Download,
    AlertCircle,
    CheckCircle,
    Loader2,
    BarChart3,
    PieChart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useMicrotransactions } from '@/hooks/useMicrotransactions';
import { useYellowSDK } from '@/hooks/useYellowSDK';

interface MicrotransactionDashboardProps {
    className?: string;
}

const MicrotransactionDashboard: React.FC<MicrotransactionDashboardProps> = ({
    className = ''
}) => {
    const { isAuthenticated, session, balance } = useYellowSDK();
    const {
        isProcessing,
        error,
        contentAccess,
        pendingTransactions,
        balanceHistory,
        spendingAnalytics,
        config,
        refreshData,
        clearError,
        triggerSettlement
    } = useMicrotransactions();

    const [activeTab, setActiveTab] = useState('overview');
    const [showSettings, setShowSettings] = useState(false);

    const handleSettlement = async () => {
        try {
            await triggerSettlement();
        } catch (error) {
            console.error('Settlement failed:', error);
        }
    };

    const formatCurrency = (amount: number, currency: string = 'ETH') => {
        return `${amount.toFixed(4)} ${currency}`;
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    if (!isAuthenticated) {
        return (
            <Card className={`glass-card border-figma-glass-border ${className}`}>
                <CardContent className="p-8 text-center">
                    <CreditCard size={48} className="text-figma-purple mx-auto mb-4" />
                    <h3 className="text-white font-medium mb-2">Connect Wallet</h3>
                    <p className="text-white/60 text-sm">
                        Connect your wallet to view microtransaction dashboard
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Microtransaction Dashboard</h2>
                    <p className="text-white/60">Track your small payments and content access</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        onClick={refreshData}
                        variant="outline"
                        size="sm"
                        disabled={isProcessing}
                        className="border-white/20 text-white hover:bg-white/10"
                    >
                        <RefreshCw size={16} className={`mr-2 ${isProcessing ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button
                        onClick={() => setShowSettings(!showSettings)}
                        variant="outline"
                        size="sm"
                        className="border-white/20 text-white hover:bg-white/10"
                    >
                        <Settings size={16} className="mr-2" />
                        Settings
                    </Button>
                </div>
            </div>

            {/* Error Display */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-4 bg-red-500/20 border border-red-500/30 rounded-figma-md"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <AlertCircle size={20} className="text-red-400" />
                                <p className="text-red-400">{error}</p>
                            </div>
                            <Button
                                onClick={clearError}
                                variant="ghost"
                                size="sm"
                                className="text-red-400 hover:bg-red-500/20"
                            >
                                ×
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="glass-card border-figma-glass-border">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white/60 text-sm">Current Balance</p>
                                <p className="text-2xl font-bold text-white">{formatCurrency(balance)}</p>
                            </div>
                            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                                <DollarSign size={24} className="text-green-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card border-figma-glass-border">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white/60 text-sm">Total Spent</p>
                                <p className="text-2xl font-bold text-white">{formatCurrency(spendingAnalytics.totalSpent)}</p>
                            </div>
                            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                                <ArrowUpRight size={24} className="text-red-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card border-figma-glass-border">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white/60 text-sm">Transactions</p>
                                <p className="text-2xl font-bold text-white">{spendingAnalytics.transactionCount}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                                <Activity size={24} className="text-blue-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card border-figma-glass-border">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white/60 text-sm">Content Accessed</p>
                                <p className="text-2xl font-bold text-white">{spendingAnalytics.contentAccessed}</p>
                            </div>
                            <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                                <CheckCircle size={24} className="text-purple-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4 bg-white/10">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="transactions">Transactions</TabsTrigger>
                    <TabsTrigger value="content">Content Access</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    {/* Pending Transactions */}
                    <Card className="glass-card border-figma-glass-border">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-white flex items-center gap-3">
                                    <Clock size={20} className="text-figma-purple" />
                                    Pending Transactions
                                </CardTitle>
                                {pendingTransactions.length > 0 && (
                                    <Button
                                        onClick={handleSettlement}
                                        disabled={isProcessing}
                                        size="sm"
                                        className="bg-figma-purple hover:bg-figma-purple/80"
                                    >
                                        {isProcessing ? (
                                            <Loader2 size={16} className="mr-2 animate-spin" />
                                        ) : (
                                            <ArrowUpRight size={16} className="mr-2" />
                                        )}
                                        Settle Now
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {pendingTransactions.length > 0 ? (
                                <div className="space-y-3">
                                    {pendingTransactions.slice(0, 5).map((transaction) => (
                                        <div key={transaction.id} className="flex items-center justify-between p-3 bg-white/5 rounded-figma-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center">
                                                    <Clock size={16} className="text-yellow-400" />
                                                </div>
                                                <div>
                                                    <p className="text-white font-medium text-sm">
                                                        {transaction.contentId || 'Unknown Content'}
                                                    </p>
                                                    <p className="text-white/60 text-xs">
                                                        {formatDate(new Date(transaction.timestamp))}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-white font-medium text-sm">
                                                    {formatCurrency(transaction.amount)}
                                                </p>
                                                <Badge variant="outline" className="text-xs">
                                                    {transaction.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                    {pendingTransactions.length > 5 && (
                                        <p className="text-white/60 text-sm text-center">
                                            +{pendingTransactions.length - 5} more transactions
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <CheckCircle size={48} className="mx-auto mb-4 text-green-400" />
                                    <p className="text-white/60">No pending transactions</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Balance Changes */}
                    <Card className="glass-card border-figma-glass-border">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-3">
                                <TrendingUp size={20} className="text-figma-purple" />
                                Recent Balance Changes
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {balanceHistory.length > 0 ? (
                                <div className="space-y-3">
                                    {balanceHistory.slice(0, 5).map((update, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-figma-sm">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${update.change > 0 ? 'bg-green-500/20' : 'bg-red-500/20'
                                                    }`}>
                                                    {update.change > 0 ? (
                                                        <ArrowDownRight size={16} className="text-green-400" />
                                                    ) : (
                                                        <ArrowUpRight size={16} className="text-red-400" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-white font-medium text-sm">{update.reason}</p>
                                                    <p className="text-white/60 text-xs">
                                                        {formatDate(update.timestamp)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={`font-medium text-sm ${update.change > 0 ? 'text-green-400' : 'text-red-400'
                                                    }`}>
                                                    {update.change > 0 ? '+' : ''}{formatCurrency(update.change)}
                                                </p>
                                                <p className="text-white/60 text-xs">
                                                    Balance: {formatCurrency(update.newBalance)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Activity size={48} className="mx-auto mb-4 text-white/40" />
                                    <p className="text-white/60">No balance history yet</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="transactions" className="space-y-6">
                    <Card className="glass-card border-figma-glass-border">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-white">Transaction History</CardTitle>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                                        <Filter size={16} className="mr-2" />
                                        Filter
                                    </Button>
                                    <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                                        <Download size={16} className="mr-2" />
                                        Export
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {pendingTransactions.length > 0 ? (
                                <div className="space-y-3">
                                    {pendingTransactions.map((transaction) => (
                                        <div key={transaction.id} className="flex items-center justify-between p-4 bg-white/5 rounded-figma-md border border-white/10">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-figma-purple/20 rounded-full flex items-center justify-center">
                                                    <CreditCard size={20} className="text-figma-purple" />
                                                </div>
                                                <div>
                                                    <p className="text-white font-medium">
                                                        {transaction.contentId || 'Microtransaction'}
                                                    </p>
                                                    <p className="text-white/60 text-sm">
                                                        {formatDate(new Date(transaction.timestamp))}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-white font-medium">
                                                    {formatCurrency(transaction.amount)}
                                                </p>
                                                <Badge
                                                    variant={transaction.status === 'confirmed' ? 'default' : 'outline'}
                                                    className="text-xs"
                                                >
                                                    {transaction.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <CreditCard size={48} className="mx-auto mb-4 text-white/40" />
                                    <p className="text-white/60 mb-2">No transactions yet</p>
                                    <p className="text-white/40 text-sm">Your microtransactions will appear here</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="content" className="space-y-6">
                    <Card className="glass-card border-figma-glass-border">
                        <CardHeader>
                            <CardTitle className="text-white">Content Access History</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {contentAccess.length > 0 ? (
                                <div className="space-y-3">
                                    {contentAccess.map((access) => (
                                        <div key={`${access.contentId}-${access.grantedAt.getTime()}`} className="flex items-center justify-between p-4 bg-white/5 rounded-figma-md border border-white/10">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                                                    <CheckCircle size={20} className="text-green-400" />
                                                </div>
                                                <div>
                                                    <p className="text-white font-medium">{access.contentId}</p>
                                                    <p className="text-white/60 text-sm">
                                                        Accessed {formatDate(access.grantedAt)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-white font-medium">
                                                    {formatCurrency(access.price, access.currency)}
                                                </p>
                                                <Badge className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
                                                    {access.accessType}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <CheckCircle size={48} className="mx-auto mb-4 text-white/40" />
                                    <p className="text-white/60 mb-2">No content accessed yet</p>
                                    <p className="text-white/40 text-sm">Your content purchases will appear here</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="analytics" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="glass-card border-figma-glass-border">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-3">
                                    <BarChart3 size={20} className="text-figma-purple" />
                                    Spending Overview
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-white/60">Average Transaction</span>
                                        <span className="text-white font-medium">
                                            {formatCurrency(spendingAnalytics.averageTransaction)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-white/60">Total Transactions</span>
                                        <span className="text-white font-medium">
                                            {spendingAnalytics.transactionCount}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-white/60">Content Items</span>
                                        <span className="text-white font-medium">
                                            {spendingAnalytics.contentAccessed}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="glass-card border-figma-glass-border">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-3">
                                    <Calendar size={20} className="text-figma-purple" />
                                    Daily Spending
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {spendingAnalytics.dailySpending.length > 0 ? (
                                    <div className="space-y-3">
                                        {spendingAnalytics.dailySpending.slice(-7).map((day) => (
                                            <div key={day.date} className="flex items-center justify-between">
                                                <span className="text-white/60 text-sm">{day.date}</span>
                                                <div className="text-right">
                                                    <p className="text-white font-medium text-sm">
                                                        {formatCurrency(day.amount)}
                                                    </p>
                                                    <p className="text-white/60 text-xs">
                                                        {day.count} transactions
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <PieChart size={48} className="mx-auto mb-4 text-white/40" />
                                        <p className="text-white/60">No spending data yet</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Settings Panel */}
            <AnimatePresence>
                {showSettings && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        <Card className="glass-card border-figma-glass-border">
                            <CardHeader>
                                <CardTitle className="text-white">Microtransaction Settings</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-white/80 text-sm">Currency</label>
                                        <p className="text-white font-medium">{config.currency}</p>
                                    </div>
                                    <div>
                                        <label className="text-white/80 text-sm">Fee Percentage</label>
                                        <p className="text-white font-medium">{config.feePercentage}%</p>
                                    </div>
                                    <div>
                                        <label className="text-white/80 text-sm">Min Amount</label>
                                        <p className="text-white font-medium">{formatCurrency(config.minAmount)}</p>
                                    </div>
                                    <div>
                                        <label className="text-white/80 text-sm">Max Amount</label>
                                        <p className="text-white font-medium">{formatCurrency(config.maxAmount)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MicrotransactionDashboard;