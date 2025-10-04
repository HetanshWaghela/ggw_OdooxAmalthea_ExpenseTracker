const express = require('express');
const supabase = require('../utils/supabase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all countries with currencies
router.get('/countries', async (req, res) => {
  try {
    const response = await fetch('https://restcountries.com/v3.1/all?fields=name,currencies');
    const countries = await response.json();

    const formattedCountries = countries.map(country => ({
      name: country.name.common,
      currency: Object.keys(country.currencies || {})[0] || 'USD'
    }));

    // Sort countries alphabetically by name
    formattedCountries.sort((a, b) => a.name.localeCompare(b.name));

    res.json({ countries: formattedCountries });
  } catch (error) {
    console.error('Get countries error:', error);
    res.status(500).json({ error: 'Failed to fetch countries' });
  }
});

// Convert currency
router.post('/convert', authenticateToken, async (req, res) => {
  try {
    const { amount, fromCurrency, toCurrency } = req.body;

    if (!amount || !fromCurrency || !toCurrency) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Check if we have cached rate for today
    const today = new Date().toISOString().split('T')[0];
    const { data: cachedRate } = await supabase
      .from('currency_rates')
      .select('rate')
      .eq('base_currency', fromCurrency)
      .eq('target_currency', toCurrency)
      .eq('date', today)
      .single();

    let rate = cachedRate?.rate;

    if (!rate) {
      // Fetch rate from API
      const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
      const data = await response.json();
      rate = data.rates[toCurrency];

      if (rate) {
        // Cache the rate
        await supabase
          .from('currency_rates')
          .insert({
            base_currency: fromCurrency,
            target_currency: toCurrency,
            rate,
            date: today
          });
      }
    }

    const convertedAmount = amount * rate;

    res.json({
      originalAmount: amount,
      originalCurrency: fromCurrency,
      convertedAmount,
      targetCurrency: toCurrency,
      rate
    });
  } catch (error) {
    console.error('Currency conversion error:', error);
    res.status(500).json({ error: 'Failed to convert currency' });
  }
});

// Get exchange rates for a base currency
router.get('/rates/:baseCurrency', async (req, res) => {
  try {
    const { baseCurrency } = req.params;

    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`);
    const data = await response.json();

    res.json({
      baseCurrency: data.base,
      date: data.date,
      rates: data.rates
    });
  } catch (error) {
    console.error('Get exchange rates error:', error);
    res.status(500).json({ error: 'Failed to fetch exchange rates' });
  }
});

module.exports = router;
