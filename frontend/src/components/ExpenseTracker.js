import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Modal } from './ui/Modal';
import { PlusIcon, ReceiptRefundIcon } from '@heroicons/react/24/outline';

const ExpenseTracker = () => {
  const [expenses, setExpenses] = useState([
    { id: 1, description: 'Rent', amount: 50000, category: 'Fixed', date: '2024-01-01' },
    { id: 2, description: 'Electricity', amount: 15000, category: 'Utilities', date: '2024-01-02' }
  ]);
  const [showModal, setShowModal] = useState(false);
  const [newExpense, setNewExpense] = useState({ description: '', amount: '', category: 'Operating' });

  const addExpense = () => {
    if (!newExpense.description || !newExpense.amount) return;
    
    setExpenses([...expenses, {
      id: Date.now(),
      ...newExpense,
      amount: parseFloat(newExpense.amount),
      date: new Date().toISOString().split('T')[0]
    }]);
    
    setNewExpense({ description: '', amount: '', category: 'Operating' });
    setShowModal(false);
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center">
            <ReceiptRefundIcon className="h-5 w-5 mr-2" />
            Expense Tracker
          </CardTitle>
          <Button size="sm" onClick={() => setShowModal(true)}>
            <PlusIcon className="h-4 w-4 mr-1" />
            Add
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-3 bg-red-50 rounded-lg">
            <div className="text-lg font-bold text-red-600">₦{totalExpenses.toLocaleString()}</div>
            <div className="text-sm text-red-500">Total Monthly Expenses</div>
          </div>
          
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {expenses.map(expense => (
              <div key={expense.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <div>
                  <div className="font-medium text-sm">{expense.description}</div>
                  <div className="text-xs text-gray-500">{expense.category}</div>
                </div>
                <div className="text-sm font-medium">₦{expense.amount.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Expense">
        <div className="space-y-4">
          <Input
            label="Description"
            value={newExpense.description}
            onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
          />
          <Input
            label="Amount"
            type="number"
            value={newExpense.amount}
            onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
          />
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={addExpense}>Add Expense</Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ExpenseTracker;