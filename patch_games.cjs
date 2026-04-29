const fs = require('fs');
const path = require('path');

// FestJump complete overhaul
let festJumpPath = path.join(__dirname, 'src/components/games/FestJump.tsx');
let currFest = fs.readFileSync(festJumpPath, 'utf8');

// We will inject a new "Marketing Rewards" tab, improve platforms, add double jump for cyber, 
// and improve rendering.

// 1. Add Marketing Rewards Tab
currFest = currFest.replace(/const \[shopTab, setShopTab\] = useState<'chars' \| 'upgrades'>\('chars'\);/g, "const [shopTab, setShopTab] = useState<'chars' | 'upgrades' | 'rewards'>('chars');\n  const [ownedRewards, setOwnedRewards] = useState<string[]>(() => JSON.parse(localStorage.getItem('fest_rewards') || '[]'));\n  useEffect(() => localStorage.setItem('fest_rewards', JSON.stringify(ownedRewards)), [ownedRewards]);\n\n  const MARKETING_REWARDS = [\n    { id: 'discount20', name: '20% OFF MERCH', desc: 'Valid at literal festival booth', cost: 1000, type: 'discount', code: 'FEST20MERCH' },\n    { id: 'freedrink', name: 'FREE DRINK ENTRY', desc: 'Sponsor: RedEnergy Drink', cost: 2500, type: 'coupon', code: 'ENERGYROCK' },\n    { id: 'vippass', name: 'VIP PIT UPGRADE', desc: 'Access to front stage row', cost: 10000, type: 'ticket', code: 'VIPFRONT26' }\n  ];\n");

// 2. Add Tab Button
currFest = currFest.replace(/<button[^>]*onClick=\{\(\) => \{ playSound\('hover'\); setShopTab\('upgrades'\); \}\}.*?<\/button>/s, 
  "$&" + `
                    <button 
                      onClick={() => { playSound('hover'); setShopTab('rewards'); }} 
                      className={\`flex-1 py-2 text-[8px] font-black uppercase tracking-widest border-b-4 transition-all \${shopTab === 'rewards' ? 'border-brand-accent text-white' : 'border-zinc-800 text-zinc-600'}\`}
                    >
                      Rewards
                    </button>`
);

// 3. Add Rewards Tab UI
currFest = currFest.replace(/\{\s*shopTab === 'chars' \? \(/g, `{shopTab === 'rewards' ? (
                      <div className="grid grid-cols-1 gap-2 pt-2 pb-4">
                        {MARKETING_REWARDS.map((reward) => (
                          <div key={reward.id} className="bg-zinc-900/50 p-3 border border-pink-500/20 rounded-lg flex flex-col gap-2 relative overflow-hidden group hover:border-pink-500/50 transition-all">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-pink-500/5 rounded-bl-full pointer-events-none group-hover:bg-pink-500/10 transition-all"></div>
                            <div className="flex justify-between items-start z-10">
                              <div>
                                <p className="text-[12px] font-black text-pink-400 uppercase tracking-tight">{reward.name}</p>
                                <p className="text-[8px] text-zinc-400 mt-0.5">{reward.desc}</p>
                              </div>
                              {ownedRewards.includes(reward.id) ? (
                                <div className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded border border-green-500/30 text-[8px] font-mono">OWNED</div>
                              ) : (
                                <div className="text-[10px] text-yellow-500 font-bold italic flex items-center gap-1"><Zap className="w-3 h-3" />{reward.cost}</div>
                              )}
                            </div>
                            {ownedRewards.includes(reward.id) ? (
                              <div className="bg-black/50 p-2 rounded border border-white/10 mt-1 flex justify-between items-center z-10 overflow-hidden">
                                <span className="text-[10px] font-mono text-zinc-500">QR / CODE:</span>
                                <span className="text-[12px] font-black text-white tracking-widest select-all">{reward.code}</span>
                              </div>
                            ) : (
                              <button 
                                onClick={() => {
                                  if (festCoins >= reward.cost) {
                                    setFestCoins(prev => prev - reward.cost);
                                    setOwnedRewards(prev => [...prev, reward.id]);
                                    playSound('purchase');
                                    showMsg('REWARD REDEEMED!', 'success');
                                  } else {
                                    playSound('alert');
                                    showMsg('INSUFFICIENT KARMAS', 'error');
                                  }
                                }}
                                disabled={festCoins < reward.cost}
                                className={\`w-full block py-2 text-[8px] font-bold uppercase transition-all z-10 \${festCoins >= reward.cost ? 'bg-pink-500 text-white hover:bg-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.3)]' : 'bg-zinc-800 text-zinc-600'}\`}
                              >
                                CLAIM REWARD
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : shopTab === 'chars' ? (`);

fs.writeFileSync(festJumpPath, currFest);
console.log('FestJump Marketing Rewards added.');
