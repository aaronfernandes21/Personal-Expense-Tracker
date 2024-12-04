const express = require('express');
const cors = require('cors');
const nodeCron = require('node-cron');
const app = express();
const port = 3001;


app.use(cors());
app.use(express.json());


const expenses = [];


app.get('/', (req, res) => {
  res.send('Server is running!');
});


app.post('/expenses', (req, res) => {
  const { category, amount, date } = req.body;


  if (!category || !amount || !date || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ status: 'error', error: 'Invalid input' });
  }

  const expense = { category, amount: parseFloat(amount), date };
  expenses.push(expense);

  res.json({ status: 'success', data: expense });
});


app.get('/expenses', (req, res) => {
  const { category, startDate, endDate } = req.query;

  let filteredExpenses = expenses;

  if (category) {
    filteredExpenses = filteredExpenses.filter((expense) => expense.category === category);
  }

  if (startDate && endDate) {
    filteredExpenses = filteredExpenses.filter(
      (expense) =>
        new Date(expense.date) >= new Date(startDate) &&
        new Date(expense.date) <= new Date(endDate)
    );
  }

  res.json({ status: 'success', data: filteredExpenses });
});

app.get('/expenses/analysis', (req, res) => {
    if (expenses.length === 0) {
      return res.status(404).json({ status: 'error', error: 'No expenses found' });
    }
  
   
    const totalByCategory = expenses.reduce((acc, expense) => {
      if (!acc[expense.category]) {
        acc[expense.category] = 0;
      }
      acc[expense.category] += expense.amount;
      return acc;
    }, {});
  
   
    const highestSpendingCategory = Object.keys(totalByCategory).reduce((max, category) => {
      return totalByCategory[category] > (totalByCategory[max] || 0) ? category : max;
    }, null);
  

    const monthlySpending = expenses.reduce((acc, expense) => {
      const month = new Date(expense.date).toLocaleString('default', { month: 'long' });
      if (!acc[month]) {
        acc[month] = 0;
      }
      acc[month] += expense.amount;
      return acc;
    }, {});
  
    res.json({
      status: 'success',
      data: {
        totalByCategory,
        highestSpendingCategory,
        monthlySpending,
      },
    });
  });
  


nodeCron.schedule('0 0 * * *', () => {
  console.log('Running Cron Job: Monthly Summary');

  const summary = expenses.reduce((acc, expense) => {
    const month = new Date(expense.date).toLocaleString('default', { month: 'long' });

    if (!acc[month]) {
      acc[month] = 0;
    }

    acc[month] += expense.amount;

    return acc;
  }, {});

  console.log('Monthly Summary:', summary);
});


app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
