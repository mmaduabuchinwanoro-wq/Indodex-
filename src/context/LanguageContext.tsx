import React, { createContext, useContext, useState, ReactNode } from 'react';

export type LanguageCode = 'en' | 'id' | 'es' | 'zh' | 'ja' | 'fr';

export interface CountryOption {
  code: string;
  name: string;
  flag: string;
  fiat: string;
  symbol: string;
  exchangeRateToUsd: number; // e.g. 1 USD = 15,800 IDR
}

export const SUPPORTED_COUNTRIES: CountryOption[] = [
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩', fiat: 'IDR', symbol: 'Rp', exchangeRateToUsd: 15850 },
  { code: 'US', name: 'United States', flag: '🇺🇸', fiat: 'USD', symbol: '$', exchangeRateToUsd: 1 },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', fiat: 'GBP', symbol: '£', exchangeRateToUsd: 0.79 },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', fiat: 'SGD', symbol: 'S$', exchangeRateToUsd: 1.34 },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', fiat: 'JPY', symbol: '¥', exchangeRateToUsd: 152.5 },
  { code: 'DE', name: 'Germany (EU)', flag: '🇩🇪', fiat: 'EUR', symbol: '€', exchangeRateToUsd: 0.92 },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', fiat: 'AUD', symbol: 'A$', exchangeRateToUsd: 1.52 },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', fiat: 'BRL', symbol: 'R$', exchangeRateToUsd: 5.65 },
];

export const DICTIONARY: Record<LanguageCode, Record<string, string>> = {
  en: {
    portfolio: 'Portfolio',
    allAssets: 'All Assets',
    swap: 'Instant Swap',
    history: 'History',
    deposit: 'Receive',
    withdraw: 'Send',
    buy: 'Buy Crypto',
    admin: 'Admin Portal',
    totalBalance: 'Total Wallet Balance',
    hideBalance: 'Hide Balance',
    showBalance: 'Show Balance',
    searchAssets: 'Search cryptocurrency or network...',
    buyHeader: 'Buy Crypto with Fiat',
    buySubtitle: 'Select your local payment gateway & fiat currency',
    country: 'Country',
    language: 'Language',
    networkFeeRequired: 'Network Fee Required',
    pendingApproval: 'Pending Approval',
  },
  id: {
    portfolio: 'Portofolio',
    allAssets: 'Semua Aset',
    swap: 'Tukar Instan',
    history: 'Riwayat',
    deposit: 'Terima',
    withdraw: 'Kirim',
    buy: 'Beli Kripto',
    admin: 'Portal Admin',
    totalBalance: 'Total Saldo Dompet',
    hideBalance: 'Sembunyikan Saldo',
    showBalance: 'Tampilkan Saldo',
    searchAssets: 'Cari kripto atau jaringan...',
    buyHeader: 'Beli Kripto dengan Rupiah/Fiat',
    buySubtitle: 'Pilih gerbang pembayaran lokal & mata uang fiat',
    country: 'Negara',
    language: 'Bahasa',
    networkFeeRequired: 'Biaya Jaringan Diperlukan',
    pendingApproval: 'Menunggu Persetujuan',
  },
  es: {
    portfolio: 'Portafolio',
    allAssets: 'Todos los Activos',
    swap: 'Intercambio',
    history: 'Historial',
    deposit: 'Recibir',
    withdraw: 'Enviar',
    buy: 'Comprar Cripto',
    admin: 'Portal Admin',
    totalBalance: 'Saldo Total de la Billetera',
    hideBalance: 'Ocultar Saldo',
    showBalance: 'Mostrar Saldo',
    searchAssets: 'Buscar criptomoneda o red...',
    buyHeader: 'Comprar Cripto con Fiat',
    buySubtitle: 'Seleccione su pasarela de pago local',
    country: 'País',
    language: 'Idioma',
    networkFeeRequired: 'Tarifa de Red Requerida',
    pendingApproval: 'Pendiente de Aprobación',
  },
  zh: {
    portfolio: '资产组合',
    allAssets: '所有资产',
    swap: '闪兑',
    history: '历史记录',
    deposit: '充值 / 接收',
    withdraw: '提现 / 发送',
    buy: '法币买币',
    admin: '管理门户',
    totalBalance: '钱包总余额',
    hideBalance: '隐藏余额',
    showBalance: '显示余额',
    searchAssets: '搜索加密货币或网络...',
    buyHeader: '使用法币购买加密货币',
    buySubtitle: '选择您本地的支付网关和法币',
    country: '国家',
    language: '语言',
    networkFeeRequired: '需要网络矿工费',
    pendingApproval: '等待管理员批准',
  },
  ja: {
    portfolio: 'ポートフォリオ',
    allAssets: '全資産',
    swap: 'インスタントスワップ',
    history: '履歴',
    deposit: '受取',
    withdraw: '送金',
    buy: '暗号資産を購入',
    admin: '管理者ポータル',
    totalBalance: '総ウォレット残高',
    hideBalance: '非表示',
    showBalance: '表示',
    searchAssets: '暗号資産またはネットワークを検索...',
    buyHeader: '法定通貨で暗号資産を購入',
    buySubtitle: 'お支払い方法と地域を選択してください',
    country: '国',
    language: '言語',
    networkFeeRequired: 'ネットワーク手数料が必要です',
    pendingApproval: '承認待ち',
  },
  fr: {
    portfolio: 'Portefeuille',
    allAssets: 'Tous les Actifs',
    swap: 'Échange Instantané',
    history: 'Historique',
    deposit: 'Recevoir',
    withdraw: 'Envoyer',
    buy: 'Acheter Cripto',
    admin: 'Portail Admin',
    totalBalance: 'Solde Total du Portefeuille',
    hideBalance: 'Masquer le Solde',
    showBalance: 'Afficher le Solde',
    searchAssets: 'Rechercher une crypto ou un réseau...',
    buyHeader: 'Acheter de la Crypto en Fiat',
    buySubtitle: 'Sélectionnez votre passerelle de paiement locale',
    country: 'Pays',
    language: 'Langue',
    networkFeeRequired: 'Frais de Réseau Requis',
    pendingApproval: 'En Attente de Validation',
  },
};

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  selectedCountry: CountryOption;
  setSelectedCountry: (country: CountryOption) => void;
  t: (key: string) => string;
  formatLocalFiat: (usdAmount: number) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<LanguageCode>('id');
  const [selectedCountry, setSelectedCountry] = useState<CountryOption>(SUPPORTED_COUNTRIES[0]); // Default Indonesia IDR

  const t = (key: string): string => {
    return DICTIONARY[language]?.[key] || DICTIONARY.en[key] || key;
  };

  const formatLocalFiat = (usdAmount: number): string => {
    const localVal = usdAmount * selectedCountry.exchangeRateToUsd;
    if (selectedCountry.fiat === 'IDR') {
      return `Rp ${Math.round(localVal).toLocaleString('id-ID')}`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: selectedCountry.fiat,
      maximumFractionDigits: 2,
    }).format(localVal);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        selectedCountry,
        setSelectedCountry,
        t,
        formatLocalFiat,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
