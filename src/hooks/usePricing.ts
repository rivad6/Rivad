import { useState, useEffect } from 'react';

interface Rates {
  usd: number;
  eur: number;
  btc: number;
  eth: number;
}

export function usePricing() {
  const [rates, setRates] = useState<Rates>({ usd: 2000, eur: 1850, btc: 0.03, eth: 0.6 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const fiatRes = await fetch('https://api.exchangerate-api.com/v4/latest/MXN');
        const fiatData = await fiatRes.json();
        
        const cryptoRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=mxn');
        const cryptoData = await cryptoRes.json();

        setRates({
          usd: fiatData.rates.USD * 35000,
          eur: fiatData.rates.EUR * 35000,
          btc: 35000 / cryptoData.bitcoin.mxn,
          eth: 35000 / cryptoData.ethereum.mxn,
        });
      } catch (err) {
        console.error("Failed to fetch live rates, using fallback.", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRates();
  }, []);

  return { rates, loading };
}
