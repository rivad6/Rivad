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
        // Try fetching fiat rates
        let usdRate = 2000;
        let eurRate = 1850;

        try {
          const fiatRes = await fetch('https://api.exchangerate-api.com/v4/latest/MXN');
          if (fiatRes.ok) {
            const fiatData = await fiatRes.json();
            usdRate = fiatData.rates.USD * 35000;
            eurRate = fiatData.rates.EUR * 35000;
          }
        } catch (e) {
          // Silent fallback for fiat
        }

        // Try fetching crypto rates
        let btcRate = 0.03;
        let ethRate = 0.6;

        try {
          const cryptoRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=mxn');
          if (cryptoRes.ok) {
            const cryptoData = await cryptoRes.json();
            btcRate = 35000 / cryptoData.bitcoin.mxn;
            ethRate = 35000 / cryptoData.ethereum.mxn;
          }
        } catch (e) {
          // Silent fallback for crypto
        }

        setRates({
          usd: usdRate,
          eur: eurRate,
          btc: btcRate,
          eth: ethRate,
        });
      } catch (err) {
        // Overall silent fallback
      } finally {
        setLoading(false);
      }
    };
    fetchRates();
  }, []);

  return { rates, loading };
}
