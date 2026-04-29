const fs = require('fs');
const path = require('path');

let arcFile = path.join(__dirname, 'src/components/Arcade.tsx');
let content = fs.readFileSync(arcFile, 'utf8');

const regex = /\{games\.map\(\(g\) => \([\s\S]*?<\/motion\.button>\s*\)\)\}/;
const replaceWith = `{games.map((g) => (
                  <motion.button
                    key={g.id}
                    onClick={() => handleInsertCartridge(g.id)}
                    whileHover={{ y: -5, scale: 1.02 }}
                    whileTap={{ y: 0, scale: 0.98 }}
                    disabled={powerState === 'off' || powerState === 'booting' || powerState === 'inserting'}
                    className={\`flex-shrink-0 relative w-24 h-24 md:w-32 md:h-32 rounded-sm border-2 border-zinc-700 bg-zinc-800 flex flex-col items-center justify-start p-1.5 md:p-2 shadow-[2px_2px_0_rgba(0,0,0,0.8)] transition-colors overflow-hidden \${activeGame === g.id ? 'border-brand-accent -translate-y-4 shadow-[0_10px_20px_rgba(var(--color-brand-accent-rgb),0.3)]' : 'hover:border-zinc-500'} \${(powerState === 'off' || powerState === 'booting') ? 'opacity-50 cursor-not-allowed' : ''}\`}
                  >
                    {/* Metal Slider */}
                    <div className="absolute top-0 right-4 w-8 h-8 bg-zinc-300 border-x border-b border-zinc-500 rounded-b-sm flex justify-center py-1">
                       <div className="w-3 h-5 bg-zinc-800 rounded-sm"></div>
                    </div>
                    {/* Label Area */}
                    <div className={\`w-full h-12 md:h-16 mt-6 border border-zinc-900 \${g.color} relative overflow-hidden flex flex-col items-center justify-center p-1 rounded-sm shadow-inner\`}>
                      <span className="text-white drop-shadow-md block scale-75 md:scale-100">{g.icon}</span>
                      <span className="text-[7px] md:text-[9px] text-white font-mono font-black text-center z-10 leading-tight tracking-wider uppercase mt-1 drop-shadow-md">{g.label}</span>
                    </div>
                  </motion.button>
                ))}`;

content = content.replace(regex, replaceWith);
fs.writeFileSync(arcFile, content);
console.log("Floppy UI fixed.");
