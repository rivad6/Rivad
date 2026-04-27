import { useLanguage } from '../context/LanguageContext';
import { usePricing } from '../hooks/usePricing';

export function PricingText() {
  const { t } = useLanguage();
  const { rates, loading } = usePricing();

  if (loading) {
    return <span className="animate-pulse">{t('pricing.loading') || 'Calculando tipos de cambio...'}</span>;
  }

  const usd = rates.usd.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  const eur = rates.eur.toLocaleString('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  const btc = rates.btc.toFixed(4);
  const eth = rates.eth.toFixed(3);
  
  const usd_maint = (rates.usd / 10).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  const eur_maint = (rates.eur / 10).toLocaleString('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

  return (
    <span>
      {t('footer.pricing', {
        usd, eur, btc, eth, usd_maint, eur_maint
      })}
    </span>
  );
}
