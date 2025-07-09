'use client';

import { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey, Transaction, SystemProgram } from '@solana/web3.js';

// 🔥 在這裡更新你的設定
const NFT_CONFIG = {
  // 替換為你從 Phantom 複製的錢包地址
  CREATOR_WALLET: "DE4TANizABFabGKiokXTLML53L8rswD213P57HsCCXHb",
  NFT_PRICE: 0.001, // NFT 價格（SOL）- 先設小一點測試
  ROYALTY_PERCENTAGE: 5, // 版稅百分比（5%）
};

export default function Home() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [message, setMessage] = useState<string>('歡迎來到 Solana NFT Demo！');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // 修復 hydration 錯誤
  useEffect(() => {
    setMounted(true);
  }, []);

  // 示例 NFT 資料
  const nftData = {
    name: "Demo NFT #1",
    description: "This is a demo NFT created on Solana",
    // 暫時用測試圖片，你可以替換為 Imgur 連結
    image: "/logo.jpg",
    attributes: [
      { trait_type: "Color", value: "Blue" },
      { trait_type: "Rarity", value: "Common" }
    ]
  };

  const testWallet = async () => {
    if (!publicKey) {
      setMessage('請先連接錢包！');
      return;
    }

    setIsLoading(true);
    try {
      const balance = await connection.getBalance(publicKey);
      const solBalance = balance / 1000000000;
      
      setMessage(`錢包連接成功！\n地址: ${publicKey.toString().slice(0, 8)}...${publicKey.toString().slice(-8)}\n餘額: ${solBalance.toFixed(4)} SOL\n\n💡 你的錢包地址（創作者）:\n${NFT_CONFIG.CREATOR_WALLET.slice(0, 8)}...${NFT_CONFIG.CREATOR_WALLET.slice(-8)}`);
      
      if (solBalance < NFT_CONFIG.NFT_PRICE + 0.01) {
        setMessage(prev => prev + '\n\n⚠️ 餘額不足，請到 faucet.solana.com 獲取 Devnet SOL');
      }
    } catch (error) {
      setMessage('獲取餘額失敗: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const mintNft = async () => {
    if (!publicKey || !sendTransaction) {
      setMessage('請先連接錢包');
      return;
    }

    // 檢查創作者錢包地址是否設定
    if (NFT_CONFIG.CREATOR_WALLET === "把你的錢包地址貼在這裡") {
      setMessage('❌ 請先在代碼中設定你的錢包地址！');
      return;
    }

    setIsLoading(true);
    setMessage('正在檢查餘額...');

    try {
      // 1. 檢查用戶餘額
      const balance = await connection.getBalance(publicKey);
      const solBalance = balance / 1000000000;
      
      if (solBalance < NFT_CONFIG.NFT_PRICE + 0.01) {
        setMessage(`❌ 餘額不足！\n需要: ${NFT_CONFIG.NFT_PRICE + 0.01} SOL\n目前: ${solBalance.toFixed(4)} SOL`);
        return;
      }

      setMessage('餘額充足，正在處理付款...');

      // 2. 創建付款交易
      const creatorWallet = new PublicKey(NFT_CONFIG.CREATOR_WALLET);
      const paymentTransaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: creatorWallet,
          lamports: NFT_CONFIG.NFT_PRICE * 1000000000, // 轉換為 lamports
        })
      );

      // 3. 發送付款
      const { blockhash } = await connection.getLatestBlockhash();
      paymentTransaction.recentBlockhash = blockhash;
      paymentTransaction.feePayer = publicKey;

      const paymentSignature = await sendTransaction(paymentTransaction, connection);
      
      setMessage('付款已發送，等待確認...');

      // 4. 等待付款確認
      await connection.confirmTransaction(paymentSignature);
      
      setMessage('✅ 付款成功！正在鑄造 NFT...');

      // 5. 模擬 NFT 鑄造（真實版本會在這裡創建 NFT）
      setTimeout(() => {
        setMessage(`🎉 NFT 鑄造成功！\n\n💰 付款: ${NFT_CONFIG.NFT_PRICE} SOL\n📝 交易: ${paymentSignature.slice(0, 8)}...${paymentSignature.slice(-8)}\n💎 版稅: ${NFT_CONFIG.ROYALTY_PERCENTAGE}%\n\n在 Solana Explorer 查看:\nhttps://explorer.solana.com/tx/${paymentSignature}?cluster=devnet`);
      }, 2000);

    } catch (err) {
      console.error('Mint error:', err);
      setMessage('❌ 鑄造失敗: ' + (err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClick = () => {
    if (publicKey) {
      testWallet();
    } else {
      setMessage('請先點擊上方的 "Select Wallet" 按鈕連接錢包！');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-blue-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Solana NFT Demo
          </h1>
          <p className="text-gray-300 text-lg">
            準備在 Solana 上鑄造你的第一個 NFT
          </p>
          <p className="text-yellow-300 text-sm mt-2">
            💰 價格: {NFT_CONFIG.NFT_PRICE} SOL | 💎 版稅: {NFT_CONFIG.ROYALTY_PERCENTAGE}%
          </p>
        </div>

        {/* 錢包連接按鈕 */}
        <div className="flex justify-center mb-8">
          {mounted ? (
            <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700" />
          ) : (
            <div className="px-8 py-3 bg-purple-600 text-white rounded-lg">
              Loading Wallet...
            </div>
          )}
        </div>

        {/* NFT 預覽 */}
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg overflow-hidden mb-8">
          <img 
            src={nftData.image} 
            alt={nftData.name}
            className="w-full h-64 object-cover"
          />
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {nftData.name}
            </h2>
            <p className="text-gray-600 mb-4">
              {nftData.description}
            </p>
            <div className="flex flex-wrap gap-2">
              {nftData.attributes.map((attr, index) => (
                <span 
                  key={index}
                  className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                >
                  {attr.trait_type}: {attr.value}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 按鈕區域 */}
        <div className="text-center space-y-4">
          <button
            onClick={handleClick}
            disabled={isLoading}
            className={`px-8 py-3 rounded-lg font-semibold text-white transition-all mr-4 ${
              isLoading 
                ? 'bg-gray-500 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 transform hover:scale-105'
            }`}
          >
            {isLoading ? '檢查中...' : (publicKey ? '檢查錢包' : '測試網站')}
          </button>

          <button
            onClick={mintNft}
            disabled={!publicKey || isLoading}
            className={`px-8 py-3 rounded-lg font-semibold text-white transition-all ${
              !publicKey || isLoading
                ? 'bg-gray-500 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 transform hover:scale-105'
            }`}
          >
            {isLoading ? '處理中...' : `💎 Mint NFT (${NFT_CONFIG.NFT_PRICE} SOL)`}
          </button>
        </div>

        {/* 訊息顯示 */}
        <div className="mt-6 p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded-lg max-w-lg mx-auto text-center whitespace-pre-line text-sm">
          {message}
        </div>

        {/* 說明 */}
        <div className="mt-8 text-center text-gray-300 text-sm">
          <p>這個網站在 Solana Devnet 上運行</p>
          <p>你需要安裝 Phantom 錢包並切換到 Devnet</p>
          <p>
            獲取免費的 Devnet SOL: 
            <a 
              href="https://faucet.solana.com" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline ml-1"
            >
              faucet.solana.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
